const fs = require('fs');
const path = require('path');
const {
  INTELLIGENCE_TYPES,
  PROMOTION_HIERARCHY,
  VERIFICATION_STATUS,
  SCOPE,
  generateId,
  createIntelligenceItem,
  canPromote,
  promoteItem
} = require('./intelligenceSchema');
const { IntelligenceFirewall } = require('./intelligenceFirewall');
const { ConfidenceEngine } = require('./confidenceEngine');
const { ValidationPipeline } = require('./validationPipeline');
const { FileLock, StoreIntegrity, StaleIndexDetector } = require('./concurrentSafety');

const DATA_DIR = path.join(process.cwd(), 'data', 'intelligence');

const STORES = {
  [INTELLIGENCE_TYPES.EXPERIENCE]: 'experiences.jsonl',
  [INTELLIGENCE_TYPES.LESSON]: 'lessons.jsonl',
  [INTELLIGENCE_TYPES.RULE]: 'rules.jsonl',
  [INTELLIGENCE_TYPES.CAPABILITY]: 'capabilities.jsonl',
  [INTELLIGENCE_TYPES.CANON]: 'canon.jsonl'
};

class IntelligenceBus {
  constructor(options = {}) {
    this.dataDir = options.dataDir || DATA_DIR;
    this.firewall = new IntelligenceFirewall();
    this.confidenceEngine = new ConfidenceEngine();
    this.validationPipeline = new ValidationPipeline(options.validation);
    this.index = {};
    this.listeners = [];
    this.staleDetector = new StaleIndexDetector();
    this._ensureDataDir();
    this._loadIndex();
  }

  _ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  _getStorePath(type) {
    return path.join(this.dataDir, STORES[type] || 'unknown.jsonl');
  }

  _loadIndex() {
    this.index = {};
    for (const type of PROMOTION_HIERARCHY) {
      const items = this._readStore(type);
      for (const item of items) {
        this.index[item.id] = item;
      }
    }
    this.staleDetector.snapshotMtimes(this.dataDir, Object.values(STORES));
  }

  _readStore(type) {
    const filePath = this._getStorePath(type);
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf-8').trim();
    if (!content) return [];
    return content.split('\n').filter(Boolean).map(line => {
      try { return JSON.parse(line); }
      catch { return null; }
    }).filter(Boolean);
  }

  _appendStore(type, item) {
    const filePath = this._getStorePath(type);
    const lock = new FileLock(filePath);
    lock.withLock(() => {
      const beforeCount = StoreIntegrity.computeLineCount(filePath);
      fs.appendFileSync(filePath, JSON.stringify(item) + '\n', 'utf-8');
      const verification = StoreIntegrity.verifyWrite(filePath, beforeCount + 1);
      if (!verification.valid) {
        fs.unlinkSync(filePath);
        throw new Error(`Integrity check failed after append: expected ${verification.expected}, got ${verification.actual}`);
      }
    });
  }

  _rewriteStore(type, items) {
    const filePath = this._getStorePath(type);
    const lock = new FileLock(filePath);
    lock.withLock(() => {
      const content = items.map(i => JSON.stringify(i)).join('\n') + '\n';
      fs.writeFileSync(filePath, content, 'utf-8');
      const verification = StoreIntegrity.verifyWrite(filePath, items.length);
      if (!verification.valid) {
        throw new Error(`Integrity check failed after rewrite: expected ${verification.expected}, got ${verification.actual}`);
      }
    });
  }

  _refreshIfStale() {
    const storeNames = Object.values(STORES);
    if (this.staleDetector.isStale(this.dataDir, storeNames)) {
      const changed = this.staleDetector.getChangedFiles(this.dataDir, storeNames);
      const reverseMap = {};
      for (const [type, name] of Object.entries(STORES)) {
        reverseMap[name] = type;
      }
      for (const name of changed) {
        const type = reverseMap[name];
        if (type) {
          const items = this._readStore(type);
          for (const item of items) {
            this.index[item.id] = item;
          }
        }
      }
      this.staleDetector.snapshotMtimes(this.dataDir, storeNames);
      return changed;
    }
    return [];
  }

  _emit(event, data) {
    for (const listener of this.listeners) {
      try { listener(event, data); }
      catch { /* listener errors are non-fatal */ }
    }
  }

