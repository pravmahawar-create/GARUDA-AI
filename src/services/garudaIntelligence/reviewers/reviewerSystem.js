const REVIEWER_TYPES = {
  ARCHITECTURE: 'architecture_reviewer',
  SECURITY: 'security_reviewer',
  RUNTIME: 'runtime_reviewer',
  UX: 'ux_reviewer',
  PERFORMANCE: 'performance_reviewer',
  REGRESSION: 'regression_reviewer',
  BUSINESS: 'business_reviewer',
  TRUTH_AUDITOR: 'truth_auditor',
  LEARNING_EXTRACTOR: 'learning_extractor'
};

const REVIEWER_CONFIGS = {
  [REVIEWER_TYPES.ARCHITECTURE]: {
    name: 'Architecture Reviewer',
    focus: ['duplication', 'placement', 'patterns', 'scalability', 'coupling'],
    riskCategories: ['architecture'],
    lensIds: [2, 9]
  },
  [REVIEWER_TYPES.SECURITY]: {
    name: 'Security Reviewer',
    focus: ['injection', 'secrets', 'permissions', 'trust_boundaries', 'input_validation'],
    riskCategories: ['security'],
    lensIds: [7, 4]
  },
  [REVIEWER_TYPES.RUNTIME]: {
    name: 'Runtime Reviewer',
    focus: ['actual_behavior', 'race_conditions', 'memory', 'failure_modes', 'edge_cases'],
    riskCategories: ['production'],
    lensIds: [5]
  },
  [REVIEWER_TYPES.UX]: {
    name: 'UX Reviewer',
    focus: ['intuitiveness', 'error_messages', 'performance', 'device_compatibility'],
    riskCategories: ['user_impact'],
    lensIds: [6]
  },
  [REVIEWER_TYPES.PERFORMANCE]: {
    name: 'Performance Reviewer',
    focus: ['latency', 'memory', 'cpu', 'api_calls', 'concurrency'],
    riskCategories: ['cost'],
    lensIds: [8]
  },
  [REVIEWER_TYPES.REGRESSION]: {
    name: 'Regression Reviewer',
    focus: ['existing_features', 'test_coverage', 'shared_state', 'backward_compat'],
    riskCategories: ['regression'],
    lensIds: [9]
  },
  [REVIEWER_TYPES.BUSINESS]: {
    name: 'Business Reviewer',
    focus: ['mission_alignment', 'roi', 'founder_intent', 'value'],
    riskCategories: ['user_impact'],
    lensIds: [10]
  },
  [REVIEWER_TYPES.TRUTH_AUDITOR]: {
    name: 'Truth Auditor',
    focus: ['evidence', 'verification', 'reproducibility', 'claims'],
    riskCategories: ['artifact'],
    lensIds: [11]
  },
  [REVIEWER_TYPES.LEARNING_EXTRACTOR]: {
    name: 'Learning Extractor',
    focus: ['patterns', 'reusable_knowledge', 'lessons', 'capabilities'],
    riskCategories: [],
    lensIds: []
  }
};

class IndependentReviewer {
  constructor(type, intelligenceBus) {
    const config = REVIEWER_CONFIGS[type];
    if (!config) throw new Error(`Unknown reviewer type: ${type}`);
    this.type = type;
    this.config = config;
    this.intelligenceBus = intelligenceBus;
    this.reviewLog = [];
  }

  review(target, context = {}) {
    const review = {
      id: `rev-${Date.now().toString(36)}`,
      reviewerType: this.type,
      reviewerName: this.config.name,
      targetId: target.id || target.missionId || 'unknown',
      targetType: target.type || 'unknown',
      timestamp: new Date().toISOString(),
      findings: [],
      verdict: null,
      recommendations: []
    };
    for (const focus of this.config.focus) {
      const finding = this._analyzeFocus(target, focus, context);
      if (finding) review.findings.push(finding);
    }
    if (this.intelligenceBus) {
      const priorKnowledge = this.intelligenceBus.retrieve({
        tags: [this.type.replace('_reviewer', ''), ...this.config.focus.slice(0, 2)],
        minConfidence: 0.5,
        limit: 3
      });
      review.priorKnowledge = priorKnowledge;
    }
    review.verdict = this._generateVerdict(review.findings);
    review.recommendations = this._generateRecommendations(review.findings);
    this.reviewLog.push(review);
    return review;
  }

