const fs = require('fs');
const path = require('path');
const FailureDiagnosisEngine = require('./failureDiagnosisEngine');
const CorrectivePlanGenerator = require('./correctivePlanGenerator');
const BoundedRetryController = require('./boundedRetryController');
const FailureRecoveryEngine = require('./failureRecoveryEngine');
const { ApprovalGate } = require('../../scripts/dev-agent/core/DevelopmentApprovalGate');

async function runPhase3Tests() {
  console.log('🧪 Starting GARUDA Phase 3 Failure Diagnosis + Controlled Retry Test Suite...\n');

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

  const diagnoser = new FailureDiagnosisEngine();
  const planGen = new CorrectivePlanGenerator();
  const recoveryEngine = new FailureRecoveryEngine({ maxRetries: 2 });

  // -------------------------------------------------------------
  // 1. FAILURE DIAGNOSIS TESTS
  // -------------------------------------------------------------
  console.log('--- 1. FAILURE DIAGNOSIS TESTS ---');

  // Test 1: Retryable failure diagnosed (COMMAND_FAILURE)
  const diagCmd = diagnoser.diagnose({ failureCategory: 'COMMAND_FAILURE', errorCode: 'COMMAND_FAILED', reason: 'Process exit 1' });
  assert(diagCmd.retryable === true && diagCmd.classification === 'retryable', 'Retryable command failure diagnosed correctly');

  // Test 2: Non-retryable failure diagnosed (INVALID_TASK)
  const diagTask = diagnoser.diagnose({ failureCategory: 'INVALID_TASK', errorCode: 'INVALID_TASK' });
  assert(diagTask.retryable === false && diagTask.classification === 'non_retryable', 'Non-retryable invalid task failure diagnosed correctly');

  // Test 3: Founder intervention required for APPROVAL_BLOCKED
  const diagApp = diagnoser.diagnose({ failureCategory: 'APPROVAL_BLOCKED', errorCode: 'BLOCKED_BY_APPROVAL' });
  assert(diagApp.requiresFounderIntervention === true && diagApp.classification === 'requires_founder_intervention', 'Approval blocked requires founder intervention');

  // Test 4: Founder intervention required for PATH_SECURITY_FAILURE
  const diagSec = diagnoser.diagnose({ failureCategory: 'PATH_SECURITY_FAILURE', errorCode: 'PATH_OUTSIDE_WORKSPACE' });
  assert(diagSec.requiresFounderIntervention === true && diagSec.classification === 'requires_founder_intervention', 'Security failure requires founder intervention');

  // -------------------------------------------------------------
  // 2. CORRECTIVE PLAN GENERATION TESTS
  // -------------------------------------------------------------
  console.log('\n--- 2. CORRECTIVE PLAN GENERATION TESTS ---');

  // Test 5: Corrective plan generated for retryable failure
  const planCmd = planGen.generatePlan({ id: 'task-1', taskType: 'command_exec', command: 'node -v' }, diagCmd);
  assert(planCmd.hasCorrectivePlan === true && planCmd.strategy === 'COMMAND_RETRY' && planCmd.correctiveTask.id.includes('_retry_'), 'Corrective plan generated for retryable command task');

  // Test 6: No corrective plan generated for security failure
  const planSec = planGen.generatePlan({ id: 'task-2', taskType: 'file_read', targetPath: '../../etc/hosts' }, diagSec);
  assert(planSec.hasCorrectivePlan === false && planSec.correctiveTask === null, 'No corrective plan generated for security failure');

  // -------------------------------------------------------------
  // 3. BOUNDED RETRY & GOVERNANCE TESTS
  // -------------------------------------------------------------
  console.log('\n--- 3. BOUNDED RETRY & GOVERNANCE TESTS ---');

  const testTmpDir = path.join(process.cwd(), 'scratch', 'phase3_test_tmp');
  if (!fs.existsSync(testTmpDir)) {
    fs.mkdirSync(testTmpDir, { recursive: true });
  }

  // Test 7: Security failure is NEVER bypassed
  const secFailResult = {
    status: 'VERIFIED_FAILURE',
    verified: false,
    taskId: 'sec-1',
    failureCategory: 'PATH_SECURITY_FAILURE',
    errorCode: 'PATH_OUTSIDE_WORKSPACE',
    error: 'Path outside workspace'
  };
  const secRecovery = await recoveryEngine.recoverTask(
    { id: 'sec-1', taskType: 'file_read', targetPath: '../../secret.txt' },
    secFailResult,
    { founderApproved: true }
  );
  assert(secRecovery.status === 'RECOVERY_BLOCKED' && secRecovery.recovered === false && secRecovery.retryCount === 0, 'Security failure is NEVER bypassed by recovery engine');

  // Test 8: Approval failure is NEVER self-approved
  const appFailResult = {
    status: 'VERIFIED_FAILURE',
    verified: false,
    taskId: 'app-1',
    failureCategory: 'APPROVAL_BLOCKED',
    errorCode: 'BLOCKED_BY_APPROVAL',
    error: 'Blocked by founder approval'
  };
  const appRecovery = await recoveryEngine.recoverTask(
    { id: 'app-1', taskType: 'file_create', targetPath: path.join('scratch', 'phase3_test_tmp', 'app.txt'), content: 'App' },
    appFailResult,
    { founderApproved: false }
  );
  assert(appRecovery.status === 'RECOVERY_BLOCKED' && appRecovery.recovered === false && appRecovery.retryCount === 0, 'Approval failure is NEVER self-approved by recovery engine');

  // Test 9: Retry executes and recovers successfully when retry succeeds
  const retryableTask = {
    id: 'retry-1',
    taskType: 'command_exec',
    command: 'node -v'
  };
  const initialCmdFailResult = {
    status: 'VERIFIED_FAILURE',
    verified: false,
    taskId: 'retry-1',
    failureCategory: 'COMMAND_FAILURE',
    errorCode: 'COMMAND_FAILED',
    error: 'Transient exit code 1'
  };

  const successRecovery = await recoveryEngine.recoverTask(
    retryableTask,
    initialCmdFailResult,
    { founderApproved: true }
  );
  assert(
    successRecovery.status === 'RECOVERED_SUCCESS' &&
    successRecovery.recovered === true &&
    successRecovery.retryCount === 1,
    'Retry executes, passes governance, and recovers task successfully'
  );

  // Test 10: Retry limit enforced & RECOVERY_EXHAUSTED returned for persistent failures
  const persistentFailTask = {
    id: 'persist-1',
    taskType: 'command_exec',
    command: 'node -e "process.exit(1)"' // Always fails
  };
  const exhaustedRecovery = await recoveryEngine.recoverTask(
    persistentFailTask,
    initialCmdFailResult,
    { founderApproved: true }
  );
  assert(
    exhaustedRecovery.status === 'RECOVERY_EXHAUSTED' &&
    exhaustedRecovery.recovered === false &&
    exhaustedRecovery.retryCount === 2 &&
    exhaustedRecovery.maxRetries === 2,
    'Retry limit enforced (max 2 retries); returns RECOVERY_EXHAUSTED without infinite loops'
  );

  // Cleanup temporary test files
  try {
    if (fs.existsSync(testTmpDir)) fs.rmdirSync(testTmpDir, { recursive: true });
  } catch (e) {
    // Silent cleanup
  }

  console.log(`\n📊 Phase 3 Test Results: ${passed} Passed, ${failed} Failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runPhase3Tests();
}

module.exports = runPhase3Tests;
