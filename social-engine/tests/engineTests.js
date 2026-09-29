/**
 * GARUDA Social Engine - Comprehensive Test Suite
 * Covers state machine, locking, Instagram extractor scoring, qualification,
 * security detection, worker isolation, outreach safety, and secret redaction.
 */

const assert = require('assert');
const { WorkerStateMachine, WORKER_STATES } = require('../core/stateMachine');
const ProfileLockManager = require('../browser/profileLockManager');
const RateLimiter = require('../core/rateLimiter');
const LeadQualification = require('../leads/leadQualification');
const LeadNormalizer = require('../leads/leadNormalizer');

const runStateMachineTests = require('./stateMachine.test');
const runSecurityDetectorTests = require('./securityDetector.test');
const runInstagramRegressionTests = require('./instagramRegression.test');
const runProfileLockTests = require('./profileLockRecovery.test');
const testCdpAttach = require('./cdpAttach.test');
const runWorkerIsolationTests = require('./workerIsolation.test');
const runOutreachSafetyTests = require('./outreachSafetyGate.test');
const runTelegramRedactionTests = require('./telegramRedaction.test');

let passedCount = 0;
let totalCount = 0;

function test(name, fn) {
  totalCount++;
  try {
    fn();
    console.log(`✔ [PASS] ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}:`, err.message);
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('🦅 GARUDA SOCIAL ENGINE MASTER TEST SUITE');
  console.log('====================================================\n');

  // 1. Baseline Unit Tests
  test('StateMachine: valid transition sequence', () => {
    const sm = new WorkerStateMachine('instagram');
    assert.strictEqual(sm.getState(), WORKER_STATES.INITIALIZING);
    sm.transition(WORKER_STATES.STARTING_BROWSER);
    assert.strictEqual(sm.getState(), WORKER_STATES.STARTING_BROWSER);
    sm.transition(WORKER_STATES.AUTH_CHECK);
    assert.strictEqual(sm.getState(), WORKER_STATES.AUTH_CHECK);
    sm.transition(WORKER_STATES.READY);
    assert.strictEqual(sm.getState(), WORKER_STATES.READY);
  });

  test('StateMachine: reject invalid transition', () => {
    const sm = new WorkerStateMachine('instagram');
    assert.throws(() => {
      sm.transition(WORKER_STATES.OUTREACHING);
    }, /InvalidStateTransitionError/);
  });

  test('ProfileLockManager: acquire and release lock', () => {
    const lockMgr = new ProfileLockManager();
    const res = lockMgr.acquireLock('test_platform');
    assert.strictEqual(res.acquired, true);
    assert.strictEqual(res.pid, process.pid);

    const rel = lockMgr.releaseLock('test_platform');
    assert.strictEqual(rel.released, true);
  });

  test('RateLimiter: enforce minimum interval cooldown', () => {
    const limiter = new RateLimiter({ test: { maxHourly: 5, maxDaily: 10, minIntervalMs: 5000, baseJitterMs: 0 } });
    const check1 = limiter.canExecute('test');
    assert.strictEqual(check1.allowed, true);
    limiter.recordExecution('test');

    const check2 = limiter.canExecute('test');
    assert.strictEqual(check2.allowed, false);
    assert.strictEqual(check2.reason, 'MIN_INTERVAL_COOLDOWN');
  });

  test('LeadQualification: correctly qualify commercial buyer intent', () => {
    const text = 'Hey everyone, our startup is looking for a web developer to build an MVP in React and Node.js. Paid gig.';
    const res = LeadQualification.qualify(text);
    assert.strictEqual(res.qualified, true);
    assert.ok(res.confidence >= 50);
    assert.ok(res.signals.includes('HIRING_DEVELOPER'));
    assert.ok(res.signals.includes('BUILD_MVP_OR_SAAS'));
  });

  test('LeadQualification: reject seller promotion and student questions', () => {
    const text = 'I am a web developer available for hire! DM for services. Portfolio in bio.';
    const res = LeadQualification.qualify(text);
    assert.strictEqual(res.qualified, false);
    assert.ok(res.confidence < 50);
  });

  test('LeadNormalizer: generate deterministic leadId and uniform schema', () => {
    const raw = {
      author: { name: 'Acme Founder', username: 'acmefounder', profileUrl: 'https://instagram.com/acmefounder/', confidence: 95 },
      postUrl: 'https://instagram.com/p/test12345/',
      caption: 'Need a developer for our website'
    };
    const lead = LeadNormalizer.normalize('instagram', raw, ['NEED_WEBSITE']);
    assert.ok(lead.leadId.startsWith('lead_'));
    assert.strictEqual(lead.platform, 'instagram');
    assert.strictEqual(lead.username, 'acmefounder');
    assert.strictEqual(lead.status, 'VERIFIED');
  });

  console.log('\n--- Running Specialized Subsystem Test Suites ---');
  
  // 2. Subsystem Test Suites
  runStateMachineTests();
  await runSecurityDetectorTests();
  await runInstagramRegressionTests();
  runProfileLockTests();
  await testCdpAttach();
  runWorkerIsolationTests();
  runOutreachSafetyTests();
  runTelegramRedactionTests();

  console.log(`\n====================================================`);
  console.log(`Master Test Suite Execution Completed Cleanly.`);
  console.log(`Baseline Tests Passed: ${passedCount}/${totalCount}`);
  console.log('====================================================');
}

if (require.main === module) {
  runTests().catch(err => {
    console.error('Fatal test runner error:', err);
    process.exit(1);
  });
}

module.exports = runTests;