  _analyzeFocus(target, focus, context) {
    const content = target.content || target.description || target.missionDescription || '';
    const focusIndicators = {
      duplication: /duplicate|already exists|redundant|same thing/i,
      placement: /where.*belong|correct.*location|architectural.*placement/i,
      injection: /inject|xss|sql.*inject|command.*inject/i,
      secret: /password|api.?key|token|secret|credential/i,
      race_condition: /race|concurrent|parallel|atomic/i,
      memory: /memory|leak|heap|garbage/i,
      latency: /latency|slow|timeout|delay/i,
      evidence: /evidence|proof|verified|reproducible/i,
      mission_alignment: /mission|goal|purpose|value/i
    };
    const indicator = focusIndicators[focus];
    if (indicator && indicator.test(content)) {
      return {
        focus,
        severity: 'warning',
        detail: `Detected potential ${focus} concern`,
        indicator: indicator.source
      };
    }
    if (context[`has_${focus}`]) {
      return {
        focus,
        severity: context[`severity_${focus}`] || 'info',
        detail: context[`detail_${focus}`] || `${focus} flagged in context`,
        indicator: 'context_flag'
      };
    }
    return null;
  }

  _generateVerdict(findings) {
    const critical = findings.filter(f => f.severity === 'critical');
    const warnings = findings.filter(f => f.severity === 'warning');
    if (critical.length > 0) return 'BLOCK';
    if (warnings.length > 2) return 'REVIEW_REQUIRED';
    if (warnings.length > 0) return 'PROCEED_WITH_CAUTION';
    return 'APPROVED';
  }

  _generateRecommendations(findings) {
    return findings.map(f => ({
      area: f.focus,
      action: `Address ${f.focus}: ${f.detail}`,
      priority: f.severity === 'critical' ? 'high' : 'medium'
    }));
  }

  getStats() {
    return {
      type: this.type,
      totalReviews: this.reviewLog.length,
      verdicts: this.reviewLog.reduce((acc, r) => {
        acc[r.verdict] = (acc[r.verdict] || 0) + 1;
        return acc;
      }, {})
    };
  }
}

class ReviewerSystem {
  constructor(intelligenceBus) {
    this.intelligenceBus = intelligenceBus;
    this.reviewers = {};
    this.aggregatedResults = [];
    for (const type of Object.values(REVIEWER_TYPES)) {
      this.reviewers[type] = new IndependentReviewer(type, intelligenceBus);
    }
  }

  runAllReviewers(target, context = {}, reviewerTypes = null) {
    const types = reviewerTypes || Object.values(REVIEWER_TYPES);
    const reviews = [];
    for (const type of types) {
      if (this.reviewers[type]) {
        const review = this.reviewers[type].review(target, context);
        reviews.push(review);
      }
    }
    const aggregated = this._aggregateReviews(reviews);
    this.aggregatedResults.push(aggregated);
    return aggregated;
  }

  runSelectiveReview(target, context = {}, riskLevel = 'MEDIUM') {
    const reviewerMap = {
      LOW: [REVIEWER_TYPES.TRUTH_AUDITOR, REVIEWER_TYPES.BUSINESS],
      MEDIUM: [REVIEWER_TYPES.ARCHITECTURE, REVIEWER_TYPES.REGRESSION, REVIEWER_TYPES.TRUTH_AUDITOR, REVIEWER_TYPES.BUSINESS],
      HIGH: [REVIEWER_TYPES.ARCHITECTURE, REVIEWER_TYPES.SECURITY, REVIEWER_TYPES.RUNTIME, REVIEWER_TYPES.PERFORMANCE, REVIEWER_TYPES.REGRESSION, REVIEWER_TYPES.TRUTH_AUDITOR],
      CRITICAL: Object.values(REVIEWER_TYPES)
    };
    const types = reviewerMap[riskLevel] || reviewerMap.MEDIUM;
    return this.runAllReviewers(target, context, types);
  }

  _aggregateReviews(reviews) {
    const verdictCounts = reviews.reduce((acc, r) => {
      acc[r.verdict] = (acc[r.verdict] || 0) + 1;
      return acc;
    }, {});
    let overallVerdict;
    if (verdictCounts.BLOCK > 0) overallVerdict = 'BLOCK';
    else if (verdictCounts.REVIEW_REQUIRED > 0) overallVerdict = 'REVIEW_REQUIRED';
    else if (verdictCounts.PROCEED_WITH_CAUTION > 0) overallVerdict = 'PROCEED_WITH_CAUTION';
    else overallVerdict = 'ALL_APPROVED';
    const allFindings = reviews.flatMap(r => r.findings.map(f => ({ ...f, reviewer: r.reviewerType })));
    const allRecommendations = reviews.flatMap(r => r.recommendations.map(rec => ({ ...rec, reviewer: r.reviewerType })));
    return {
      id: `agg-${Date.now().toString(36)}`,
      overallVerdict,
      reviewerCount: reviews.length,
      verdictCounts,
      reviews,
      allFindings,
      allRecommendations,
      timestamp: new Date().toISOString()
    };
  }

  getStats() {
    const stats = {};
    for (const [type, reviewer] of Object.entries(this.reviewers)) {
      stats[type] = reviewer.getStats();
    }
    return {
      reviewers: stats,
      totalAggregations: this.aggregatedResults.length
    };
  }
}

module.exports = { IndependentReviewer, ReviewerSystem, REVIEWER_TYPES, REVIEWER_CONFIGS };
