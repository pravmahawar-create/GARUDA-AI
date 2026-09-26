const { generateId } = require('./intelligenceSchema');

const SIGNAL_TYPES = {
  LIKED: 'LIKED',
  APPROVED: 'APPROVED',
  KEEP_THIS: 'KEEP_THIS',
  THIS_IS_GOOD: 'THIS_IS_GOOD',
  MAKE_STANDARD: 'MAKE_STANDARD',
  REJECTED: 'REJECTED',
  NEEDS_WORK: 'NEEDS_WORK'
};

const SIGNAL_PATTERNS = {
  LIKED: /\b(?:liked?|like\s+this|good\s+work|nice)\b/i,
  APPROVED: /\b(?:approved?|approve|looks?\s+good|go\s+ahead)\b/i,
  KEEP_THIS: /\b(?:keep\s+this|don't\s+(?:delete|remove)|retain)\b/i,
  THIS_IS_GOOD: /\b(?:this\s+is\s+good|this\s+works|solid|excellent|perfect)\b/i,
  MAKE_STANDARD: /\b(?:make\s+(?:this\s+)?(?:standard|default|canonical|garuda\s+standard))\b/i,
  REJECTED: /\b(?:rejected?|reject|not\s+(?:good|working)|bad|wrong|fix\s+this)\b/i,
  NEEDS_WORK: /\b(?:needs?\s+work|needs?\s+(?:improvement|fixing)|not\s+ready|incomplete)\b/i
};

class FounderSignal {
  constructor(intelligenceBus) {
    this.intelligenceBus = intelligenceBus;
    this.signals = [];
  }

  detectSignal(text) {
    for (const [type, pattern] of Object.entries(SIGNAL_PATTERNS)) {
      if (pattern.test(text)) {
        return { type, matched: text.match(pattern)[0] };
      }
    }
    return null;
  }

  recordSignal(itemId, signalType, founderId = 'founder_praveen', context = '') {
    if (!SIGNAL_TYPES[signalType]) {
      return { error: `Invalid signal type: ${signalType}` };
    }
    const item = this.intelligenceBus ? this.intelligenceBus.getById(itemId) : null;
    const signal = {
      id: generateId(),
      itemId,
      itemType: item ? item.type : 'unknown',
      signalType,
      founderId,
      context,
      timestamp: new Date().toISOString(),
      metadata: {
        itemContent: item ? item.content.substring(0, 200) : 'unknown',
        itemScope: item ? item.scope : 'unknown'
      }
    };
    this.signals.push(signal);
    if (item && (signalType === 'APPROVED' || signalType === 'MAKE_STANDARD' || signalType === 'LIKED')) {
      const trustDelta = signalType === 'MAKE_STANDARD' ? 0.15 : 0.1;
      if (this.intelligenceBus && this.intelligenceBus.confidenceEngine) {
        this.intelligenceBus.confidenceEngine.updateAgentTrust(item.sourceAgent, trustDelta);
      }
    }
    return { success: true, signal };
  }

  autoDetectAndRecord(text, itemId, founderId = 'founder_praveen') {
    const detected = this.detectSignal(text);
    if (!detected) return { detected: false };
    return {
      detected: true,
      ...this.recordSignal(itemId, detected.type, founderId, text)
    };
  }

  getSignalsForItem(itemId) {
    return this.signals.filter(s => s.itemId === itemId);
  }

  getFounderSignalsByType(signalType) {
    return this.signals.filter(s => s.signalType === signalType);
  }

  getApprovalRate() {
    const positive = this.signals.filter(s =>
      ['LIKED', 'APPROVED', 'KEEP_THIS', 'THIS_IS_GOOD', 'MAKE_STANDARD'].includes(s.signalType)
    ).length;
    const total = this.signals.length;
    return total > 0 ? positive / total : 0;
  }

  getStats() {
    const breakdown = {};
    for (const type of Object.keys(SIGNAL_TYPES)) {
      breakdown[type] = this.signals.filter(s => s.signalType === type).length;
    }
    return {
      totalSignals: this.signals.length,
      breakdown,
      approvalRate: (this.getApprovalRate() * 100).toFixed(1) + '%',
      uniqueItems: new Set(this.signals.map(s => s.itemId)).size
    };
  }
}

module.exports = { FounderSignal, SIGNAL_TYPES, SIGNAL_PATTERNS };
