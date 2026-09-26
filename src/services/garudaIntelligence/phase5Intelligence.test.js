const path = require('path');
const fs = require('fs');
const {
  GarudaIntelligence,
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
  createIntelligenceItem,
  canPromote,
  promoteItem,
  generateId
} = require('./index');

const TEST_DATA_DIR = path.join(__dirname, '_test_intelligence_data');

function cleanupTestData() {
  if (fs.existsSync(TEST_DATA_DIR)) {
    fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
  }
}

function createTestBus() {
  return new IntelligenceBus({ dataDir: TEST_DATA_DIR });
}

// ─── SCHEMA TESTS ───
function testSchema() {
  console.log('\n=== TEST: Intelligence Schema ===');
  let passed = 0;
  let failed = 0;

  // generateId
  const id = generateId();
  if (id.startsWith('int-')) { passed++; } else { failed++; console.log('FAIL: generateId format'); }

  // createIntelligenceItem
  const item = createIntelligenceItem({
    type: INTELLIGENCE_TYPES.EXPERIENCE,
    content: 'Build failed because of missing dependency',
    sourceAgent: 'test_agent',
    sourceMission: 'mission-001',
    scope: SCOPE.AGENT_LOCAL,
    evidence: [{ type: 'test_pass' }],
    tags: ['build', 'failure']
  });
  if (item.id && item.type === 'experience' && item.content === 'Build failed because of missing dependency') { passed++; } else { failed++; console.log('FAIL: createIntelligenceItem basic'); }
  if (item.verificationStatus === VERIFICATION_STATUS.UNVERIFIED) { passed++; } else { failed++; console.log('FAIL: initial verification status'); }
  if (item.version === 1) { passed++; } else { failed++; console.log('FAIL: initial version'); }

  // Invalid type
  try {
    createIntelligenceItem({ type: 'invalid', content: 'test' });
    failed++; console.log('FAIL: should reject invalid type');
  } catch { passed++; }

  // Empty content
  try {
    createIntelligenceItem({ type: INTELLIGENCE_TYPES.EXPERIENCE, content: '' });
    failed++; console.log('FAIL: should reject empty content');
  } catch { passed++; }

  // canPromote
  if (canPromote('experience', 'lesson') && canPromote('lesson', 'rule') && canPromote('rule', 'capability') && canPromote('capability', 'canon')) { passed++; } else { failed++; console.log('FAIL: canPromote valid'); }
  if (!canPromote('experience', 'rule') && !canPromote('canon', 'experience')) { passed++; } else { failed++; console.log('FAIL: canPromote invalid'); }

  // promoteItem
  const promoted = promoteItem(item, 'validator', [{ type: 'cross_agent_verified' }]);
  if (promoted.type === 'lesson' && promoted.version === 2 && promoted.validatedBy === 'validator') { passed++; } else { failed++; console.log('FAIL: promoteItem'); }

  console.log(`Schema: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

// ─── FIREWALL TESTS ───
function testFirewall() {
  console.log('\n=== TEST: Intelligence Firewall ===');
  let passed = 0;
  let failed = 0;
  const fw = new IntelligenceFirewall();

  // Clean content
  const clean = fw.scanForSecrets('When X configuration exists, check Y before build');
  if (clean.length === 0) { passed++; } else { failed++; console.log('FAIL: clean content'); }

  // API key detection
  const secrets1 = fw.scanForSecrets('api_key = "sk-1234567890abcdef"');
  if (secrets1.length > 0 && secrets1[0].label === 'API_KEY') { passed++; } else { failed++; console.log('FAIL: API key detection'); }

  // Password detection
  const secrets2 = fw.scanForSecrets('password = "supersecret123"');
  if (secrets2.length > 0) { passed++; } else { failed++; console.log('FAIL: password detection'); }

  // Mongo URI
  const secrets3 = fw.scanForSecrets('mongodb+srv://user:pass@cluster.mongodb.net/db');
  if (secrets3.length > 0 && secrets3[0].label === 'MONGO_URI') { passed++; } else { failed++; console.log('FAIL: mongo URI detection'); }

  // Sanitize
  const { sanitized, wasModified } = fw.sanitizeContent('api_key = "sk-secret123" and normal text');
  if (wasModified && sanitized.includes('[REDACTED_API_KEY]')) { passed++; } else { failed++; console.log('FAIL: sanitize content'); }

  // Filter intelligence
  const item = createIntelligenceItem({
    type: INTELLIGENCE_TYPES.EXPERIENCE,
    content: 'Use api_key = "sk-test123" for testing',
    sourceAgent: 'test'
  });
  const result = fw.filterIntelligence(item);
  if (result.allowed && result.sanitized) { passed++; } else { failed++; console.log('FAIL: filter intelligence'); }

  // Propagation
  const cleanItem = createIntelligenceItem({
    type: INTELLIGENCE_TYPES.LESSON,
    content: 'Always verify dependencies before build',
    sourceAgent: 'test',
    scope: SCOPE.GARUDA_WIDE
  });
  const prop = fw.evaluatePropagation(cleanItem);
  if (prop.propagate) { passed++; } else { failed++; console.log('FAIL: clean propagation'); }

  const secretItem = createIntelligenceItem({
    type: INTELLIGENCE_TYPES.LESSON,
    content: 'Client password = "abc123secret"',
    sourceAgent: 'test'
  });
  const prop2 = fw.evaluatePropagation(secretItem);
  if (!prop2.propagate) { passed++; } else { failed++; console.log('FAIL: secret blocking'); }

  console.log(`Firewall: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

// ─── CONFIDENCE ENGINE TESTS ───
function testConfidence() {
  console.log('\n=== TEST: Confidence Engine ===');
  let passed = 0;
  let failed = 0;
  const ce = new ConfidenceEngine();

  // Base confidence
  const item = createIntelligenceItem({
    type: INTELLIGENCE_TYPES.EXPERIENCE,
    content: 'Build failed due to missing package',
    sourceAgent: 'test_agent',
    evidence: [{ type: 'test_pass' }, { type: 'build_success' }]
  });
  const conf = ce.calculateConfidence(item);
  if (conf.confidence > 0 && conf.confidence <= 1) { passed++; } else { failed++; console.log('FAIL: confidence range'); }
  if (conf.level) { passed++; } else { failed++; console.log('FAIL: confidence level'); }

  // Agent trust
  const initialTrust = ce.getAgentTrust('new_agent');
  if (initialTrust === 0.5) { passed++; } else { failed++; console.log('FAIL: initial trust'); }
  ce.updateAgentTrust('test_agent', 0.2);
  if (ce.getAgentTrust('test_agent') === 0.7) { passed++; } else { failed++; console.log('FAIL: update trust'); }

  // Should promote
  item.confidence = 0.8;
  const promo = ce.shouldPromote(item, 'rule');
  if (promo && typeof promo.eligible === 'boolean') { passed++; } else { failed++; console.log('FAIL: shouldPromote'); }

  // Conflict resolution
  const item1 = createIntelligenceItem({
    type: INTELLIGENCE_TYPES.LESSON,
    content: 'Always use feature flags',
    sourceAgent: 'agent_a',
    evidence: [{ type: 'test_pass' }, { type: 'code_review' }, { type: 'runtime_verified' }, { type: 'cross_agent_verified' }]
  });
  const item2 = createIntelligenceItem({
    type: INTELLIGENCE_TYPES.LESSON,
    content: 'Never use feature flags',
    sourceAgent: 'agent_b',
    evidence: [{ type: 'test_pass' }]
  });
  item1.confidence = 0.9;
  item2.confidence = 0.3;
  const conflict = ce.resolveConflicts(item1, item2);
  if (conflict.outcome === 'OLD_VALID') { passed++; } else { failed++; console.log(`FAIL: conflict resolution got ${conflict.outcome}`); }

  console.log(`Confidence: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

// ─── VALIDATION PIPELINE TESTS ───
function testValidation() {
  console.log('\n=== TEST: Validation Pipeline ===');
  let passed = 0;
  let failed = 0;
  const vp = new ValidationPipeline();

  // Valid item
  const goodItem = createIntelligenceItem({
    type: INTELLIGENCE_TYPES.EXPERIENCE,
    content: 'Build failed because of X',
    sourceAgent: 'test_agent',
    evidence: [{ type: 'test_pass' }]
  });
  const v1 = vp.validate(goodItem);
  if (v1.allPassed) { passed++; } else { failed++; console.log('FAIL: valid item validation'); }

  // Invalid - no evidence
  const badItem = createIntelligenceItem({
    type: INTELLIGENCE_TYPES.LESSON,
    content: 'Always do X',
    sourceAgent: 'test_agent',
    evidence: []
  });
  const v2 = vp.validate(badItem);
  if (!v2.allPassed) { passed++; } else { failed++; console.log('FAIL: no evidence validation'); }

  // Promotion validation
  const promoItem = createIntelligenceItem({
    type: INTELLIGENCE_TYPES.EXPERIENCE,
    content: 'Test pattern works',
    sourceAgent: 'test_agent',
    evidence: [{ type: 'test_pass' }, { type: 'build_success' }]
  });
  const v3 = vp.validateForPromotion(promoItem, INTELLIGENCE_TYPES.LESSON);
  if (v3.promotionEligible) { passed++; } else { failed++; console.log('FAIL: promotion validation'); }

  // Invalid promotion (skip level)
  const v4 = vp.validateForPromotion(promoItem, INTELLIGENCE_TYPES.RULE);
  if (!v4.promotionEligible) { passed++; } else { failed++; console.log('FAIL: skip-level promotion'); }

  // Stats
  const stats = vp.getStats();
  if (stats.totalValidations >= 3) { passed++; } else { failed++; console.log('FAIL: validation stats'); }

  console.log(`Validation: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

// ─── INTELLIGENCE BUS TESTS ───
function testIntelligenceBus() {
  console.log('\n=== TEST: Intelligence Bus ===');
  let passed = 0;
  let failed = 0;
  const bus = createTestBus();

  // Submit
  const result = bus.submit({
    type: INTELLIGENCE_TYPES.EXPERIENCE,
    content: 'Build failed because of missing TypeScript config',
    sourceAgent: 'agent_a',
    sourceMission: 'mission-001',
    evidence: [{ type: 'build_failure' }],
    tags: ['build', 'typescript']
  });
  if (result.success && result.item.id) { passed++; } else { failed++; console.log('FAIL: submit experience'); }

  // Retrieve
  const items = bus.retrieve({ type: INTELLIGENCE_TYPES.EXPERIENCE });
  if (items.length >= 1) { passed++; } else { failed++; console.log('FAIL: retrieve experience'); }

  // Search
  const found = bus.search('TypeScript config');
  if (found.length >= 1) { passed++; } else { failed++; console.log('FAIL: search'); }

  // Query - hasPattern
  const pattern = bus.hasPattern('missing TypeScript');
  if (pattern) { passed++; } else { failed++; console.log('FAIL: hasPattern'); }

  // Validate
  const validation = bus.validateItem(result.item.id);
  if (validation.allPassed) { passed++; } else { failed++; console.log('FAIL: validate item'); }

  // Submit lesson
  const lessonResult = bus.submit({
    type: INTELLIGENCE_TYPES.LESSON,
    content: 'When Build failed due to missing TypeScript config, check tsconfig.json exists before build',
    sourceAgent: 'agent_a',
    evidence: [{ type: 'test_pass' }, { type: 'build_success' }],
    tags: ['typescript', 'build', 'pre_check']
  });
  if (lessonResult.success) { passed++; } else { failed++; console.log('FAIL: submit lesson'); }

  // Query - hasFailure (after lesson is submitted)
  const failures = bus.hasFailure('Build failed');
  if (failures) { passed++; } else { failed++; console.log('FAIL: hasFailure'); }

  // Promote
  if (lessonResult.item) {
    lessonResult.item.confidence = 0.7;
    bus._updateItem(lessonResult.item);
    const promoResult = bus.promote(lessonResult.item.id, 'validator');
    if (promoResult.success && promoResult.item.type === 'rule') { passed++; } else { failed++; console.log('FAIL: promote lesson to rule'); }
  }

  // Stats
  const stats = bus.getStats();
  if (stats.total >= 1) { passed++; } else { failed++; console.log('FAIL: stats'); }

  // Block secrets
  const secretResult = bus.submit({
    type: INTELLIGENCE_TYPES.EXPERIENCE,
    content: 'api_key = "sk-1234567890abcdef" and my secret token = "abc123"',
    sourceAgent: 'agent_a',
    evidence: [{ type: 'test_pass' }]
  });
  if (secretResult.status === 'BLOCKED' || (secretResult.item && secretResult.item.metadata && secretResult.item.metadata.firewallApplied)) { passed++; } else { failed++; console.log('FAIL: secret blocking in bus'); }

  console.log(`Intelligence Bus: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

// ─── NAZAR ENGINE TESTS ───
function testNazarEngine() {
  console.log('\n=== TEST: 10/11-Nazar Engine ===');
  let passed = 0;
  let failed = 0;
  const bus = createTestBus();
  const nazar = new NazarEngine(bus);

  // Risk classification - LOW
  const low = nazar.classifyRisk('add a comment to README');
  if (low.level === 'LOW' && low.lensCount <= 3) { passed++; } else { failed++; console.log('FAIL: low risk'); }

  // Risk classification - HIGH
  const high = nazar.classifyRisk('deploy production security patch', { isProduction: true, security: true });
  if (high.level === 'CRITICAL' || high.level === 'HIGH') { passed++; } else { failed++; console.log('FAIL: high risk classification'); }

  // Lens selection
  const lenses = nazar.selectLenses({ level: 'LOW', signals: [] });
  if (lenses.length <= 3) { passed++; } else { failed++; console.log('FAIL: low lens count'); }
  const highLenses = nazar.selectLenses({ level: 'CRITICAL', signals: ['security', 'production'] });
  if (highLenses.length >= 10) { passed++; } else { failed++; console.log('FAIL: high lens count'); }

  // Investigation
  const investigation = nazar.investigate('Add new Android APK build pipeline');
  if (investigation.id && investigation.findings.length > 0) { passed++; } else { failed++; console.log('FAIL: investigation creation'); }

  // Answer questions
  if (investigation.findings.length > 0) {
    const lens = investigation.findings[0];
    const answerResult = nazar.answerQuestion(investigation.id, lens.lensId, 0, 'Core problem is APK build automation');
    if (answerResult.success) { passed++; } else { failed++; console.log('FAIL: answer question'); }
  }

  // Complete investigation
  const completed = nazar.completeInvestigation(investigation.id);
  if (completed.verdict && completed.status === 'completed') { passed++; } else { failed++; console.log('FAIL: complete investigation'); }

  // Stats
  const stats = nazar.getStats();
  if (stats.totalInvestigations >= 1) { passed++; } else { failed++; console.log('FAIL: nazar stats'); }

  console.log(`Nazar Engine: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

// ─── REVIEWER SYSTEM TESTS ───
function testReviewerSystem() {
  console.log('\n=== TEST: Reviewer System ===');
  let passed = 0;
  let failed = 0;
  const bus = createTestBus();
  const rs = new ReviewerSystem(bus);

  const target = {
    id: 'item-001',
    type: 'code_patch',
    content: 'Added new authentication middleware with JWT validation',
    description: 'Security patch for auth flow'
  };

  // Run all reviewers
  const agg = rs.runAllReviewers(target);
  if (agg.id && agg.reviewerCount > 0) { passed++; } else { failed++; console.log('FAIL: run all reviewers'); }
  if (agg.overallVerdict) { passed++; } else { failed++; console.log('FAIL: overall verdict'); }

  // Selective review
  const selective = rs.runSelectiveReview(target, {}, 'LOW');
  if (selective.reviewerCount <= 3) { passed++; } else { failed++; console.log('FAIL: selective review LOW'); }

  const highSelective = rs.runSelectiveReview(target, { security: true }, 'HIGH');
  if (highSelective.reviewerCount >= 5) { passed++; } else { failed++; console.log('FAIL: selective review HIGH'); }

  // Stats
  const stats = rs.getStats();
  if (stats.totalAggregations >= 1) { passed++; } else { failed++; console.log('FAIL: reviewer stats'); }

  console.log(`Reviewer System: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

// ─── CONFLICT RESOLVER TESTS ───
function testConflictResolver() {
  console.log('\n=== TEST: Conflict Resolver ===');
  let passed = 0;
  let failed = 0;
  const bus = createTestBus();
  const cr = new ConflictResolver(bus, bus.confidenceEngine);

  // Submit two conflicting items
  const r1 = bus.submit({
    type: INTELLIGENCE_TYPES.LESSON,
    content: 'Always use feature flags for deployments',
    sourceAgent: 'agent_a',
    evidence: [{ type: 'test_pass' }, { type: 'code_review' }],
    tags: ['deployment']
  });
  const r2 = bus.submit({
    type: INTELLIGENCE_TYPES.LESSON,
    content: 'Never use feature flags for deployments',
    sourceAgent: 'agent_b',
    evidence: [{ type: 'test_pass' }],
    tags: ['deployment']
  });

  if (r1.success && r2.success) {
    // Detect conflict
    const conflict = cr.detectConflict(r1.item, r2.item);
    if (conflict && conflict.conflictTypes.length > 0) { passed++; } else { failed++; console.log('FAIL: detect conflict'); }

    // Resolve - keep old
    const resolution = cr.resolveConflict(conflict.id, 'OLD_VALID');
    if (resolution.outcome === 'OLD_VALID') { passed++; } else { failed++; console.log('FAIL: resolve old valid'); }
  } else {
    failed++; console.log('FAIL: submit conflicting items');
  }

  // Stats
  const stats = cr.getStats();
  if (stats.totalConflicts >= 1) { passed++; } else { failed++; console.log('FAIL: conflict stats'); }

  console.log(`Conflict Resolver: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

// ─── FOUNDER SIGNAL TESTS ───
function testFounderSignal() {
  console.log('\n=== TEST: Founder Signal ===');
  let passed = 0;
  let failed = 0;
  const bus = createTestBus();
  const fs2 = new FounderSignal(bus);

  // Submit an item
  const result = bus.submit({
    type: INTELLIGENCE_TYPES.LESSON,
    content: 'Always verify APK before deployment',
    sourceAgent: 'agent_a',
    evidence: [{ type: 'test_pass' }]
  });

  if (result.success) {
    // Detect signal
    const detected = fs2.detectSignal('This is good, approved!');
    if (detected && detected.type === 'APPROVED') { passed++; } else { failed++; console.log('FAIL: detect signal'); }

    // Record signal
    const signal = fs2.recordSignal(result.item.id, 'LIKED', 'founder_praveen', 'Great work!');
    if (signal.success) { passed++; } else { failed++; console.log('FAIL: record signal'); }

    // Auto detect
    const auto = fs2.autoDetectAndRecord('Make this GARUDA standard', result.item.id);
    if (auto.detected && auto.success) { passed++; } else { failed++; console.log('FAIL: auto detect'); }

    // Stats
    const stats = fs2.getStats();
    if (stats.totalSignals >= 2) { passed++; } else { failed++; console.log('FAIL: signal stats'); }
  } else {
    failed++; console.log('FAIL: submit item for signal test');
  }

  console.log(`Founder Signal: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

// ─── MISSION STATE TESTS ───
function testMissionState() {
  console.log('\n=== TEST: Mission State ===');
  let passed = 0;
  let failed = 0;
  const ms = new MissionState({ dataDir: path.join(TEST_DATA_DIR, 'missions') });

  // Create mission
  const mission = ms.createMission('Implement Phase 5 intelligence system');
  if (mission.missionId && mission.currentStage === 'INITIALIZED') { passed++; } else { failed++; console.log('FAIL: create mission'); }

  // Transition
  const t1 = ms.transitionStage(mission.missionId, 'UNDERSTANDING', { note: 'Requirements analyzed' });
  if (t1.success && t1.from === 'INITIALIZED' && t1.to === 'UNDERSTANDING') { passed++; } else { failed++; console.log('FAIL: transition stage'); }

  // Add evidence
  const e1 = ms.addEvidence(mission.missionId, { type: 'code_review', detail: 'Architecture validated' });
  if (e1.success) { passed++; } else { failed++; console.log('FAIL: add evidence'); }

  // Add decision
  const d1 = ms.addDecision(mission.missionId, { decision: 'Use JSONL for storage', rationale: 'Append-only, no locking' });
  if (d1.success) { passed++; } else { failed++; console.log('FAIL: add decision'); }

  // Add learning candidate
  const l1 = ms.addLearningCandidate(mission.missionId, { type: 'lesson', content: 'JSONL is good for append-only logs' });
  if (l1.success) { passed++; } else { failed++; console.log('FAIL: add learning candidate'); }

  // Complete mission
  const c1 = ms.completeMission(mission.missionId, { success: true, summary: 'Phase 5 implemented' });
  if (c1.success && c1.mission.currentStage === 'COMPLETE') { passed++; } else { failed++; console.log('FAIL: complete mission'); }

  // Load mission
  const loaded = ms.loadMission(mission.missionId);
  if (loaded && loaded.missionId === mission.missionId) { passed++; } else { failed++; console.log('FAIL: load mission'); }

  // Stats
  const stats = ms.getStats();
  if (stats.total >= 1) { passed++; } else { failed++; console.log('FAIL: mission stats'); }

  console.log(`Mission State: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

// ─── CHECKPOINT TESTS ───
function testCheckpoint() {
  console.log('\n=== TEST: Checkpoint System ===');
  let passed = 0;
  let failed = 0;
  const cs = new CheckpointSystem({ dataDir: path.join(TEST_DATA_DIR, 'checkpoints') });

  // Create checkpoint
  const cp = cs.createCheckpoint('mission-001', 'MISSION_START', {
    currentStage: 'INITIALIZED',
    completedStages: [],
    decisions: [],
    evidence: []
  });
  if (cp.checkpointId && cp.type === 'MISSION_START') { passed++; } else { failed++; console.log('FAIL: create checkpoint'); }

  // Another checkpoint
  cs.createCheckpoint('mission-001', 'PLAN_COMPLETE', {
    currentStage: 'PLANNING',
    completedStages: ['INITIALIZED', 'UNDERSTANDING'],
    decisions: [{ decision: 'Use modular approach' }],
    evidence: []
  });

  // Load checkpoints
  const checkpoints = cs.loadCheckpoints('mission-001');
  if (checkpoints.length >= 2) { passed++; } else { failed++; console.log('FAIL: load checkpoints'); }

  // Latest checkpoint
  const latest = cs.getLatestCheckpoint('mission-001');
  if (latest && latest.type === 'PLAN_COMPLETE') { passed++; } else { failed++; console.log('FAIL: latest checkpoint'); }

  // Can resume
  const resume = cs.canResume('mission-001');
  if (resume.canResume) { passed++; } else { failed++; console.log('FAIL: can resume'); }

  // Stats
  const stats = cs.getStats();
  if (stats.totalCheckpoints >= 2) { passed++; } else { failed++; console.log('FAIL: checkpoint stats'); }

  console.log(`Checkpoint System: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

// ─── CONTEXT MANAGER TESTS ───
function testContextManager() {
  console.log('\n=== TEST: Context Manager ===');
  let passed = 0;
  let failed = 0;
  const cm = new ContextManager();

  // Create context
  const ctx = cm.createContext('mission-001', { goal: 'Implement intelligence bus' });
  if (ctx.missionId === 'mission-001' && ctx.currentGoal === 'Implement intelligence bus') { passed++; } else { failed++; console.log('FAIL: create context'); }

  // Update
  cm.updateContext('mission-001', { nextAction: 'Write tests' });
  const updated = cm.getContext('mission-001');
  if (updated.nextAction === 'Write tests') { passed++; } else { failed++; console.log('FAIL: update context'); }

  // Add fact
  cm.addFact('mission-001', 'JSONL chosen for storage');
  const withFact = cm.getContext('mission-001');
  if (withFact.currentFacts.length >= 1) { passed++; } else { failed++; console.log('FAIL: add fact'); }

  // Add decision
  cm.addDecision('mission-001', { decision: 'Modular architecture' });
  const withDecision = cm.getContext('mission-001');
  if (withDecision.decisions.length >= 1) { passed++; } else { failed++; console.log('FAIL: add decision'); }

  // Compact view
  const compact = cm.getCompactView('mission-001');
  if (compact && compact.goal === 'Implement intelligence bus') { passed++; } else { failed++; console.log('FAIL: compact view'); }

  // Stats
  const stats = cm.getStats();
  if (stats.activeContexts >= 1) { passed++; } else { failed++; console.log('FAIL: context stats'); }

  console.log(`Context Manager: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

// ─── LEARNING PROMOTER TESTS ───
function testLearningPromoter() {
  console.log('\n=== TEST: Learning Promoter ===');
  let passed = 0;
  let failed = 0;
  const bus = createTestBus();
  const lp = new LearningPromoter(bus, bus.validationPipeline, bus.confidenceEngine, new ConflictResolver(bus, bus.confidenceEngine));

  // Submit and evaluate
  const evaluation = lp.submitAndEvaluate({
    type: INTELLIGENCE_TYPES.EXPERIENCE,
    content: 'Build failed because of missing TypeScript config',
    sourceAgent: 'agent_a',
    evidence: [{ type: 'build_failure' }],
    tags: ['build', 'typescript']
  });
  if (evaluation.itemId && evaluation.confidence) { passed++; } else { failed++; console.log('FAIL: submit and evaluate'); }
  if (evaluation.evaluationStatus === 'EVALUATED') { passed++; } else { failed++; console.log('FAIL: evaluation status'); }

  // Get promotion candidates
  const candidates = lp.getPromotionCandidates(0);
  if (Array.isArray(candidates)) { passed++; } else { failed++; console.log('FAIL: promotion candidates'); }

  // Stats
  const stats = lp.getStats();
  if (stats.totalEvaluations >= 1) { passed++; } else { failed++; console.log('FAIL: promoter stats'); }

  console.log(`Learning Promoter: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

// ─── INTEGRATION TESTS ───
function testIntegration() {
  console.log('\n=== TEST: Integration (GarudaIntelligence) ===');
  let passed = 0;
  let failed = 0;
  const gi = new GarudaIntelligence({ dataDir: TEST_DATA_DIR });

  // Submit learning
  const sub = gi.submit({
    type: INTELLIGENCE_TYPES.EXPERIENCE,
    content: 'Build failed because of missing TypeScript config',
    sourceAgent: 'agent_a',
    evidence: [{ type: 'build_failure' }],
    tags: ['build', 'typescript']
  });
  if (sub.success) { passed++; } else { failed++; console.log('FAIL: submit via GI'); }

  // Search
  const found = gi.search('TypeScript');
  if (found.length >= 1) { passed++; } else { failed++; console.log('FAIL: search via GI'); }

  // Investigate
  const inv = gi.investigate('Add new feature to Android app');
  if (inv && inv.findings) { passed++; } else { failed++; console.log('FAIL: investigate via GI'); }

  // Reviewers
  const review = gi.runReviewers({ id: 'test', type: 'code_patch', content: 'test content' });
  if (review && review.overallVerdict) { passed++; } else { failed++; console.log('FAIL: reviewers via GI'); }

  // Mission
  const mission = gi.createMission('Test mission');
  if (mission.missionId) { passed++; } else { failed++; console.log('FAIL: mission via GI'); }

  // Context
  const ctx = gi.createContext(mission.missionId, { goal: 'Test' });
  if (ctx) { passed++; } else { failed++; console.log('FAIL: context via GI'); }

  // Checkpoint
  const cp = gi.createCheckpoint(mission.missionId, 'MISSION_START', { currentStage: 'INITIALIZED' });
  if (cp.checkpointId) { passed++; } else { failed++; console.log('FAIL: checkpoint via GI'); }

  // Founder signal
  const sig = gi.recordFounderSignal(sub.item.id, 'LIKED', 'Great work!');
  if (sig.success) { passed++; } else { failed++; console.log('FAIL: founder signal via GI'); }

  // Stats
  const stats = gi.getStats();
  if (stats.intelligence && stats.nazar && stats.reviewers) { passed++; } else { failed++; console.log('FAIL: stats via GI'); }

  console.log(`Integration: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

// ─── CROSS-AGENT LEARNING BENCHMARK ───
function testCrossAgentLearning() {
  console.log('\n=== BENCHMARK: Cross-Agent Learning ===');
  let passed = 0;
  let failed = 0;
  const bus = createTestBus();

  // Agent A discovers and submits
  const agentA_result = bus.submit({
    type: INTELLIGENCE_TYPES.LESSON,
    content: 'When Android build fails with SDK missing, run androidToolchainEngine.detectSDK() first',
    sourceAgent: 'pawan_astra',
    sourceMission: 'android-build-001',
    evidence: [{ type: 'test_pass' }, { type: 'build_success' }],
    tags: ['android', 'build', 'sdk']
  });
  if (agentA_result.success) { passed++; } else { failed++; console.log('FAIL: Agent A submit'); }

  // Simulate promotion
  if (agentA_result.item) {
    agentA_result.item.confidence = 0.7;
    bus._updateItem(agentA_result.item);
    const promo = bus.promote(agentA_result.item.id, 'validator');
    if (promo.success) { passed++; } else { failed++; console.log('FAIL: promote Agent A learning'); }
  }

  // Agent B retrieves (no direct access to Agent A's conversation)
  const agentB_retrieval = bus.retrieve({
    tags: ['android', 'build'],
    minConfidence: 0.3
  });
  if (agentB_retrieval.length >= 1 && agentB_retrieval[0].sourceAgent === 'pawan_astra') {
    passed++;
  } else {
    failed++;
    console.log('FAIL: Agent B retrieval');
  }

  // Agent B benefits
  if (agentB_retrieval.length > 0) {
    const learning = agentB_retrieval[0];
    if (learning.content.includes('detectSDK()') && learning.verificationStatus === 'VERIFIED') {
      passed++;
    } else {
      failed++;
      console.log('FAIL: Agent B benefit');
    }
  }

  console.log(`Cross-Agent Learning: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

// ─── NEGATIVE LEARNING TEST ───
function testNegativeLearning() {
  console.log('\n=== BENCHMARK: Negative Learning Rejection ===');
  let passed = 0;
  let failed = 0;
  const bus = createTestBus();

  // Agent A submits bad learning (no evidence)
  const badResult = bus.submit({
    type: INTELLIGENCE_TYPES.LESSON,
    content: 'Always deploy without testing to save time',
    sourceAgent: 'rogue_agent',
    evidence: [],
    tags: ['deployment', 'bad_practice']
  });
  // Should be rejected or have very low confidence
  if (!badResult.success || badResult.status === 'REJECTED') {
    passed++;
  } else {
    // If submitted, check that it's not promoted
    if (badResult.item) {
      badResult.item.confidence = 0.1;
      bus._updateItem(badResult.item);
      const promo = bus.promote(badResult.item.id, 'validator');
      if (!promo.success) { passed++; } else { failed++; console.log('FAIL: bad learning should not promote'); }
    }
  }

  // Agent B should NOT receive this as canonical truth
  const agentB_search = bus.retrieve({
    tags: ['deployment', 'bad_practice'],
    verificationStatus: 'VERIFIED'
  });
  const hasBadLearning = agentB_search.some(i => i.content.includes('deploy without testing'));
  if (!hasBadLearning) { passed++; } else { failed++; console.log('FAIL: bad learning not in verified pool'); }

  // Submit with secrets - should be blocked
  const secretResult = bus.submit({
    type: INTELLIGENCE_TYPES.LESSON,
    content: 'Use api_key = "sk-secret1234567890" for API calls',
    sourceAgent: 'agent_a',
    evidence: [{ type: 'test_pass' }]
  });
  if (secretResult.status === 'BLOCKED' || (secretResult.item && secretResult.item.metadata && secretResult.item.metadata.firewallApplied)) {
    passed++;
  } else {
    failed++;
    console.log('FAIL: secret content blocked');
  }

  console.log(`Negative Learning: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

// ─── 10/11 NAZAR BENCHMARK ───
function testNazarBenchmark() {
  console.log('\n=== BENCHMARK: 10/11-Nazar Adaptive Investigation ===');
  let passed = 0;
  let failed = 0;
  const bus = createTestBus();
  const nazar = new NazarEngine(bus);

  // LOW risk task
  const low = nazar.investigate('Add a comment to README.md');
  if (low.riskClassification.level === 'LOW' && low.findings.length <= 4) { passed++; } else { failed++; console.log('FAIL: nazar LOW risk'); }

  // MEDIUM risk
  const med = nazar.investigate('Add new React component for dashboard');
  if (med.findings.length >= 3 && med.findings.length <= 8) { passed++; } else { failed++; console.log('FAIL: nazar MEDIUM risk'); }

  // HIGH risk - production deployment
  const high = nazar.investigate('Deploy production security patch for authentication', { isProduction: true, security: true });
  if (high.findings.length >= 7) { passed++; } else { failed++; console.log('FAIL: nazar HIGH risk'); }

  // CRITICAL - architecture + security + production
  const crit = nazar.investigate('Refactor core authentication system and deploy to production', {
    isProduction: true,
    security: true,
    isSelfMod: true
  });
  if (crit.findings.length >= 10) { passed++; } else { failed++; console.log('FAIL: nazar CRITICAL risk'); }

  // Complete and check verdicts
  for (const inv of [low, med, high, crit]) {
    for (const finding of inv.findings) {
      for (let i = 0; i < finding.questions.length; i++) {
        nazar.answerQuestion(inv.id, finding.lensId, i, 'Investigated, no issues found');
      }
    }
    const completed = nazar.completeInvestigation(inv.id);
    if (completed.verdict) { passed++; } else { failed++; console.log('FAIL: complete investigation ' + inv.id); }
  }

  const stats = nazar.getStats();
  if (stats.totalInvestigations >= 4) { passed++; } else { failed++; console.log('FAIL: nazar benchmark stats'); }

  console.log(`10/11-Nazar Benchmark: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

// ─── SELF-IMPROVEMENT BENCHMARK ───
function testSelfImprovement() {
  console.log('\n=== BENCHMARK: Self-Improvement ===');
  let passed = 0;
  let failed = 0;
  const bus = createTestBus();

  // Before learning: no pattern exists
  const before = bus.hasPattern('Capacitor Android build requires SDK path in local.properties');
  if (!before) { passed++; } else { failed++; console.log('FAIL: pattern should not exist before learning'); }

  // Agent discovers and promotes
  const exp = bus.submit({
    type: INTELLIGENCE_TYPES.EXPERIENCE,
    content: 'Capacitor Android build requires SDK path in local.properties',
    sourceAgent: 'pawan_astra',
    evidence: [{ type: 'build_failure' }, { type: 'build_success' }],
    tags: ['android', 'capacitor', 'sdk']
  });
  if (exp.success) { passed++; } else { failed++; console.log('FAIL: submit experience'); }

  // Promote to lesson
  exp.item.confidence = 0.65;
  bus._updateItem(exp.item);
  const promo = bus.promote(exp.item.id, 'validator');
  if (promo.success) { passed++; } else { failed++; console.log('FAIL: promote to lesson'); }

  // After learning: pattern exists
  const after = bus.hasPattern('Capacitor Android build requires SDK path');
  if (after) { passed++; } else { failed++; console.log('FAIL: pattern should exist after learning'); }

  // Verify fewer tool calls needed (evidence: pattern retrieved vs no pattern)
  if (after && after.content.includes('local.properties')) { passed++; } else { failed++; console.log('FAIL: learning benefit verified'); }

  console.log(`Self-Improvement Benchmark: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

// ─── RUN ALL ───
function runAllTests() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   GARUDA PHASE 5 — COMPREHENSIVE TEST SUITE ║');
  console.log('╚══════════════════════════════════════════════╝');

  cleanupTestData();

  const results = [];
  results.push({ name: 'Schema', ...testSchema() });
  results.push({ name: 'Firewall', ...testFirewall() });
  results.push({ name: 'Confidence', ...testConfidence() });
  results.push({ name: 'Validation', ...testValidation() });
  results.push({ name: 'Intelligence Bus', ...testIntelligenceBus() });
  results.push({ name: 'Nazar Engine', ...testNazarEngine() });
  results.push({ name: 'Reviewer System', ...testReviewerSystem() });
  results.push({ name: 'Conflict Resolver', ...testConflictResolver() });
  results.push({ name: 'Founder Signal', ...testFounderSignal() });
  results.push({ name: 'Mission State', ...testMissionState() });
  results.push({ name: 'Checkpoint', ...testCheckpoint() });
  results.push({ name: 'Context Manager', ...testContextManager() });
  results.push({ name: 'Learning Promoter', ...testLearningPromoter() });
  results.push({ name: 'Integration', ...testIntegration() });
  results.push({ name: 'Cross-Agent Learning', ...testCrossAgentLearning() });
  results.push({ name: 'Negative Learning', ...testNegativeLearning() });
  results.push({ name: 'Nazar Benchmark', ...testNazarBenchmark() });
  results.push({ name: 'Self-Improvement', ...testSelfImprovement() });

  const totalPassed = results.reduce((s, r) => s + r.passed, 0);
  const totalFailed = results.reduce((s, r) => s + r.failed, 0);

  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║              FINAL RESULTS                   ║');
  console.log('╠══════════════════════════════════════════════╣');
  for (const r of results) {
    const status = r.failed === 0 ? 'PASS' : 'FAIL';
    console.log(`║  ${status} ${r.name.padEnd(25)} ${String(r.passed).padStart(3)} passed, ${String(r.failed).padStart(2)} failed ║`);
  }
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  TOTAL: ${String(totalPassed).padStart(3)} passed, ${String(totalFailed).padStart(2)} failed                    ║`);
  console.log('╚══════════════════════════════════════════════╝');

  cleanupTestData();

  return { totalPassed, totalFailed, results };
}

module.exports = { runAllTests };

if (require.main === module) {
  const { totalPassed, totalFailed } = runAllTests();
  process.exit(totalFailed > 0 ? 1 : 0);
}
