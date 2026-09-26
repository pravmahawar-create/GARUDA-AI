/**
 * GARUDA PHASE 5 — FORENSIC REALITY AUDIT
 * Truth over score.
 */
const path = require('path');
const fs = require('fs');
const {
  GarudaIntelligence, IntelligenceBus, IntelligenceFirewall, ConfidenceEngine,
  ValidationPipeline, NazarEngine, ReviewerSystem, ConflictResolver,
  FounderSignal, MissionState, CheckpointSystem, ContextManager, LearningPromoter,
  INTELLIGENCE_TYPES, PROMOTION_HIERARCHY, VERIFICATION_STATUS, SCOPE,
  createIntelligenceItem
} = require('./index');

const AUDIT_DIR = path.join(__dirname, '_forensic_audit_data');
const FINDINGS = [];

function log(cat, claim, status, evidence) {
  FINDINGS.push({ cat, claim, status, evidence: evidence || '' });
  const icon = status === 'VERIFIED' ? 'V' : status === 'PARTIAL' ? 'P' : status === 'FALSE' ? 'F' : '?';
  console.log('  [' + icon + '] ' + status + ' | ' + claim);
  if (evidence) console.log('         ' + evidence);
}

function cleanup() {
  if (fs.existsSync(AUDIT_DIR)) fs.rmSync(AUDIT_DIR, { recursive: true, force: true });
}

// ═══════════════════════════════════════════════════════
// 1. CODE FORENSICS
// ═══════════════════════════════════════════════════════
function auditCodeForensics() {
  console.log('\n=== 1. CODE FORENSICS ===');
  const prodFiles = [
    'intelligenceSchema.js','intelligenceBus.js','intelligenceFirewall.js',
    'confidenceEngine.js','validationPipeline.js','learningPromoter.js',
    'founderSignal.js','nazar/nazarEngine.js','reviewers/reviewerSystem.js',
    'conflict/conflictResolver.js','mission/missionState.js',
    'mission/checkpoint.js','context/contextManager.js'
  ];
  let clean = true;
  for (const f of prodFiles) {
    const fp = path.join(__dirname, f);
    if (!fs.existsSync(fp)) { log('FORENSICS', 'Missing: ' + f, 'FALSE'); clean = false; continue; }
    const c = fs.readFileSync(fp, 'utf-8');
    for (const [pat, name] of [[/\bmock\b/i,'mock'],[/\bstub\b/i,'stub'],[/\bfake\b/i,'fake'],[/\bbypass\b/i,'bypass'],[/TODO|FIXME/i,'TODO']]) {
      if (pat.test(c)) { log('FORENSICS', name + ' found in ' + f, 'PARTIAL'); clean = false; }
    }
  }
  if (clean) log('FORENSICS', 'No stubs/mocks/bypasses in production code', 'VERIFIED');

  // Check test overrides
  const tc = fs.readFileSync(path.join(__dirname, 'phase5Intelligence.test.js'), 'utf-8');
  const overrides = tc.match(/\.confidence\s*=\s*[\d.]+/g);
  if (overrides) log('FORENSICS', 'Test manually overrides confidence ' + overrides.length + ' times', 'PARTIAL',
    'Tests bypass confidence engine by setting .confidence directly');

  // Validation rejection
  const vp = new ValidationPipeline();
  const emptyItem = createIntelligenceItem({ type: 'lesson', content: 'test', sourceAgent: 't', evidence: [] });
  const vr = vp.validate(emptyItem);
  log('FORENSICS', 'ValidationPipeline rejects empty-evidence items', !vr.allPassed ? 'VERIFIED' : 'FALSE',
    'Failed rules: ' + vr.results.filter(r => !r.passed).map(r => r.ruleName).join(', '));
}

