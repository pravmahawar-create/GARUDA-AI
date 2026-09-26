const { VERIFICATION_STATUS } = require('./intelligenceSchema');

const CONFIDENCE_THRESHOLDS = {
  REJECTED: 0.0,
  CANDIDATE: 0.3,
  LOW: 0.4,
  MEDIUM: 0.6,
  HIGH: 0.8,
  CANONICAL: 0.9
};

const EVIDENCE_WEIGHTS = {
  test_pass: 0.15,
  test_fail: -0.2,
  build_success: 0.1,
  build_failure: -0.15,
  runtime_verified: 0.2,
  code_review: 0.1,
  security_review: 0.1,
  founder_approval: 0.25,
  cross_agent_verified: 0.15,
  regression_pass: 0.1,
  regression_fail: -0.25,
  manual_verification: 0.05,
  automated_verification: 0.1,
  multiple_sources: 0.1,
  single_source: -0.05,
  contradicted: -0.3,
  stale_evidence: -0.1
};

const AGENT_TRUST_BASELINE = 0.5;

class ConfidenceEngine {
  constructor() {
    this.agentTrustScores = {};
    this.confidenceHistory = [];
  }

  getAgentTrust(agentId) {
    return this.agentTrustScores[agentId] || AGENT_TRUST_BASELINE;
  }

  updateAgentTrust(agentId, delta) {
    const current = this.getAgentTrust(agentId);
    this.agentTrustScores[agentId] = Math.max(0, Math.min(1, current + delta));
    return this.agentTrustScores[agentId];
  }

  calculateBaseConfidence(item) {
    const agentTrust = this.getAgentTrust(item.sourceAgent);
    let baseConfidence = agentTrust * 0.3;
    if (item.evidence && item.evidence.length > 0) {
      baseConfidence += 0.2;
    }
    if (item.evidence && item.evidence.length >= 3) {
      baseConfidence += 0.1;
    }
    return Math.min(1, baseConfidence);
  }

  applyEvidenceWeights(evidence) {
    let weightDelta = 0;
    const appliedWeights = [];
    for (const ev of evidence) {
      const type = ev.type || ev;
      const weight = EVIDENCE_WEIGHTS[type];
      if (weight !== undefined) {
        weightDelta += weight;
        appliedWeights.push({ type, weight });
      }
    }
    return { weightDelta, appliedWeights };
  }

  calculateConfidence(item) {
    let confidence = this.calculateBaseConfidence(item);
    const { weightDelta, appliedWeights } = this.applyEvidenceWeights(item.evidence || []);
    confidence += weightDelta;
    const ageHours = (Date.now() - new Date(item.timestamp).getTime()) / (1000 * 60 * 60);
    if (ageHours > 720) {
      confidence *= 0.85;
    } else if (ageHours > 168) {
      confidence *= 0.95;
    }
    confidence = Math.max(0, Math.min(1, confidence));
    return {
      confidence,
      level: this.classifyConfidence(confidence),
      evidenceCount: (item.evidence || []).length,
      appliedWeights,
      ageHours: Math.round(ageHours)
    };
  }

  classifyConfidence(confidence) {
    if (confidence >= CONFIDENCE_THRESHOLDS.CANONICAL) return 'CANONICAL';
    if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) return 'HIGH';
    if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'MEDIUM';
    if (confidence >= CONFIDENCE_THRESHOLDS.LOW) return 'LOW';
    if (confidence >= CONFIDENCE_THRESHOLDS.CANDIDATE) return 'CANDIDATE';
    return 'REJECTED';
  }

  shouldPromote(item, targetType) {
    const { confidence, level } = this.calculateConfidence(item);
    const minConfidence = {
      lesson: CONFIDENCE_THRESHOLDS.CANDIDATE,
      rule: CONFIDENCE_THRESHOLDS.MEDIUM,
      capability: CONFIDENCE_THRESHOLDS.HIGH,
      canon: CONFIDENCE_THRESHOLDS.CANONICAL
    };
    const required = minConfidence[targetType] || CONFIDENCE_THRESHOLDS.MEDIUM;
    const eligible = confidence >= required;
    return {
      eligible,
      confidence,
      level,
      required,
      reason: eligible
        ? `Confidence ${confidence.toFixed(2)} meets threshold ${required} for ${targetType}`
        : `Confidence ${confidence.toFixed(2)} below threshold ${required} for ${targetType}`
    };
  }

  resolveConflicts(existingItem, newItem) {
    const existingConf = this.calculateConfidence(existingItem);
    const newConf = this.calculateConfidence(newItem);
    let outcome;
    let winner;
    if (newConf.confidence > existingConf.confidence * 1.2) {
      outcome = 'NEW_VALID';
      winner = newItem;
    } else if (existingConf.confidence > newConf.confidence * 1.2) {
      outcome = 'OLD_VALID';
      winner = existingItem;
    } else {
      outcome = 'BOTH_SCOPE_SPECIFIC';
      winner = null;
    }
    return {
      outcome,
      winner,
      existingConfidence: existingConf.confidence,
      newConfidence: newConf.confidence,
      reason: winner
        ? `${winner.id} has higher confidence`
        : 'Both items have similar confidence — keep both scope-specific'
    };
  }

  recordDecision(item, decision, reason) {
    this.confidenceHistory.push({
      itemId: item.id,
      itemType: item.type,
      decision,
      reason,
      confidence: item.confidence,
      timestamp: new Date().toISOString()
    });
  }

  getStats() {
    return {
      agentTrustScores: { ...this.agentTrustScores },
      decisionsRecorded: this.confidenceHistory.length,
      averageConfidence: this.confidenceHistory.length > 0
        ? this.confidenceHistory.reduce((s, h) => s + h.confidence, 0) / this.confidenceHistory.length
        : 0
    };
  }
}

module.exports = { ConfidenceEngine, CONFIDENCE_THRESHOLDS, EVIDENCE_WEIGHTS };
