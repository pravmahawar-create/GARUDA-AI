const { INTELLIGENCE_TYPES, PROMOTION_HIERARCHY, VERIFICATION_STATUS } = require('./intelligenceSchema');

class LearningPromoter {
  constructor(intelligenceBus, validationPipeline, confidenceEngine, conflictResolver) {
    this.intelligenceBus = intelligenceBus;
    this.validationPipeline = validationPipeline;
    this.confidenceEngine = confidenceEngine;
    this.conflictResolver = conflictResolver;
    this.promotionLog = [];
  }

  submitAndEvaluate(learningData) {
    const existingConflicts = this.intelligenceBus.detectConflicts({
      ...learningData,
      id: 'temp'
    });
    const submission = this.intelligenceBus.submit(learningData);
    if (!submission.success) {
      return { ...submission, evaluationStatus: 'REJECTED' };
    }
    const item = submission.item;
    const confidence = this.confidenceEngine.calculateConfidence(item);
    item.confidence = confidence.confidence;
    this.intelligenceBus._updateItem(item);
    let conflictResolution = null;
    if (existingConflicts.length > 0 && this.conflictResolver) {
      const primaryConflict = existingConflicts[0];
      const existingItem = primaryConflict.existing;
      const conflict = this.conflictResolver.detectConflict(existingItem, item);
      if (conflict) {
        conflictResolution = this.conflictResolver.resolveConflict(conflict.id);
      }
    }
    const evaluation = {
      itemId: item.id,
      itemType: item.type,
      confidence,
      conflicts: existingConflicts.length,
      conflictResolution,
      promotionEligible: false,
      nextPromotionLevel: null,
      evaluationStatus: 'EVALUATED'
    };
    if (confidence.confidence >= 0.3 && item.type === INTELLIGENCE_TYPES.EXPERIENCE) {
      evaluation.promotionEligible = true;
      evaluation.nextPromotionLevel = INTELLIGENCE_TYPES.LESSON;
    } else if (confidence.confidence >= 0.6 && item.type === INTELLIGENCE_TYPES.LESSON) {
      evaluation.promotionEligible = true;
      evaluation.nextPromotionLevel = INTELLIGENCE_TYPES.RULE;
    } else if (confidence.confidence >= 0.8 && item.type === INTELLIGENCE_TYPES.LESSON) {
      evaluation.promotionEligible = true;
      evaluation.nextPromotionLevel = INTELLIGENCE_TYPES.CAPABILITY;
    } else if (confidence.confidence >= 0.9 && item.type === INTELLIGENCE_TYPES.CAPABILITY) {
      evaluation.promotionEligible = true;
      evaluation.nextPromotionLevel = INTELLIGENCE_TYPES.CANON;
    }
    this.promotionLog.push(evaluation);
    return evaluation;
  }

  promoteLearning(itemId, promotedBy) {
    const item = this.intelligenceBus.getById(itemId);
    if (!item) return { error: `Item ${itemId} not found` };
    const nextIdx = PROMOTION_HIERARCHY.indexOf(item.type) + 1;
    if (nextIdx >= PROMOTION_HIERARCHY.length) {
      return { error: `Cannot promote ${item.type} — already at CANON` };
    }
    const nextType = PROMOTION_HIERARCHY[nextIdx];
    const confidenceCheck = this.confidenceEngine.shouldPromote(item, nextType);
    if (!confidenceCheck.eligible) {
      return { error: confidenceCheck.reason, confidence: confidenceCheck };
    }
    const result = this.intelligenceBus.promote(itemId, promotedBy);
    return result;
  }

  rejectLearning(itemId, reason) {
    const item = this.intelligenceBus.getById(itemId);
    if (!item) return { error: `Item ${itemId} not found` };
    item.verificationStatus = VERIFICATION_STATUS.REJECTED;
    this.intelligenceBus._updateItem(item);
    this.confidenceEngine.recordDecision(item, 'REJECTED', reason);
    return { success: true, itemId, reason };
  }

  getPromotionCandidates(minConfidence = 0.3) {
    const all = this.intelligenceBus.retrieve({ minConfidence });
    return all.filter(item => {
      const nextIdx = PROMOTION_HIERARCHY.indexOf(item.type) + 1;
      if (nextIdx >= PROMOTION_HIERARCHY.length) return false;
      const nextType = PROMOTION_HIERARCHY[nextIdx];
      const check = this.confidenceEngine.shouldPromote(item, nextType);
      return check.eligible;
    });
  }

  getStats() {
    return {
      totalEvaluations: this.promotionLog.length,
      eligibleForPromotion: this.promotionLog.filter(e => e.promotionEligible).length,
      rejected: this.promotionLog.filter(e => e.evaluationStatus === 'REJECTED').length,
      averageConfidence: this.promotionLog.length > 0
        ? this.promotionLog.reduce((sum, e) => sum + e.confidence.confidence, 0) / this.promotionLog.length
        : 0
    };
  }
}

module.exports = { LearningPromoter };
