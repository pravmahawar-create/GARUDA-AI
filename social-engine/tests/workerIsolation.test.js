/**
 * Worker Bulkhead & Fault Isolation Test
 * Section 11: Verifies that a crash or security block on one platform never impacts others.
 */

const assert = require('assert');
const { WorkerStateMachine, WORKER_STATES } = require('../core/stateMachine');
const RateLimiter = require('../core/rateLimiter');
const HealthMonitor = require('../core/healthMonitor');

function runWorkerIsolationTests() {
  console.log('--- Testing Worker Bulkhead Isolation ---');

  // 1. Independent State Machines for 3 platforms
  const linkedinSM = new WorkerStateMachine('linkedin');
  const instagramSM = new WorkerStateMachine('instagram');
  const facebookSM = new WorkerStateMachine('facebook');

  // Initialize all
  linkedinSM.transition(WORKER_STATES.STARTING_BROWSER);
  instagramSM.transition(WORKER_STATES.STARTING_BROWSER);
  facebookSM.transition(WORKER_STATES.STARTING_BROWSER);

  linkedinSM.transition(WORKER_STATES.AUTH_CHECK);
  instagramSM.transition(WORKER_STATES.AUTH_CHECK);
  facebookSM.transition(WORKER_STATES.AUTH_CHECK);

  // 2. Simulate LinkedIn encountering a fatal redirect / challenge
  linkedinSM.transition(WORKER_STATES.SECURITY_BLOCKED, 'LinkedIn Checkpoint Triggered');

  // Verify Instagram and Facebook remain healthy and operational
  assert.strictEqual(linkedinSM.getState(), WORKER_STATES.SECURITY_BLOCKED);
  assert.strictEqual(instagramSM.getState(), WORKER_STATES.AUTH_CHECK);
  assert.strictEqual(facebookSM.getState(), WORKER_STATES.AUTH_CHECK);

  // Instagram advances to READY and DISCOVERING
  instagramSM.transition(WORKER_STATES.READY);
  instagramSM.transition(WORKER_STATES.DISCOVERING);
  assert.strictEqual(instagramSM.getState(), WORKER_STATES.DISCOVERING);

  // Facebook encounters a crash (FAILED)
  facebookSM.transition(WORKER_STATES.FAILED, 'Network timeout');
  assert.strictEqual(facebookSM.getState(), WORKER_STATES.FAILED);

  // Instagram continues executing extracting and validating
  instagramSM.transition(WORKER_STATES.EXTRACTING);
  instagramSM.transition(WORKER_STATES.NORMALIZING);
  assert.strictEqual(instagramSM.getState(), WORKER_STATES.NORMALIZING);

  // 3. Isolated Rate Limiter Ceilings
  const rateLimiter = new RateLimiter({
    instagram: { maxHourly: 1, maxDaily: 5, minIntervalMs: 60000, baseJitterMs: 0 },
    facebook: { maxHourly: 5, maxDaily: 10, minIntervalMs: 10000, baseJitterMs: 0 }
  });

  // Exhaust Instagram rate limit
  rateLimiter.recordExecution('instagram');
  const igCheck = rateLimiter.canExecute('instagram');
  assert.strictEqual(igCheck.allowed, false);

  // Facebook rate limit must remain available and unaffected
  const fbCheck = rateLimiter.canExecute('facebook');
  assert.strictEqual(fbCheck.allowed, true);

  console.log('✔ Worker Bulkhead Isolation: ALL ASSERTIONS PASSED (Complete Failure Containment)');
  return true;
}

if (require.main === module) {
  runWorkerIsolationTests();
}

module.exports = runWorkerIsolationTests;
