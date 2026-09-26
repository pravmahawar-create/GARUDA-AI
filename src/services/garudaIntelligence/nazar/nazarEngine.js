const { INTELLIGENCE_TYPES } = require('../intelligenceSchema');
const { NazarInvestigator, EVIDENCE_STATUS } = require('./nazarInvestigator');

const NAZAR_LENSES = [
  { id: 1, name: 'INTENT', questions: ['What is the core problem?', 'Who is the actual user?', 'What does success look like?', 'Is the stated goal the real goal?'] },
  { id: 2, name: 'ARCHITECTURE', questions: ['Does this already exist?', 'Will this create duplication?', 'What is the correct placement?', 'Does this align with existing patterns?'] },
  { id: 3, name: 'CODE', questions: ['Are types correct?', 'Are edge cases handled?', 'Are error paths correct?', 'Is the logic sound?'] },
  { id: 4, name: 'DEPENDENCY', questions: ['Are dependencies available?', 'Are versions compatible?', 'Are APIs stable?', 'Are there security advisories?'] },
  { id: 5, name: 'RUNTIME', questions: ['What happens at runtime?', 'Are there race conditions?', 'What is the memory profile?', 'What happens on failure?'] },
  { id: 6, name: 'UX', questions: ['Is the flow intuitive?', 'Are error messages helpful?', 'Is performance acceptable?', 'Does it work on target devices?'] },
  { id: 7, name: 'SECURITY', questions: ['Any injection vulnerabilities?', 'Are secrets managed?', 'Are permissions correct?', 'Are trust boundaries maintained?'] },
  { id: 8, name: 'PERFORMANCE', questions: ['Latency impact?', 'Memory usage?', 'N+1 queries?', 'Concurrency handled?'] },
  { id: 9, name: 'REGRESSION', questions: ['What existing features could break?', 'Are existing tests passing?', 'Shared state conflicts?', 'Backward compatibility?'] },
  { id: 10, name: 'BUSINESS', questions: ['Does this advance GARUDA mission?', 'Is this just adding code?', 'What is the ROI?', 'Does founder want this?'] },
  { id: 11, name: 'TRUTH', questions: ['Are claims backed by evidence?', 'Can we verify this independently?', 'Is this reproducible?', 'What proof exists?'] }
];

const RISK_LEVELS = {
  LOW: { lensCount: 3, label: 'LOW' },
  MEDIUM: { lensCount: 7, label: 'MEDIUM' },
  HIGH: { lensCount: 10, label: 'HIGH' },
  CRITICAL: { lensCount: 11, label: 'CRITICAL' }
};

const RISK_SIGNALS = {
  architecture: { weight: 3, lenses: [2, 9] },
  production: { weight: 4, lenses: [5, 7, 8, 9, 10] },
  security: { weight: 4, lenses: [7, 4] },
  artifact: { weight: 3, lenses: [3, 5, 11] },
  self_modification: { weight: 4, lenses: [2, 3, 7, 9] },
  data_impact: { weight: 3, lenses: [7, 9] },
  cost: { weight: 2, lenses: [8, 10] },
  user_impact: { weight: 2, lenses: [6, 10] },
  regression: { weight: 3, lenses: [9] }
};

class NazarEngine {
  constructor(intelligenceBus, options) {
    this.intelligenceBus = intelligenceBus;
    this.investigationLog = [];
    this.workspaceRoot = (options && options.workspaceRoot) || process.cwd();
    this.investigator = new NazarInvestigator(this.workspaceRoot);
  }

  classifyRisk(missionDescription, context = {}) {
    let riskScore = 0;
    const signals = [];
    for (const [signal, config] of Object.entries(RISK_SIGNALS)) {
      const indicator = new RegExp(signal.replace('_', '\\s*'), 'i');
      if (indicator.test(missionDescription) || context[signal]) {
        riskScore += config.weight;
        signals.push(signal);
      }
    }
    if (context.isProduction || context.production) riskScore += 5;
    if (context.isSecurity || context.security) riskScore += 5;
    if (context.isArtifact || context.artifact) riskScore += 4;
    if (context.isSelfMod || context.selfModification) riskScore += 5;
    let level;
    if (riskScore >= 12) level = RISK_LEVELS.CRITICAL;
    else if (riskScore >= 7) level = RISK_LEVELS.HIGH;
    else if (riskScore >= 3) level = RISK_LEVELS.MEDIUM;
    else level = RISK_LEVELS.LOW;
    return { riskScore, level: level.label, lensCount: level.lensCount, signals };
  }