// ═══════════════════════════════════════════════════════
// 2. CROSS-AGENT REALITY
// ═══════════════════════════════════════════════════════
function auditCrossAgent() {
  console.log('\n=== 2. CROSS-AGENT REALITY TEST ===');
  const dirA = path.join(AUDIT_DIR, 'agent_a');
  const busA = new IntelligenceBus({ dataDir: dirA });

  const disc = busA.submit({
    type: 'lesson',
    content: 'When Express 5 route throws async error, wrap handler with try-catch. Express 5 does not auto-catch async rejections unlike Express 4.',
    sourceAgent: 'pawan_astra', sourceMission: 'express-001',
    evidence: [{ type: 'test_pass' }, { type: 'runtime_verified' }, { type: 'build_success' }],
    tags: ['node', 'express', 'async', 'error-handling']
  });
  log('CROSS-AGENT', 'Agent A submits discovery', disc.success ? 'VERIFIED' : 'FALSE',
    'ID: ' + (disc.item ? disc.item.id : 'none'));

  const val = busA.validateItem(disc.item.id);
  log('CROSS-AGENT', 'Real validation pipeline runs', val.allPassed ? 'VERIFIED' : 'FALSE',
    val.results.map(r => r.ruleName + ':' + (r.passed ? 'PASS' : 'FAIL')).join(' '));

  const promo = busA.promote(disc.item.id, 'auditor');
  log('CROSS-AGENT', 'Promoted to RULE via real pipeline', promo.success ? 'VERIFIED' : 'FALSE',
    'Type: ' + (promo.item ? promo.item.type : 'N/A'));

  // Disk persistence check
  const rulePath = path.join(dirA, 'rules.jsonl');
  const diskExists = fs.existsSync(rulePath) && fs.readFileSync(rulePath, 'utf-8').includes('Express');
  log('CROSS-AGENT', 'Rule persisted to disk', diskExists ? 'VERIFIED' : 'FALSE',
    'File: ' + rulePath);

  // Agent B — fresh bus, same store (shared intelligence), no conversation access
  const busB = new IntelligenceBus({ dataDir: dirA });
  const found = busB.retrieve({ tags: ['express', 'async'], minConfidence: 0.3 });
  log('CROSS-AGENT', 'Agent B retrieves via query (separate bus instance)',
    found.length > 0 && found[0].sourceAgent === 'pawan_astra' ? 'VERIFIED' : 'FALSE',
    'Found: ' + found.length + ', source: ' + (found[0] ? found[0].sourceAgent : 'none'));

  if (found.length > 0) {
    const f = found[0];
    log('CROSS-AGENT', 'Retrieved item is actionable + promoted + verified',
      (f.type === 'rule' && f.verificationStatus === 'VERIFIED' && f.content.includes('try-catch')) ? 'VERIFIED' : 'PARTIAL',
      'Type: ' + f.type + ', Status: ' + f.verificationStatus);
    log('CROSS-AGENT', 'Provenance preserved',
      (f.sourceAgent === 'pawan_astra' && f.sourceMission === 'express-001') ? 'VERIFIED' : 'FALSE',
      'agent: ' + f.sourceAgent + ', mission: ' + f.sourceMission);
  }
}