  on(listener) {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  // ─── READ ───
  retrieve(options = {}) {
    this._refreshIfStale();
    const { type, tags, query, scope, minConfidence, verificationStatus, sourceAgent, limit } = options;
    let results = [];
    const types = type ? (Array.isArray(type) ? type : [type]) : PROMOTION_HIERARCHY;
    for (const t of types) {
      const items = this._readStore(t);
      results.push(...items);
    }
    if (tags) {
      const tagSet = new Set(Array.isArray(tags) ? tags : [tags]);
      results = results.filter(item => item.tags && item.tags.some(t => tagSet.has(t)));
    }
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(item =>
        item.content.toLowerCase().includes(q) ||
        (item.tags && item.tags.some(t => t.toLowerCase().includes(q)))
      );
    }
    if (scope) results = results.filter(item => item.scope === scope);
    if (sourceAgent) results = results.filter(item => item.sourceAgent === sourceAgent);
    if (verificationStatus) {
      results = results.filter(item => item.verificationStatus === verificationStatus);
    }
    if (minConfidence !== undefined) {
      results = results.filter(item => item.confidence >= minConfidence);
    }
    results.sort((a, b) => b.confidence - a.confidence || new Date(b.timestamp) - new Date(a.timestamp));
    if (limit) results = results.slice(0, limit);
    return results;
  }

  getById(id) {
    return this.index[id] || null;
  }

  search(query) {
    return this.retrieve({ query });
  }

  // ─── WRITE ───
  submit(itemData) {
    const item = createIntelligenceItem(itemData);
    const propagation = this.firewall.evaluatePropagation(item);
    if (!propagation.propagate) {
      this._emit('blocked', { item, reason: propagation.reason });
      return {
        success: false,
        status: 'BLOCKED',
        reason: propagation.reason,
        findings: propagation.findings
      };
    }
    const firewallResult = this.firewall.filterIntelligence(item);
    const filteredItem = firewallResult.item;
    const validation = this.validationPipeline.validate(filteredItem);
    if (!validation.allPassed) {
      filteredItem.verificationStatus = VERIFICATION_STATUS.REJECTED;
      this._emit('rejected', { item: filteredItem, validation });
      return {
        success: false,
        status: 'REJECTED',
        validation,
        reasons: this.validationPipeline.getRejectionReasons(validation)
      };
    }
    filteredItem.verificationStatus = VERIFICATION_STATUS.UNVERIFIED;
    this._appendStore(filteredItem.type, filteredItem);
    this.index[filteredItem.id] = filteredItem;
    this._emit('submitted', { item: filteredItem, firewall: firewallResult });
    return {
      success: true,
      status: 'SUBMITTED',
      item: filteredItem,
      sanitized: firewallResult.sanitized,
      firewallFindings: firewallResult.findings
    };
  }

  // ─── QUERY ───
  hasPattern(pattern) {
    const results = this.retrieve({ query: pattern, minConfidence: CONFIDENCE_THRESHOLDS.CANDIDATE });
    return results.length > 0 ? results[0] : null;
  }

  hasFailure(failureDescription) {
    const results = this.retrieve({
      query: failureDescription,
      type: [INTELLIGENCE_TYPES.LESSON, INTELLIGENCE_TYPES.RULE]
    });
    return results.length > 0 ? results : null;
  }

  getCapabilities(domain) {
    return this.retrieve({
      type: [INTELLIGENCE_TYPES.CAPABILITY, INTELLIGENCE_TYPES.CANON],
      query: domain
    });
  }

  getRules(domain) {
    return this.retrieve({
      type: [INTELLIGENCE_TYPES.RULE, INTELLIGENCE_TYPES.CANON],
      query: domain
    });
  }

  // ─── VALIDATE ───
  validateItem(id) {
    const item = this.getById(id);
    if (!item) return { error: `Item ${id} not found` };
    const validation = this.validationPipeline.validate(item);
    item.verificationStatus = validation.verificationStatus;
    this._updateItem(item);
    this.confidenceEngine.recordDecision(item, validation.verificationStatus, 'validation_pipeline');
    return validation;
  }

