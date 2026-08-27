const ExternalWorkerOrchestrator = require('./externalWorkerOrchestrator');
const { ApprovalGate } = require('../../scripts/dev-agent/core/DevelopmentApprovalGate');

async function runPhase8Tests() {
  console.log('🧪 Starting GARUDA Phase 8 External Workers & Bounded Autonomy Test Suite...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  const approvedGate = new ApprovalGate({ founderApproved: true });
  const orchestrator = new ExternalWorkerOrchestrator({ approvalGate: approvedGate });

  // -------------------------------------------------------------
  // 1. WORKER SELECTION & CONTRACT TESTS
  // -------------------------------------------------------------
  console.log('--- 1. WORKER SELECTION & PERMISSION TESTS ---');

  // Test 1: Worker selection via existing WorkforceRouter
  const selectRes = orchestrator.selectWorker({ taskType: 'analysis', requestedWorker: 'local_brain_worker' });
  assert(selectRes.success === true && selectRes.worker === 'local_brain_worker', 'Worker selection succeeds via WorkforceRouter');

  // Test 2: Auto git push & auto deploy blocked by governance
  const unauthAuto = await orchestrator.executeWithWorker(
    { id: 'worker-1', taskType: 'command_exec', command: 'node -v', autoGitPush: true },
    { founderApproved: true }
  );
  assert(unauthAuto.status === 'GOVERNANCE_BLOCKED' && unauthAuto.errorCode === 'UNAUTHORIZED_AUTO_ACTION', 'Automatic git push is strictly blocked by governance');

  // -------------------------------------------------------------
  // 3. INDEPENDENT VERIFICATION & RECOVERY TESTS
  // -------------------------------------------------------------
  console.log('\n--- 2. INDEPENDENT VERIFICATION & RECOVERY TESTS ---');

  // Test 3: Valid task executed with worker & independently verified by GARUDA
  const validWorkerRes = await orchestrator.executeWithWorker(
    { id: 'worker-2', taskType: 'command_exec', command: 'node -v', requestedWorker: 'local_brain_worker' },
    { founderApproved: true }
  );
  assert(
    validWorkerRes.status === 'VERIFIED_SUCCESS' &&
    validWorkerRes.verified === true &&
    validWorkerRes.worker === 'local_brain_worker',
    'Worker task independently verified by GARUDA validator'
  );

  // Test 4: Failed worker task routes to Phase 3 recovery engine
  const failedWorkerTask = {
    id: 'worker-3',
    taskType: 'command_exec',
    command: 'node -e "process.exit(1)"', // Fails initially
    requestedWorker: 'local_brain_worker'
  };
  const failWorkerRes = await orchestrator.executeWithWorker(failedWorkerTask, { founderApproved: true });
  assert(
    failWorkerRes.status === 'VERIFIED_FAILURE' &&
    failWorkerRes.verified === false,
    'Failed worker task routes cleanly into Phase 3 failure recovery'
  );

  console.log(`\n📊 Phase 8 Test Results: ${passed} Passed, ${failed} Failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runPhase8Tests();
}

module.exports = runPhase8Tests;