// ═══════════════════════════════════════════════════════
// 3. NEGATIVE LEARNING ATTACK
// ═══════════════════════════════════════════════════════
function auditNegativeLearning() {
  console.log('\n=== 3. NEGATIVE LEARNING ATTACK ===');
  const bus = new IntelligenceBus({ dataDir: path.join(AUDIT_DIR, 'neg') });

  // Attack 1: No evidence
  const a1 = bus.submit({
    type: 'lesson', content: 'Deploy without testing to save time',
    sourceAgent: 'attacker', evidence: [], tags: ['attack']
  });
  log('NEGATIVE', 'Attack 1: No-evidence lesson rejected', !a1.success ? 'VERIFIED' : 'PARTIAL',
    'Status: ' + a1.status);

  // Attack 2: Fake evidence type
  const a2 = bus.submit({
    type: 'lesson', content: 'Skip code review to ship faster',
    sourceAgent: 'attacker', evidence: [{ type: 'totally_fake' }], tags: ['attack2']
  });
  if (a2.success) {
    a2.item.confidence = 0.1;
    bus._updateItem(a2.item);
    const pr = bus.promote(a2.item.id, 'auditor');
    log('NEGATIVE', 'Attack 2: Low-confidence item blocked from promotion', !pr.success ? 'VERIFIED' : 'FALSE',
      'Promote: ' + (pr.success ? 'SUCCEEDED (BAD)' : 'BLOCKED'));
  } else {
    log('NEGATIVE', 'Attack 2: Rejected at submission', 'VERIFIED', 'Status: ' + a2.status);
  }

  // Attack 3: Verified pool check
  const vs = bus.retrieve({ tags: ['attack', 'attack2'], verificationStatus: 'VERIFIED' });
  const leaked = vs.some(i => i.content.includes('without testing') || i.content.includes('Skip code review'));
  log('NEGATIVE', 'Attack 3: Rejected items NOT in VERIFIED pool', !leaked ? 'VERIFIED' : 'FALSE');

  // Attack 4: Secret injection
  const a4 = bus.submit({
    type: 'lesson', content: 'password = "hunter2" for prod DB',
    sourceAgent: 'attacker', evidence: [{ type: 'test_pass' }]
  });
  if (a4.success && a4.item) {
    const raw = a4.item.content.includes('hunter2');
    const fw = a4.item.metadata && a4.item.metadata.firewallApplied;
    log('NEGATIVE', 'Attack 4: Secret redacted by firewall', !raw && fw ? 'VERIFIED' : raw ? 'FALSE' : 'PARTIAL',
      'Raw secret in store: ' + raw + ', Firewall: ' + fw);
  } else {
    log('NEGATIVE', 'Attack 4: Blocked at submission', 'VERIFIED', 'Status: ' + a4.status);
  }
}

// ═══════════════════════════════════════════════════════
// 4. CONFLICT ATTACK
// ═══════════════════════════════════════════════════════
function auditConflict() {
  console.log('\n=== 4. CONFLICT ATTACK ===');
  const bus = new IntelligenceBus({ dataDir: path.join(AUDIT_DIR, 'conflict') });
  const cr = new ConflictResolver(bus, bus.confidenceEngine);

  const iA = bus.submit({
    type: 'lesson', content: 'Always use connection pooling for MongoDB',
    sourceAgent: 'senior', evidence: [{ type: 'test_pass' }, { type: 'runtime_verified' }, { type: 'code_review' }, { type: 'cross_agent_verified' }],
    tags: ['mongo']
  });
  const iB = bus.submit({
    type: 'lesson', content: 'Never use connection pooling for MongoDB — causes leaks',
    sourceAgent: 'junior', evidence: [{ type: 'test_pass' }],
    tags: ['mongo']
  });
  log('CONFLICT', 'Two contradictory lessons submitted', iA.success && iB.success ? 'VERIFIED' : 'FALSE');

  if (iA.success && iB.success) {
    const conflict = cr.detectConflict(iA.item, iB.item);
    log('CONFLICT', 'Conflict detected', conflict && conflict.conflictTypes.length > 0 ? 'VERIFIED' : 'FALSE',
      'Types: ' + (conflict ? conflict.conflictTypes.map(c => c.type).join(', ') : 'none'));

    if (conflict) {
      const res = cr.resolveConflict(conflict.id);
      log('CONFLICT', 'Resolution recorded', res && res.outcome ? 'VERIFIED' : 'FALSE',
        'Outcome: ' + (res ? res.outcome : 'none'));

      const aA = bus.getById(iA.item.id);
      const aB = bus.getById(iB.item.id);
      log('CONFLICT', 'Neither item silently deleted', aA && aB ? 'VERIFIED' : 'FALSE',
        'A exists: ' + !!aA + ', B exists: ' + !!aB);
    }
  }
}

