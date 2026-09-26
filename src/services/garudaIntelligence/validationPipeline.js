const { VERIFICATION_STATUS, PROMOTION_HIERARCHY } = require('./intelligenceSchema');

const VALIDATION_RULES = [
  {
    id: 'rule_001',
    name: 'ContentNotEmpty',
    description: 'Intelligence item must have non-empty content',
    validate: (item) => ({
      passed: !!(item.content && item.content.trim().length > 0),
      reason: item.content && item.content.trim().length > 0 ? 'Content present' : 'Content is empty'
    })
  },
  {
    id: 'rule_002',
    name: 'HasSourceAgent',
    description: 'Must have a source agent identified',
    validate: (item) => ({
      passed: !!item.sourceAgent && item.sourceAgent !== 'unknown',
      reason: item.sourceAgent && item.sourceAgent !== 'unknown'
        ? `Source: ${item.sourceAgent}`
        : 'Source agent unknown'
    })
  },
  {
    id: 'rule_003',
    name: 'HasEvidence',
    description: 'Must have at least one piece of evidence',
    validate: (item) => ({
      passed: !!(item.evidence && item.evidence.length > 0),
      reason: item.evidence && item.evidence.length > 0
        ? `${item.evidence.length} evidence items`
        : 'No evidence provided'
    })
  },
  {
    id: 'rule_004',
    name: 'ValidType',
    description: 'Must be a valid intelligence type',
    validate: (item) => ({
      passed: PROMOTION_HIERARCHY.includes(item.type),
      reason: PROMOTION_HIERARCHY.includes(item.type)
        ? `Type: ${item.type}`
        : `Invalid type: ${item.type}`
    })
  },
  {
    id: 'rule_005',
    name: 'ValidScope',
    description: 'Scope must be defined',
    validate: (item) => ({
      passed: !!item.scope,
      reason: item.scope ? `Scope: ${item.scope}` : 'No scope defined'
    })
  },
  {
    id: 'rule_006',
    name: 'HasTimestamp',
    description: 'Must have a valid timestamp',
    validate: (item) => {
      const hasTs = !!item.timestamp;
      const isValid = hasTs && !isNaN(new Date(item.timestamp).getTime());
      return {
        passed: isValid,
        reason: isValid ? 'Valid timestamp' : 'Invalid or missing timestamp'
      };
    }
  },
  {
    id: 'rule_007',
    name: 'ConfidenceInRange',
    description: 'Confidence must be between 0 and 1',
    validate: (item) => ({
      passed: typeof item.confidence === 'number' && item.confidence >= 0 && item.confidence <= 1,
      reason: typeof item.confidence === 'number'
        ? `Confidence: ${item.confidence}`
        : 'Confidence not a number'
    })
  },
  {
    id: 'rule_008',
    name: 'NotDuplicateContent',
    description: 'Should not duplicate existing canonical content (checked externally)',
    validate: (item, context) => {
      if (!context || !context.existingItems) return { passed: true, reason: 'No existing items to check' };
      const duplicate = context.existingItems.find(
        ex => ex.content === item.content && ex.type === item.type
      );
      return {
        passed: !duplicate,
        reason: duplicate ? `Duplicate of ${duplicate.id}` : 'No duplicate found'
      };
    }
  },
  {
    id: 'rule_009',
    name: 'Generalizable',
    description: 'Content should be generalizable, not project-specific',
    validate: (item) => {
      const projectSpecific = /client\s+\w+|production\s+(?:db|database)|specific\s+project/i;
      const isSpecific = projectSpecific.test(item.content);
      return {
        passed: !isSpecific,
        reason: isSpecific ? 'Content appears project-specific' : 'Content appears generalizable'
      };
    }
  },
  {
    id: 'rule_010',
    name: 'PromotionEvidence',
    description: 'Promotion-level items need stronger evidence',
    validate: (item) => {
      const higherTypes = ['rule', 'capability', 'canon'];
      if (!higherTypes.includes(item.type)) return { passed: true, reason: 'Not a promotion-level type' };
      const hasStrongEvidence = item.evidence && item.evidence.length >= 2;
      return {
        passed: hasStrongEvidence,
        reason: hasStrongEvidence
          ? `${item.evidence.length} evidence items for ${item.type}`
          : `${item.type} requires at least 2 evidence items, found ${(item.evidence || []).length}`
      };
    }
  }
];

class ValidationPipeline {
  constructor(options = {}) {
    this.rules = options.rules || [...VALIDATION_RULES];
    this.validationLog = [];
  }

  validate(item, context = {}) {
    const results = [];
    let allPassed = true;
    for (const rule of this.rules) {
      try {
        const result = rule.validate(item, context);
        results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          ...result
        });
        if (!result.passed) allPassed = false;
      } catch (err) {
        results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          passed: false,
          reason: `Rule error: ${err.message}`
        });
        allPassed = false;
      }
    }
    const verificationStatus = allPassed
      ? VERIFICATION_STATUS.VERIFIED
      : VERIFICATION_STATUS.REJECTED;
    const validation = {
      itemId: item.id,
      itemType: item.type,
      allPassed,
      verificationStatus,
      results,
      timestamp: new Date().toISOString()
    };
    this.validationLog.push(validation);
    return validation;
  }

  validateForPromotion(item, targetType, context = {}) {
    const baseValidation = this.validate(item, context);
    if (!baseValidation.allPassed) {
      return { ...baseValidation, promotionEligible: false, reason: 'Failed base validation' };
    }
    const currentIdx = PROMOTION_HIERARCHY.indexOf(item.type);
    const targetIdx = PROMOTION_HIERARCHY.indexOf(targetType);
    if (targetIdx !== currentIdx + 1) {
      return {
        ...baseValidation,
        promotionEligible: false,
        reason: `Can only promote one level at a time. ${item.type} -> ${targetType} is not sequential`
      };
    }
    return {
      ...baseValidation,
      promotionEligible: true,
      reason: `Valid for promotion: ${item.type} -> ${targetType}`
    };
  }

  getRejectionReasons(validation) {
    return validation.results
      .filter(r => !r.passed)
      .map(r => ({ rule: r.ruleName, reason: r.reason }));
  }

  getStats() {
    const total = this.validationLog.length;
    const passed = this.validationLog.filter(v => v.allPassed).length;
    return {
      totalValidations: total,
      passed,
      failed: total - passed,
      passRate: total > 0 ? (passed / total * 100).toFixed(1) + '%' : '0%'
    };
  }
}

module.exports = { ValidationPipeline, VALIDATION_RULES };