  selectLenses(riskClassification) {
    const { level, signals } = riskClassification;
    let selectedLensIds = [];
    if (level === 'LOW') selectedLensIds = [1, 3, 10];
    else if (level === 'MEDIUM') selectedLensIds = [1, 2, 3, 5, 7, 9, 10];
    else if (level === 'HIGH') selectedLensIds = [1, 2, 3, 4, 5, 7, 8, 9, 10, 11];
    else selectedLensIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    for (const signal of signals) {
      const config = RISK_SIGNALS[signal];
      if (config) {
        for (const lensId of config.lenses) {
          if (!selectedLensIds.includes(lensId)) selectedLensIds.push(lensId);
        }
      }
    }
    return NAZAR_LENSES.filter(l => selectedLensIds.includes(l.id));
  }

  investigate(missionDescription, context) {
    const riskClassification = this.classifyRisk(missionDescription, context);
    const selectedLenses = this.selectLenses(riskClassification);
    const findings = [];
    const invId = 'inv-' + Date.now().toString(36);
    for (const lens of selectedLenses) {
      const priorIntelligence = this._searchPriorIntelligence(lens, missionDescription);
      const evidenceResult = this._runLensInvestigation(lens.id, missionDescription, context);
      const finding = {
        lensId: lens.id,
        lensName: lens.name,
        questions: lens.questions,
        priorIntelligence,
        evidence: evidenceResult.evidence,
        evidenceConfidence: evidenceResult.confidence,
        answered: true,
        issues: this._extractIssues(evidenceResult.evidence),
        riskLevel: this._classifyFindingRisk(evidenceResult)
      };
      findings.push(finding);
    }
    const investigation = {
      id: invId,
      missionDescription,
      riskClassification,
      selectedLenses: selectedLenses.map(l => l.id),
      findings,
      timestamp: new Date().toISOString(),
      status: 'completed',
      completedAt: new Date().toISOString(),
      totalIssues: findings.reduce((sum, f) => sum + f.issues.length, 0),
      criticalIssues: findings.reduce((sum, f) => sum + f.issues.filter(i => i.severity === 'critical').length, 0)
    };
    const verdict = this._generateVerdict(investigation);
    investigation.verdict = verdict;
    this.investigationLog.push(investigation);
    if (this.intelligenceBus && investigation.totalIssues === 0) {
      try {
        this.intelligenceBus.submit({
          type: INTELLIGENCE_TYPES.EXPERIENCE,
          content: 'Clean investigation: ' + investigation.missionDescription,
          sourceAgent: 'nazar_engine',
          sourceMission: invId,
          scope: 'mission_specific',
          evidence: [{ type: 'nazar_investigation_clean', investigationId: invId }],
          tags: ['investigation', 'clean', verdict.riskLevel.toLowerCase()]
        });
      } catch {}
    }
    return investigation;
  }

  _runLensInvestigation(lensId, missionDescription, context) {
    switch (lensId) {
      case 1: return this.investigator.investigateIntent(missionDescription, context);
      case 2: return this.investigator.investigateArchitecture(missionDescription, context);
      case 3: return this.investigator.investigateCode(missionDescription, context);
      case 4: return this.investigator.investigateDependency(missionDescription, context);
      case 5: return this.investigator.investigateRuntime(missionDescription, context);
      case 6: return { lensId: 6, lensName: 'UX', evidence: [{ type: 'ux_manual', status: EVIDENCE_STATUS.UNKNOWN, finding: 'UX investigation requires target device testing', data: {} }], confidence: 0.2 };
      case 7: return this.investigator.investigateSecurity(missionDescription, context);
      case 8: return this.investigator.investigatePerformance(missionDescription, context);
      case 9: return this.investigator.investigateRegression(missionDescription, context);
      case 10: return this.investigator.investigateBusiness(missionDescription, context);
      case 11: return this.investigator.investigateTruth(missionDescription, context);
      default: return { lensId, lensName: 'UNKNOWN', evidence: [], confidence: 0 };
    }
  }