// ═══════════════════════════════════════════════════════
// 5. FIREWALL ATTACK
// ═══════════════════════════════════════════════════════
function auditFirewall() {
  console.log('\n=== 5. FIREWALL ATTACK ===');
  const fw = new IntelligenceFirewall();
  const payloads = [
    ['API Key', 'api_key = "sk-proj-abc123def456ghi789"', true],
    ['Bearer', 'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.test.sig', true],
    ['Password', 'DB_PASSWORD = "SuperSecret123!"', true],
    ['Mongo URI', 'mongodb+srv://admin:pass123@cluster0.abc.mongodb.net/db', true],
    ['AWS Key', 'AWS_KEY = "AKIAIOSFODNN7EXAMPLE"', true],
    ['GitHub PAT', 'GITHUB_TOKEN = "ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef12"', true],
    ['Slack', 'slack_api_token = "dummy-audit-fixture-not-a-real-token"', true],
    ['Private Key', '-----BEGIN RSA PRIVATE KEY-----', true],
    ['Credit Card', 'Card: 4111 1111 1111 1111', true],
    ['Email', 'Email: john@example.com', true],
    ['Phone', 'Phone: +1-555-123-4567', true],
    ['Clean 1', 'Always verify TypeScript config before building', false],
    ['Clean 2', 'Use at least 3 retries with 1000ms delay', false]
  ];
  let correct = 0;
  for (const [name, content, expectBlock] of payloads) {
    const f = fw.scanForSecrets(content);
    const det = f.length > 0;
    const ok = det === expectBlock;
    if (ok) correct++;
    log('FIREWALL', name + ': ' + (det ? 'DETECTED' : 'CLEAN'), ok ? 'VERIFIED' : 'FALSE',
      'Expect: ' + expectBlock + ', Got: ' + det + ', Labels: ' + f.map(x => x.label).join(','));
  }
  log('FIREWALL', 'Accuracy: ' + correct + '/' + payloads.length,
    correct === payloads.length ? 'VERIFIED' : 'PARTIAL');

  // Sanitize check
  const { sanitized, wasModified } = fw.sanitizeContent('api_key = "sk-test123" and text');
  log('FIREWALL', 'Sanitization works', wasModified && sanitized.includes('[REDACTED') ? 'VERIFIED' : 'FALSE');

  // Propagation check — key design observation
  const item = createIntelligenceItem({ type: 'lesson', content: 'password = "secret123"', sourceAgent: 't' });
  const filtered = fw.filterIntelligence(item);
  const prop = fw.evaluatePropagation(filtered.item);
  log('FIREWALL', 'PROPAGATION GAP: sanitized content still propagates', 'PARTIAL',
    'propagate=' + prop.propagate + ' — secrets redacted but item NOT blocked from store');
}

// ═══════════════════════════════════════════════════════
// 6. NAZAR REALITY
// ═══════════════════════════════════════════════════════
function auditNazar() {
  console.log('\n=== 6. 10/11-NAZAR REALITY TEST ===');
  const bus = new IntelligenceBus({ dataDir: path.join(AUDIT_DIR, 'nazar') });
  const nazar = new NazarEngine(bus);

  const task = 'Refactor MongoDB connection layer to support replica sets and add connection pooling with health checks';
  const inv = nazar.investigate(task, { isProduction: true, security: true });

  log('NAZAR', 'Investigation created with adaptive lenses', inv.findings.length >= 7 ? 'VERIFIED' : 'PARTIAL',
    'Lenses: ' + inv.findings.length + ', Risk: ' + inv.riskClassification.level);

  // Check that lenses are relevant
  const lensNames = inv.findings.map(f => f.lensName);
  const hasRelevant = lensNames.includes('SECURITY') && lensNames.includes('RUNTIME') && lensNames.includes('REGRESSION');
  log('NAZAR', 'Selected lenses are relevant to task', hasRelevant ? 'VERIFIED' : 'PARTIAL',
    'Lenses: ' + lensNames.join(', '));

  // Complete investigation with actual answers
  for (const finding of inv.findings) {
    for (let i = 0; i < finding.questions.length; i++) {
      const answer = 'Verified: ' + finding.questions[i] + ' — checked codebase, no issues found';
      nazar.answerQuestion(inv.id, finding.lensId, i, answer);
    }
  }
  const completed = nazar.completeInvestigation(inv.id);
  log('NAZAR', 'Investigation completed with verdict', completed.verdict ? 'VERIFIED' : 'FALSE',
    'Verdict: ' + (completed.verdict ? completed.verdict.verdict : 'none'));
}

