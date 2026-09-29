/**
 * Forensic Test Suite: State Machine
 * Verifies all Section 4 states, transition constraints, terminal locks, and error handling.
 */

const assert = require('assert');
const { WorkerStateMachine, WORKER_STATES } = require('../core/stateMachine');

function runStateMachineTests() {
  console.log('--- Testing State Machine Forensics ---');

  // 1. Verify all 19 Section 4 states are declared
  const expectedStates = [
    'IDLE', 'INITIALIZING', 'ACQUIRING_LOCK', 'LAUNCHING_BROWSER', 'ATTACHING_BROWSER',
    'NAVIGATING', 'EXTRACTING', 'NORMALIZING', 'QUALIFYING', 'QUEUED',
    'AWAITING_APPROVAL', 'OUTREACHING', 'COMPLETED', 'UNKNOWN', 'SECURITY_BLOCKED',
    'FAILED', 'RETRY_WAIT', 'COOLDOWN', 'STOPPED'
  ];

  for (const s of expectedStates) {
    assert.ok(WORKER_STATES[s], `Missing state definition for: ${s}`);
  }

  // 2. Full legal lifecycle progression
  const sm = new WorkerStateMachine('instagram');
  assert.strictEqual(sm.getState(), WORKER_STATES.INITIALIZING);
  sm.transition(WORKER_STATES.ACQUIRING_LOCK, 'Acquiring session lock');
  sm.transition(WORKER_STATES.LAUNCHING_BROWSER, 'Launching isolated profile');
  sm.transition(WORKER_STATES.NAVIGATING, 'Navigating to hashtag');
  sm.transition(WORKER_STATES.EXTRACTING, 'Extracting post container');
  sm.transition(WORKER_STATES.NORMALIZING, 'Normalizing candidate');
  sm.transition(WORKER_STATES.QUALIFYING, 'Checking buyer intent');
  sm.transition(WORKER_STATES.QUEUED, 'Lead queued');
  sm.transition(WORKER_STATES.AWAITING_APPROVAL, 'Waiting human gate');
  sm.transition(WORKER_STATES.OUTREACHING, 'Approved, dispatching');
  sm.transition(WORKER_STATES.COMPLETED, 'Cycle finished');
  sm.transition(WORKER_STATES.IDLE, 'Resting in idle');

  // 3. Illegal transitions rejected
  assert.throws(() => {
    sm.transition(WORKER_STATES.OUTREACHING); // Cannot jump from IDLE to OUTREACHING directly
  }, /InvalidStateTransitionError/);

  // 4. Security failure cannot transition into outreach
  const smSec = new WorkerStateMachine('linkedin');
  smSec.transition(WORKER_STATES.STARTING_BROWSER);
  smSec.transition(WORKER_STATES.AUTH_CHECK);
  smSec.transition(WORKER_STATES.SECURITY_BLOCKED, 'Cloudflare Turnstile challenge detected');
  assert.strictEqual(smSec.getState(), WORKER_STATES.SECURITY_BLOCKED);
  assert.throws(() => {
    smSec.transition(WORKER_STATES.OUTREACHING);
  }, /InvalidStateTransitionError/);

  // 5. Terminal transitions: SECURITY_BLOCKED can only go to STOPPING -> STOPPED
  smSec.transition(WORKER_STATES.STOPPING, 'Releasing resources');
  smSec.transition(WORKER_STATES.STOPPED, 'Worker terminated safely');
  assert.strictEqual(smSec.getState(), WORKER_STATES.STOPPED);

  console.log('✔ State Machine Forensics: ALL ASSERTIONS PASSED');
  return true;
}

if (require.main === module) {
  runStateMachineTests();
}

module.exports = runStateMachineTests;