  _extractIssues(evidence) {
    const issues = [];
    for (const e of evidence) {
      if (e.type === 'syntax_check' && e.data && e.data.syntaxErrors > 0) {
        for (const err of e.data.errors || []) {
          issues.push({ severity: 'critical', source: 'CODE', file: err.file, detail: err.error });
        }
      }
      if (e.type === 'secret_detection' && e.finding && e.finding.includes('ALERT')) {
        issues.push({ severity: 'critical', source: 'SECURITY', detail: e.finding, matches: e.data.matches });
      }
      if (e.type === 'injection_vectors' && e.data && e.data.matches && e.data.matches.length > 0) {
        issues.push({ severity: 'high', source: 'SECURITY', detail: e.finding, matches: e.data.matches });
      }
      if (e.type === 'large_files') {
        issues.push({ severity: 'medium', source: 'PERFORMANCE', detail: e.finding, files: e.data.files });
      }
      if (e.type === 'lockfile_check' && e.status === EVIDENCE_STATUS.PARTIAL) {
        issues.push({ severity: 'low', source: 'DEPENDENCY', detail: 'No lockfile found' });
      }
    }
    return issues;
  }

  _classifyFindingRisk(evidenceResult) {
    if (evidenceResult.confidence >= 0.7) return 'low';
    if (evidenceResult.confidence >= 0.4) return 'medium';
    return 'high';
  }

  _searchPriorIntelligence(lens, missionDescription) {
    if (!this.intelligenceBus) return [];
    const lensTag = lens.name.toLowerCase();
    try {
      return this.intelligenceBus.retrieve({ query: missionDescription, tags: [lensTag], minConfidence: 0.3, limit: 5 });
    } catch { return []; }
  }

  _generateVerdict(investigation) {
    const { totalIssues, criticalIssues, riskClassification } = investigation;
    let verdict;
    if (criticalIssues > 0) verdict = 'BLOCK';
    else if (totalIssues > 5) verdict = 'REVIEW_REQUIRED';
    else if (totalIssues > 0) verdict = 'PROCEED_WITH_CAUTION';
    else verdict = 'CLEAN_PROCEED';
    return { verdict, riskLevel: riskClassification.level, totalIssues, criticalIssues, timestamp: new Date().toISOString() };
  }

  getStats() {
    return {
      totalInvestigations: this.investigationLog.length,
      completed: this.investigationLog.filter(i => i.status === 'completed').length,
      pending: this.investigationLog.filter(i => i.status === 'pending_review').length,
      verdicts: this.investigationLog.reduce((acc, i) => {
        if (i.verdict) acc[i.verdict.verdict] = (acc[i.verdict.verdict] || 0) + 1;
        return acc;
      }, {})
    };
  }

  answerQuestion(investigationId, lensId, questionIndex, answer, issues = []) {
    const investigation = this.investigationLog.find(i => i.id === investigationId);
    if (!investigation) return { error: 'Investigation not found' };
    const finding = investigation.findings.find(f => f.lensId === lensId);
    if (!finding) return { error: 'Lens ' + lensId + ' not found in investigation' };
    finding.answers = finding.answers || [];
    finding.answers[questionIndex] = { answer, timestamp: new Date().toISOString() };
    finding.issues.push(...issues);
    finding.answered = finding.answers.filter(Boolean).length >= finding.questions.length;
    investigation.totalIssues = investigation.findings.reduce((sum, f) => sum + f.issues.length, 0);
    investigation.criticalIssues = investigation.findings.reduce(
      (sum, f) => sum + f.issues.filter(i => i.severity === 'critical').length, 0
    );
    return { success: true, finding, investigation };
  }

  completeInvestigation(investigationId) {
    const investigation = this.investigationLog.find(i => i.id === investigationId);
    if (!investigation) return { error: 'Investigation not found' };
    investigation.status = 'completed';
    investigation.completedAt = new Date().toISOString();
    const verdict = this._generateVerdict(investigation);
    investigation.verdict = verdict;
    if (this.intelligenceBus && investigation.totalIssues === 0) {
      try {
        this.intelligenceBus.submit({
          type: INTELLIGENCE_TYPES.EXPERIENCE,
          content: 'Clean investigation: ' + investigation.missionDescription,
          sourceAgent: 'nazar_engine',
          sourceMission: investigationId,
          scope: 'mission_specific',
          evidence: [{ type: 'nazar_investigation_clean', investigationId }],
          tags: ['investigation', 'clean', verdict.riskLevel.toLowerCase()]
        });
      } catch {}
    }
    return investigation;
  }
}

module.exports = { NazarEngine, NazarInvestigator, NAZAR_LENSES, RISK_LEVELS, RISK_SIGNALS, EVIDENCE_STATUS };