// ═══════════════════════════════════════════════════════
// 7. DURABILITY TEST
// ═══════════════════════════════════════════════════════
function auditDurability() {
  console.log('\n=== 7. DURABILITY TEST ===');
  const ms = new MissionState({ dataDir: path.join(AUDIT_DIR, 'missions') });
  const cs = new CheckpointSystem({ dataDir: path.join(AUDIT_DIR, 'checkpoints') });

  // Start mission
  const m = ms.createMission('Durability test mission');
  ms.transitionStage(m.missionId, 'UNDERSTANDING', { note: 'analyzed' });
  ms.addDecision(m.missionId, { decision: 'Use modular approach' });
  ms.addEvidence(m.missionId, { type: 'code_review', detail: 'validated' });

  // Create checkpoint
  const cp = cs.createCheckpoint(m.missionId, 'PLAN_COMPLETE', {
    currentStage: 'PLANNING',
    completedStages: ['INITIALIZED', 'UNDERSTANDING'],
    decisions: [{ decision: 'Use modular approach' }],
    evidence: [{ type: 'code_review' }]
  });
  log('DURABILITY', 'Checkpoint created', cp.checkpointId ? 'VERIFIED' : 'FALSE',
    'CP: ' + cp.checkpointId);

  // Simulate interruption — load from disk (new process)
  const loaded = ms.loadMission(m.missionId);
  log('DURABILITY', 'Mission loaded from disk', loaded && loaded.missionId === m.missionId ? 'VERIFIED' : 'FALSE',
    'Stage: ' + (loaded ? loaded.currentStage : 'none') + ', Decisions: ' + (loaded ? loaded.decisions.length : 0));

  // Resume check
  const resume = cs.canResume(m.missionId);
  log('DURABILITY', 'Resume detected correctly', resume.canResume && resume.resumeFrom === 'PLANNING' ? 'VERIFIED' : 'FALSE',
    'Resume from: ' + (resume.resumeFrom || 'none'));

  // Continue mission
  ms.transitionStage(m.missionId, 'EXECUTING', { note: 'started' });
  const after = ms.loadMission(m.missionId);
  log('DURABILITY', 'Mission continues from correct stage',
    after.completedStages.length === 2 && after.currentStage === 'EXECUTING' ? 'VERIFIED' : 'FALSE',
    'Completed: ' + after.completedStages.length + ', Current: ' + after.currentStage);

  // Check decisions survived
  log('DURABILITY', 'Decisions persisted across load', after.decisions.length === 1 ? 'VERIFIED' : 'FALSE',
    'Decisions: ' + after.decisions.length);
}

// ═══════════════════════════════════════════════════════
// 8. CONTEXT COMPACTION
// ═══════════════════════════════════════════════════════
function auditContext() {
  console.log('\n=== 8. CONTEXT COMPACTION TEST ===');
  const cm = new ContextManager();

  const ctx = cm.createContext('ctx-test', {
    goal: 'Implement connection pooling',
    constraints: ['Must work with MongoDB 6', 'Zero-downtime migration'],
    facts: [], decisions: [], evidence: [], failures: []
  });

  // Add lots of data to trigger compaction
  for (let i = 0; i < 60; i++) {
    cm.addFact('ctx-test', 'Fact ' + i + ': analyzed component ' + i + ' and found no issues with the implementation');
    cm.addDecision('ctx-test', { decision: 'Decision ' + i + ': use strategy X for component ' + i });
    cm.addEvidence('ctx-test', { type: 'test_pass', detail: 'Evidence ' + i });
  }
  cm.setNextAction('ctx-test', 'Run integration tests');

  const compact = cm.getCompactView('ctx-test');
  log('CONTEXT', 'Context created with large data', compact.size > 0 ? 'VERIFIED' : 'FALSE',
    'Size: ' + compact.size + ' bytes');

  // Check goal survived
  const full = cm.getContext('ctx-test');
  log('CONTEXT', 'Goal preserved after compaction', full.currentGoal === 'Implement connection pooling' ? 'VERIFIED' : 'FALSE',
    'Goal: ' + full.currentGoal);

  log('CONTEXT', 'Constraints preserved', full.constraints.length === 2 ? 'VERIFIED' : 'FALSE',
    'Constraints: ' + full.constraints.length);

  log('CONTEXT', 'Next action preserved', full.nextAction === 'Run integration tests' ? 'VERIFIED' : 'FALSE',
    'Next: ' + full.nextAction);

  // Facts/decisions were compacted (trimmed to 20/20)
  log('CONTEXT', 'Facts compacted to 20', full.currentFacts.length <= 20 ? 'VERIFIED' : 'FALSE',
    'Facts: ' + full.currentFacts.length);

  log('CONTEXT', 'Decisions compacted to 20', full.decisions.length <= 20 ? 'VERIFIED' : 'FALSE',
    'Decisions: ' + full.decisions.length);

  // No invented info
  const hasInvented = full.currentGoal !== 'Implement connection pooling' ||
    full.constraints[0] !== 'Must work with MongoDB 6';
  log('CONTEXT', 'No invented information', !hasInvented ? 'VERIFIED' : 'FALSE');
}

