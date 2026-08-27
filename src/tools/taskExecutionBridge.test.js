const fs = require('fs');
const path = require('path');
const TaskExecutionBridge = require('./taskExecutionBridge');
const TaskExecutionValidator = require('./taskExecutionValidator');
const { executeGovernedTask } = require('../motherCore/executor/safeExecutor');
const { ApprovalGate } = require('../../scripts/dev-agent/core/DevelopmentApprovalGate');

async function runPhase2Tests() {
  console.log('🧪 Starting GARUDA Phase 2 Mother Brain → Real Execution → Validation Slice Test Suite...\n');

  const testTmpDir = path.join(process.cwd(), 'scratch', 'phase2_test_tmp');

  if (!fs.existsSync(testTmpDir)) {
    fs.mkdirSync(testTmpDir, { recursive: true });
  }

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

  const unapprovedGate = new ApprovalGate({ founderApproved: false });
  const approvedGate = new ApprovalGate({ founderApproved: true });

  const bridgeUnapproved = new TaskExecutionBridge({ approvalGate: unapprovedGate });
  const bridgeApproved = new TaskExecutionBridge({ approvalGate: approvedGate });
  const validator = new TaskExecutionValidator();

  // -------------------------------------------------------------
  // 1. PLANNING → EXECUTION & TOOL SELECTION TESTS
  // -------------------------------------------------------------
  console.log('--- 1. TOOL DISPATCH & SELECTION TESTS ---');

  // Test 1: Structured file task reaches FileModifierTool
  const fileTaskRes = await bridgeApproved.executeTask(
    { id: 't-1', taskType: 'file_create', targetPath: path.join('scratch', 'phase2_test_tmp', 'f1.txt'), content: 'F1 Content' },
    { founderApproved: true }
  );
  assert(fileTaskRes.tool === 'fileModifierTool' && fileTaskRes.operation === 'create', 'Structured file task reaches FileModifierTool');

  // Test 2: Structured command task reaches LocalCommandRunnerTool
  const cmdTaskRes = await bridgeApproved.executeTask(
    { id: 't-2', taskType: 'command_exec', command: 'node -v' },
    { founderApproved: true }
  );
  assert(cmdTaskRes.tool === 'localCommandRunnerTool' && cmdTaskRes.operation === 'exec', 'Structured command task reaches LocalCommandRunnerTool');

  // Test 3: Unknown task type rejected
  const unknownTaskRes = await bridgeApproved.executeTask(
    { id: 't-3', taskType: 'arbitrary_magic_task' },
    { founderApproved: true }
  );
  assert(unknownTaskRes.success === false && unknownTaskRes.errorCode === 'INVALID_TASK' && unknownTaskRes.failureCategory === 'INVALID_TASK', 'Unknown task type rejected safely');

  // -------------------------------------------------------------
  // 2. GOVERNANCE TESTS
  // -------------------------------------------------------------
  console.log('\n--- 2. GOVERNANCE ENFORCEMENT TESTS ---');

  // Test 4: Approved task executes
  const appRes = await bridgeApproved.executeTask(
    { id: 't-4', taskType: 'file_create', targetPath: path.join('scratch', 'phase2_test_tmp', 'f2.txt'), content: 'F2 Content' },
    { founderApproved: true }
  );
  assert(appRes.success === true && appRes.governanceStatus === 'APPROVED', 'Approved task executes');

  // Test 5: Unapproved task is blocked
  const unappRes = await bridgeUnapproved.executeTask(
    { id: 't-5', taskType: 'file_create', targetPath: path.join('scratch', 'phase2_test_tmp', 'f3.txt'), content: 'F3 Content' },
    { founderApproved: false }
  );
  assert(unappRes.success === false && unappRes.errorCode === 'BLOCKED_BY_APPROVAL' && unappRes.failureCategory === 'APPROVAL_BLOCKED', 'Unapproved task is blocked');

  // Test 6: Approval cannot be bypassed
  const bypassRes = await bridgeUnapproved.executeTask(
    { id: 't-6', taskType: 'command_exec', command: 'node -v' },
    {}
  );
  assert(bypassRes.success === false && bypassRes.governanceStatus === 'BLOCKED_BY_APPROVAL', 'Approval cannot be bypassed');

  // -------------------------------------------------------------
  // 3. RESULTS & VALIDATOR TESTS
  // -------------------------------------------------------------
  console.log('\n--- 3. EXECUTION RESULTS & VALIDATOR TESTS ---');

  // Test 7: Successful file operation returns structured result & VERIFIED_SUCCESS
  const fileVal = validator.validateExecutionResult(appRes);
  assert(fileVal.status === 'VERIFIED_SUCCESS' && fileVal.verified === true, 'Successful file operation returns VERIFIED_SUCCESS');

  // Test 8: Successful command returns structured result & VERIFIED_SUCCESS
  const cmdVal = validator.validateExecutionResult(cmdTaskRes);
  assert(cmdVal.status === 'VERIFIED_SUCCESS' && cmdVal.verified === true, 'Successful command returns VERIFIED_SUCCESS');

  // Test 9: Failed command returns COMMAND_FAILURE and VERIFIED_FAILURE
  const failCmdRes = await bridgeApproved.executeTask(
    { id: 't-7', taskType: 'command_exec', command: 'node -e "process.exit(1)"' },
    { founderApproved: true }
  );
  const failCmdVal = validator.validateExecutionResult(failCmdRes);
  assert(failCmdVal.status === 'VERIFIED_FAILURE' && failCmdVal.failureCategory === 'COMMAND_FAILURE', 'Failed command returns VERIFIED_FAILURE and COMMAND_FAILURE category');

  // Test 10: Invalid file path returns PATH_SECURITY_FAILURE and VERIFIED_FAILURE
  const outsideRes = await bridgeApproved.executeTask(
    { id: 't-8', taskType: 'file_read', targetPath: '../../outside_secret.txt' },
    { founderApproved: true }
  );
  const outsideVal = validator.validateExecutionResult(outsideRes);
  assert(outsideVal.status === 'VERIFIED_FAILURE' && outsideVal.failureCategory === 'PATH_SECURITY_FAILURE', 'Outside workspace file operation returns VERIFIED_FAILURE and PATH_SECURITY_FAILURE');

  // -------------------------------------------------------------
  // 4. REALISTIC END-TO-END INTEGRATION TESTS
  // -------------------------------------------------------------
  console.log('\n--- 4. REALISTIC END-TO-END MOTHER BRAIN SLICE TESTS ---');

  // Test 11: End-to-end File Write & Validation Slice via executeGovernedTask
  const e2eFileTask = {
    id: 'e2e-1',
    taskType: 'file_create',
    targetPath: path.join('scratch', 'phase2_test_tmp', 'e2e_output.txt'),
    content: 'End-to-end Phase 2 Governed Output'
  };
  const e2eFileRes = await executeGovernedTask(e2eFileTask, { founderApproved: true });
  assert(
    e2eFileRes.verifiedStatus === 'VERIFIED_SUCCESS' &&
    e2eFileRes.verified === true &&
    fs.existsSync(path.resolve(process.cwd(), e2eFileTask.targetPath)),
    'End-to-end File Task: Mother Brain Task → Approval → File Modifier → Validator → VERIFIED_SUCCESS'
  );

  // Test 12: End-to-end Command Execution & Validation Slice via executeGovernedTask
  const e2eCmdTask = {
    id: 'e2e-2',
    taskType: 'command_exec',
    command: 'node -e "console.log(\'E2E_COMMAND_OK\')"'
  };
  const e2eCmdRes = await executeGovernedTask(e2eCmdTask, { founderApproved: true });
  assert(
    e2eCmdRes.verifiedStatus === 'VERIFIED_SUCCESS' &&
    e2eCmdRes.verified === true &&
    e2eCmdRes.executionResult.stdout.includes('E2E_COMMAND_OK'),
    'End-to-end Command Task: Mother Brain Task → Approval → Command Runner → Validator → VERIFIED_SUCCESS'
  );

  // Cleanup temporary test files
  try {
    const f1Path = path.resolve(process.cwd(), path.join('scratch', 'phase2_test_tmp', 'f1.txt'));
    const f2Path = path.resolve(process.cwd(), path.join('scratch', 'phase2_test_tmp', 'f2.txt'));
    const e2ePath = path.resolve(process.cwd(), path.join('scratch', 'phase2_test_tmp', 'e2e_output.txt'));
    if (fs.existsSync(f1Path)) fs.unlinkSync(f1Path);
    if (fs.existsSync(f2Path)) fs.unlinkSync(f2Path);
    if (fs.existsSync(e2ePath)) fs.unlinkSync(e2ePath);
    if (fs.existsSync(testTmpDir)) fs.rmdirSync(testTmpDir, { recursive: true });
  } catch (e) {
    // Cleanup silent error handling
  }

  console.log(`\n📊 Phase 2 Test Results: ${passed} Passed, ${failed} Failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runPhase2Tests();
}

module.exports = runPhase2Tests;