  // ─── PROMOTE ───
  promote(id, promotedBy, additionalEvidence = []) {
    const item = this.getById(id);
    if (!item) return { error: `Item ${id} not found` };
    const nextType = PROMOTION_HIERARCHY[PROMOTION_HIERARCHY.indexOf(item.type) + 1];
    if (!nextType) return { error: `Cannot promote ${item.type} — already at CANON` };
    const promotionCheck = this.validationPipeline.validateForPromotion(item, nextType);
    if (!promotionCheck.promotionEligible) {
      return { error: promotionCheck.reason, validation: promotionCheck };
    }
    const confidenceCheck = this.confidenceEngine.shouldPromote(item, nextType);
    if (!confidenceCheck.eligible) {
      return { error: confidenceCheck.reason, confidence: confidenceCheck };
    }
    const promoted = promoteItem(item, promotedBy, additionalEvidence);
    promoted.verificationStatus = VERIFICATION_STATUS.VERIFIED;
    this._removeItem(item);
    this._appendStore(nextType, promoted);
    this.index[promoted.id] = promoted;
    this.confidenceEngine.recordDecision(promoted, 'PROMOTED', `${item.type} -> ${nextType}`);
    this._emit('promoted', { from: item, to: promoted });
    return { success: true, item: promoted };
  }

  // ─── CONFLICT DETECTION ───
  detectConflicts(newItem) {
    const existing = this.retrieve({ query: newItem.content, type: newItem.type });
    const conflicts = [];
    for (const ex of existing) {
      if (ex.id === newItem.id) continue;
      if (ex.content === newItem.content) {
        conflicts.push({ type: 'EXACT_DUPLICATE', existing: ex });
      } else if (this._isContradictory(ex, newItem)) {
        conflicts.push({ type: 'CONTRADICTION', existing: ex });
      }
    }
    return conflicts;
  }

  _isContradictory(item1, item2) {
    const negation = /\b(?:never|always|must not|do not|cannot|don't|isn't|aren't|wasn't|won't)\b/i;
    const content1 = item1.content.toLowerCase();
    const content2 = item2.content.toLowerCase();
    if (content1 === content2) return false;
    const words1 = new Set(content1.split(/\s+/));
    const words2 = new Set(content2.split(/\s+/));
    const common = [...words1].filter(w => words2.has(w) && w.length > 3);
    const hasNeg1 = negation.test(content1);
    const hasNeg2 = negation.test(content2);
    return common.length > 5 && hasNeg1 !== hasNeg2;
  }

  // ─── INTERNAL HELPERS ───
  _removeItem(item) {
    const items = this._readStore(item.type);
    const filtered = items.filter(i => i.id !== item.id);
    this._rewriteStore(item.type, filtered);
    delete this.index[item.id];
  }

  _updateItem(item) {
    const items = this._readStore(item.type);
    const idx = items.findIndex(i => i.id === item.id);
    if (idx >= 0) {
      items[idx] = item;
      this._rewriteStore(item.type, items);
    }
    this.index[item.id] = item;
  }

  // ─── STATS ───
  getStats() {
    const stats = {};
    for (const type of PROMOTION_HIERARCHY) {
      stats[type] = this._readStore(type).length;
    }
    return {
      counts: stats,
      total: Object.values(stats).reduce((a, b) => a + b, 0),
      firewall: this.firewall.getStats(),
      confidence: this.confidenceEngine.getStats(),
      validation: this.validationPipeline.getStats()
    };
  }

  // ─── EXPORT ───
  exportIntelligence() {
    const all = {};
    for (const type of PROMOTION_HIERARCHY) {
      all[type] = this._readStore(type);
    }
    return all;
  }

  // ─── CONCURRENT SAFETY ───
  refreshIndex() {
    this._loadIndex();
    return { refreshed: true, indexSize: Object.keys(this.index).length };
  }

  getFingerprint() {
    return StoreIntegrity.computeStoreFingerprint(this.dataDir, Object.values(STORES));
  }

  verifyIntegrity() {
    const results = {};
    for (const [type, name] of Object.entries(STORES)) {
      const filePath = this._getStorePath(type);
      const items = this._readStore(type);
      const lineCount = StoreIntegrity.computeLineCount(filePath);
      const hash = StoreIntegrity.computeFileHash(filePath);
      results[name] = {
        stored: items.length,
        onDisk: lineCount,
        consistent: items.length === lineCount,
        hash
      };
    }
    const allConsistent = Object.values(results).every(r => r.consistent);
    return { stores: results, allConsistent };
  }
}

const CONFIDENCE_THRESHOLDS = {
  REJECTED: 0.0,
  CANDIDATE: 0.3,
  LOW: 0.4,
  MEDIUM: 0.6,
  HIGH: 0.8,
  CANONICAL: 0.9
};

module.exports = {
  IntelligenceBus,
  INTELLIGENCE_TYPES,
  PROMOTION_HIERARCHY,
  VERIFICATION_STATUS,
  SCOPE,
  CONFIDENCE_THRESHOLDS
};
