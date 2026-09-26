const { VERIFICATION_STATUS } = require('../intelligenceSchema');

const CONFLICT_TYPES = {
  EXACT_CONTRADICTION: 'exact_contradiction',
  SCOPE_CONFLICT: 'scope_confidence',
  TEMPORAL_CONFLICT: 'temporal_conflict',
  EVIDENCE_CONFLICT: 'evidence_conflict',
  PROMOTION_CONFLICT: 'promotion_conflict'
};

const RESOLUTION_OUTCOMES = {
  OLD_VALID: 'OLD_VALID',
  NEW_VALID: 'NEW_VALID',
  BOTH_SCOPE_SPECIFIC: 'BOTH_SCOPE_SPECIFIC',
  MERGE: 'MERGE',
  UNKNOWN: 'UNKNOWN'
};

class ConflictResolver {
  constructor(intelligenceBus, confidenceEngine) {
    this.intelligenceBus = intelligenceBus;
    this.confidenceEngine = confidenceEngine;
    this.conflicts = [];
    this.resolutions = [];
  }

  detectConflict(existingItem, newItem) {
    const conflict = {
      id: `conf-${Date.now().toString(36)}`,
      existingItemId: existingItem.id,
      newItemId: newItem.id,
      existingItemType: existingItem.type,
      newItemType: newItem.type,
      detectedAt: new Date().toISOString(),
      conflictTypes: [],
      evidence_old: existingItem.evidence || [],
      evidence_new: newItem.evidence || [],
      existingScope: existingItem.scope,
      newScope: newItem.scope,
      resolved: false,
      resolution: null
    };
    if (existingItem.content === newItem.content && existingItem.type === newItem.type) {
      conflict.conflictTypes.push({
        type: CONFLICT_TYPES.EXACT_CONTRADICTION,
        detail: 'Exact content duplicate at same type level'
      });
    }
    if (existingItem.content !== newItem.content) {
      const negation = /\b(?:never|must not|do not|cannot|don't|isn't|aren't|wasn't|won't)\b/i;
      const affirmation = /\b(?:always|must|should|need to|have to)\b/i;
      const hasNeg1 = negation.test(existingItem.content);
      const hasNeg2 = negation.test(newItem.content);
      const hasAffirm1 = affirmation.test(existingItem.content);
      const hasAffirm2 = affirmation.test(newItem.content);
      const isContradictory = (hasNeg1 && hasAffirm2) || (hasAffirm1 && hasNeg2) || (hasNeg1 !== hasNeg2 && !hasAffirm1 && !hasAffirm2);
      if (isContradictory) {
        const words1 = new Set(existingItem.content.toLowerCase().split(/\s+/));
        const words2 = new Set(newItem.content.toLowerCase().split(/\s+/));
        const overlap = [...words1].filter(w => words2.has(w) && w.length > 4);
        if (overlap.length >= 3) {
          conflict.conflictTypes.push({
            type: CONFLICT_TYPES.EXACT_CONTRADICTION,
            detail: `Contradictory statements with shared terms: ${overlap.slice(0, 5).join(', ')}`
          });
        }
      }
    }
    if (existingItem.scope !== newItem.scope) {
      conflict.conflictTypes.push({
        type: CONFLICT_TYPES.SCOPE_CONFLICT,
        detail: `Scope mismatch: ${existingItem.scope} vs ${newItem.scope}`
      });
    }
    const existingAge = Date.now() - new Date(existingItem.timestamp).getTime();
    const newAge = Date.now() - new Date(newItem.timestamp).getTime();
    if (existingAge > 30 * 24 * 60 * 60 * 1000 && newAge < 24 * 60 * 60 * 1000) {
      conflict.conflictTypes.push({
        type: CONFLICT_TYPES.TEMPORAL_CONFLICT,
        detail: `Existing item is >30 days old, new item is <1 day old`
      });
    }
    if (conflict.conflictTypes.length === 0) {
      return null;
    }
    this.conflicts.push(conflict);
    return conflict;
  }

  resolveConflict(conflictId, resolutionStrategy) {
    const conflict = this.conflicts.find(c => c.id === conflictId);
    if (!conflict) return { error: `Conflict ${conflictId} not found` };
    const existingItem = this.intelligenceBus.getById(conflict.existingItemId);
    const newItem = this.intelligenceBus.getById(conflict.newItemId);
    if (!existingItem || !newItem) {
      return { error: 'One or both items not found in intelligence bus' };
    }
    let resolution;
    switch (resolutionStrategy) {
      case RESOLUTION_OUTCOMES.OLD_VALID:
        resolution = this._resolveOldValid(existingItem, newItem, conflict);
        break;
      case RESOLUTION_OUTCOMES.NEW_VALID:
        resolution = this._resolveNewValid(existingItem, newItem, conflict);
        break;
      case RESOLUTION_OUTCOMES.BOTH_SCOPE_SPECIFIC:
        resolution = this._resolveBothScopeSpecific(existingItem, newItem, conflict);
        break;
      case RESOLUTION_OUTCOMES.MERGE:
        resolution = this._resolveMerge(existingItem, newItem, conflict);
        break;
      default:
        resolution = this._resolveAuto(existingItem, newItem, conflict);
    }
    conflict.resolved = true;
    conflict.resolution = resolution;
    conflict.resolvedAt = new Date().toISOString();
    this.resolutions.push({ conflictId, resolution: resolution.outcome, timestamp: new Date().toISOString() });
    return resolution;
  }

  _resolveOldValid(existing, incoming, conflict) {
    incoming.verificationStatus = VERIFICATION_STATUS.SUPERSEDED;
    this.intelligenceBus._updateItem(incoming);
    return {
      outcome: RESOLUTION_OUTCOMES.OLD_VALID,
      winner: existing.id,
      loser: incoming.id,
      detail: `Existing item ${existing.id} retained. New item ${incoming.id} marked SUPERSEDED.`,
      confidenceComparison: this.confidenceEngine
        ? { existing: this.confidenceEngine.calculateConfidence(existing), incoming: this.confidenceEngine.calculateConfidence(incoming) }
        : null
    };
  }

  _resolveNewValid(existing, incoming, conflict) {
    existing.verificationStatus = VERIFICATION_STATUS.SUPERSEDED;
    this.intelligenceBus._updateItem(existing);
    incoming.verificationStatus = VERIFICATION_STATUS.VERIFIED;
    this.intelligenceBus._updateItem(incoming);
    return {
      outcome: RESOLUTION_OUTCOMES.NEW_VALID,
      winner: incoming.id,
      loser: existing.id,
      detail: `New item ${incoming.id} replaces old item ${existing.id}. Old marked SUPERSEDED.`,
      confidenceComparison: this.confidenceEngine
        ? { existing: this.confidenceEngine.calculateConfidence(existing), incoming: this.confidenceEngine.calculateConfidence(incoming) }
        : null
    };
  }

  _resolveBothScopeSpecific(existing, incoming, conflict) {
    return {
      outcome: RESOLUTION_OUTCOMES.BOTH_SCOPE_SPECIFIC,
      winner: null,
      detail: `Both items kept as scope-specific. Existing: ${existing.id} (scope: ${existing.scope}). Incoming: ${incoming.id} (scope: ${incoming.scope}).`,
      confidenceComparison: this.confidenceEngine
        ? { existing: this.confidenceEngine.calculateConfidence(existing), incoming: this.confidenceEngine.calculateConfidence(incoming) }
        : null
    };
  }

  _resolveMerge(existing, incoming, conflict) {
    const mergedContent = `[MERGED from ${existing.id} + ${incoming.id}]: ${existing.content} | ${incoming.content}`;
    const merged = {
      ...incoming,
      content: mergedContent,
      evidence: [...(existing.evidence || []), ...(incoming.evidence || [])],
      metadata: {
        ...incoming.metadata,
        mergedFrom: [existing.id, incoming.id],
        mergedAt: new Date().toISOString()
      }
    };
    existing.verificationStatus = VERIFICATION_STATUS.SUPERSEDED;
    incoming.verificationStatus = VERIFICATION_STATUS.SUPERSEDED;
    this.intelligenceBus._updateItem(existing);
    this.intelligenceBus._updateItem(incoming);
    const result = this.intelligenceBus.submit({
      type: incoming.type,
      content: mergedContent,
      sourceAgent: incoming.sourceAgent,
      scope: incoming.scope,
      evidence: merged.evidence,
      tags: [...new Set([...(existing.tags || []), ...(incoming.tags || [])])],
      metadata: merged.metadata
    });
    return {
      outcome: RESOLUTION_OUTCOMES.MERGE,
      winner: result.item ? result.item.id : null,
      detail: `Merged into new item. Old items marked SUPERSEDED.`,
      mergedFrom: [existing.id, incoming.id]
    };
  }

  _resolveAuto(existing, incoming, conflict) {
    if (this.confidenceEngine) {
      const result = this.confidenceEngine.resolveConflicts(existing, incoming);
      return this.resolveConflict(conflict.id, result.outcome);
    }
    const existingEvidenceCount = (existing.evidence || []).length;
    const incomingEvidenceCount = (incoming.evidence || []).length;
    if (incomingEvidenceCount > existingEvidenceCount * 1.5) {
      return this.resolveConflict(conflict.id, RESOLUTION_OUTCOMES.NEW_VALID);
    } else if (existingEvidenceCount > incomingEvidenceCount * 1.5) {
      return this.resolveConflict(conflict.id, RESOLUTION_OUTCOMES.OLD_VALID);
    }
    return this.resolveConflict(conflict.id, RESOLUTION_OUTCOMES.BOTH_SCOPE_SPECIFIC);
  }

  getUnresolvedConflicts() {
    return this.conflicts.filter(c => !c.resolved);
  }

  getStats() {
    return {
      totalConflicts: this.conflicts.length,
      resolved: this.resolutions.length,
      unresolved: this.conflicts.filter(c => !c.resolved).length,
      resolutionBreakdown: this.resolutions.reduce((acc, r) => {
        acc[r.resolution] = (acc[r.resolution] || 0) + 1;
        return acc;
      }, {})
    };
  }
}

module.exports = { ConflictResolver, CONFLICT_TYPES, RESOLUTION_OUTCOMES };