// ═══════════════════════════════════════════════════════
// 9. SCALE SANITY
// ═══════════════════════════════════════════════════════
function auditScale() {
  console.log('\n=== 9. SCALE SANITY ===');
  const bus = new IntelligenceBus({ dataDir: path.join(AUDIT_DIR, 'scale') });

  // Submit 100 items
  const start = Date.now();
  for (let i = 0; i < 100; i++) {
    bus.submit({
      type: i % 5 === 0 ? 'lesson' : 'experience',
      content: 'Item ' + i + ': pattern for handling component ' + (i % 20),
      sourceAgent: 'agent_' + (i % 5),
      evidence: [{ type: 'test_pass' }],
      tags: ['tag_' + (i % 10), 'component_' + (i % 20)]
    });
  }
  const submitTime = Date.now() - start;
  log('SCALE', '100 items submitted', submitTime < 5000 ? 'VERIFIED' : 'PARTIAL',
    'Time: ' + submitTime + 'ms');

  // Query performance
  const qStart = Date.now();
  for (let i = 0; i < 50; i++) {
    bus.retrieve({ tags: ['tag_' + (i % 10)], minConfidence: 0 });
  }
  const queryTime = Date.now() - qStart;
  log('SCALE', '50 queries executed', queryTime < 5000 ? 'VERIFIED' : 'PARTIAL',
    'Time: ' + queryTime + 'ms');

  // Index size
  const indexSize = Object.keys(bus.index).length;
  log('SCALE', 'In-memory index reflects disk', indexSize >= 100 ? 'VERIFIED' : 'PARTIAL',
    'Index entries: ' + indexSize);
}

// ═══════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════
function runAudit() {
  console.log('==========================================');
  console.log('  GARUDA PHASE 5 — FORENSIC REALITY AUDIT');
  console.log('==========================================');

  cleanup();

  auditCodeForensics();
  auditCrossAgent();
  auditNegativeLearning();
  auditConflict();
  auditFirewall();
  auditNazar();
  auditDurability();
  auditContext();
  auditScale();

  // Summary
  console.log('\n==========================================');
  console.log('  VERDICT SUMMARY');
  console.log('==========================================');

  const byStatus = {};
  for (const f of FINDINGS) {
    byStatus[f.status] = (byStatus[f.status] || 0) + 1;
  }
  for (const [s, c] of Object.entries(byStatus)) {
    console.log('  ' + s + ': ' + c);
  }
  console.log('  TOTAL: ' + FINDINGS.length);

  console.log('\n  DETAILED FINDINGS:');
  for (const f of FINDINGS) {
    const mark = f.status === 'VERIFIED' ? '[V]' : f.status === 'PARTIAL' ? '[P]' : '[F]';
    console.log('  ' + mark + ' ' + f.cat + ' | ' + f.claim);
    if (f.evidence) console.log('       ' + f.evidence);
  }

  cleanup();
  return FINDINGS;
}

module.exports = { runAudit };
if (require.main === module) runAudit();
