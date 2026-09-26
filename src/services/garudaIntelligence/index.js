const { IntelligenceBus, INTELLIGENCE_TYPES, PROMOTION_HIERARCHY, VERIFICATION_STATUS, SCOPE } = require('./intelligenceBus');
const { IntelligenceFirewall } = require('./intelligenceFirewall');
const { ConfidenceEngine, CONFIDENCE_THRESHOLDS, EVIDENCE_WEIGHTS } = require('./confidenceEngine');
const { ValidationPipeline, VALIDATION_RULES } = require('./validationPipeline');
const { NazarEngine, NazarInvestigator, NAZAR_LENSES, RISK_LEVELS, EVIDENCE_STATUS } = require('./nazar/nazarEngine');
const { FileLock, StoreIntegrity, StaleIndexDetector } = require('./concurrentSafety');
const { IndependentReviewer, ReviewerSystem, REVIEWER_TYPES } = require('./reviewers/reviewerSystem');
const { ConflictResolver, CONFLICT_TYPES, RESOLUTION_OUTCOMES } = require('./conflict/conflictResolver');
const { FounderSignal, SIGNAL_TYPES } = require('./founderSignal');
const { MissionState, MISSION_STAGES } = require('./mission/missionState');
const { CheckpointSystem, CHECKPOINT_TYPES } = require('./mission/checkpoint');
const { ContextManager } = require('./context/contextManager');
const { LearningPromoter } = require('./learningPromoter');
const { createIntelligenceItem, canPromote, promoteItem, generateId } = require('./intelligenceSchema');

class GarudaIntelligence {
  constructor(options = {}) {
    this.intelligenceBus = new IntelligenceBus(options);
    this.nazarEngine = new NazarEngine(this.intelligenceBus, options);
    this.reviewerSystem = new ReviewerSystem(this.intelligenceBus);
    this.conflictResolver = new ConflictResolver(this.intelligenceBus, this.intelligenceBus.confidenceEngine);
    this.founderSignal = new FounderSignal(this.intelligenceBus);
    this.missionState = new MissionState(options);
    this.checkpointSystem = new CheckpointSystem(options);
    this.contextManager = new ContextManager();
    this.learningPromoter = new LearningPromoter(
      this.intelligenceBus,
      this.intelligenceBus.validationPipeline,
      this.intelligenceBus.confidenceEngine,
      this.conflictResolver
    );
  }

  retrieve(options) { return this.intelligenceBus.retrieve(options); }
  search(query) { return this.intelligenceBus.search(query); }
  getById(id) { return this.intelligenceBus.getById(id); }
  submit(itemData) { return this.intelligenceBus.submit(itemData); }
  hasPattern(pattern) { return this.intelligenceBus.hasPattern(pattern); }
  hasFailure(desc) { return this.intelligenceBus.hasFailure(desc); }
  getCapabilities(domain) { return this.intelligenceBus.getCapabilities(domain); }
  getRules(domain) { return this.intelligenceBus.getRules(domain); }
  validateItem(id) { return this.intelligenceBus.validateItem(id); }
  promote(id, promotedBy) { return this.intelligenceBus.promote(id, promotedBy); }
  detectConflicts(item) { return this.intelligenceBus.detectConflicts(item); }

  investigate(mission, context) { return this.nazarEngine.investigate(mission, context); }
  runReviewers(target, context, types) { return this.reviewerSystem.runAllReviewers(target, context, types); }
  runSelectiveReview(target, context, risk) { return this.reviewerSystem.runSelectiveReview(target, context, risk); }

  resolveConflict(conflictId, strategy) { return this.conflictResolver.resolveConflict(conflictId, strategy); }
  detectConflict(existing, incoming) { return this.conflictResolver.detectConflict(existing, incoming); }

  recordFounderSignal(itemId, type, context) { return this.founderSignal.recordSignal(itemId, type, 'founder_praveen', context); }

  createMission(goal, options) { return this.missionState.createMission(goal, options); }
  loadMission(id) { return this.missionState.loadMission(id); }
  transitionStage(id, stage, evidence) { return this.missionState.transitionStage(id, stage, evidence); }
  completeMission(id, result) { return this.missionState.completeMission(id, result); }

  createCheckpoint(missionId, type, snapshot, meta) { return this.checkpointSystem.createCheckpoint(missionId, type, snapshot, meta); }
  canResume(missionId) { return this.checkpointSystem.canResume(missionId); }

  createContext(missionId, data) { return this.contextManager.createContext(missionId, data); }
  updateContext(missionId, updates) { return this.contextManager.updateContext(missionId, updates); }

  submitAndEvaluate(learning) { return this.learningPromoter.submitAndEvaluate(learning); }
  promoteLearning(id, by) { return this.learningPromoter.promoteLearning(id, by); }
  rejectLearning(id, reason) { return this.learningPromoter.rejectLearning(id, reason); }

  getStats() {
    return {
      intelligence: this.intelligenceBus.getStats(),
      nazar: this.nazarEngine.getStats(),
      reviewers: this.reviewerSystem.getStats(),
      conflicts: this.conflictResolver.getStats(),
      founderSignals: this.founderSignal.getStats(),
      missions: this.missionState.getStats(),
      checkpoints: this.checkpointSystem.getStats(),
      context: this.contextManager.getStats(),
      learningPromoter: this.learningPromoter.getStats()
    };
  }
}

let defaultGarudaIntelligenceInstance = null;

function getGarudaIntelligence(options = {}) {
  if (!defaultGarudaIntelligenceInstance || Object.keys(options).length > 0) {
    if (Object.keys(options).length > 0) return new GarudaIntelligence(options);
    defaultGarudaIntelligenceInstance = new GarudaIntelligence();
  }
  return defaultGarudaIntelligenceInstance;
}

module.exports = {
  GarudaIntelligence,
  getGarudaIntelligence,
  garudaIntelligence: getGarudaIntelligence(),
  IntelligenceBus,
  IntelligenceFirewall,
  ConfidenceEngine,
  ValidationPipeline,
  NazarEngine,
  ReviewerSystem,
  ConflictResolver,
  FounderSignal,
  MissionState,
  CheckpointSystem,
  ContextManager,
  LearningPromoter,
  INTELLIGENCE_TYPES,
  PROMOTION_HIERARCHY,
  VERIFICATION_STATUS,
  SCOPE,
  CONFIDENCE_THRESHOLDS,
  NAZAR_LENSES,
  RISK_LEVELS,
  EVIDENCE_STATUS,
  NazarInvestigator,
  FileLock,
  StoreIntegrity,
  StaleIndexDetector,
  REVIEWER_TYPES,
  CONFLICT_TYPES,
  RESOLUTION_OUTCOMES,
  SIGNAL_TYPES,
  MISSION_STAGES,
  CHECKPOINT_TYPES,
  createIntelligenceItem,
  canPromote,
  promoteItem,
  generateId
};

