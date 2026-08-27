const fs = require('fs');
const path = require('path');
const FileModifierTool = require('./fileModifierTool');
const LocalCommandRunnerTool = require('./localCommandRunnerTool');
const { ApprovalGate } = require('../../scripts/dev-agent/core/DevelopmentApprovalGate');

async function runPhase1Tests() {
  console.log('🧪 Starting GARUDA Phase 1 Execution Tools Test Suite...\n');

  const testTmpDir = path.join(process.cwd(), 'scratch', 'phase1_test_tmp');

  // Ensure scratch temp directory exists
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

  const fileToolUnapproved = new FileModifierTool({ approvalGate: unapprovedGate });
  const fileToolApproved = new FileModifierTool({ approvalGate: approvedGate });

  const commandToolUnapproved = new LocalCommandRunnerTool({ approvalGate: unapprovedGate });
  const commandToolApproved = new LocalCommandRunnerTool({ approvalGate: approvedGate });

  // -------------------------------------------------------------
  // 1. FILE TOOL TESTS
  // -------------------------------------------------------------
  console.log('--- 1. FILE MODIFIER TOOL TESTS ---');

  // Create temporary test file for reading
  const readTestFile = path.join('scratch', 'phase1_test_tmp', 'sample_read.txt');
  const readTestAbsPath = path.resolve(process.cwd(), readTestFile);
  fs.writeFileSync(readTestAbsPath, 'Hello GARUDA Phase 1', 'utf8');

  // Test 1: Read allowed file
  const readRes = await fileToolUnapproved.execute({ operation: 'read', targetPath: readTestFile });
  assert(readRes.success === true && readRes.content === 'Hello GARUDA Phase 1', 'Read allowed file');

  // Test 2: Create allowed file when approval is present
  const createTestFile = path.join('scratch', 'phase1_test_tmp', 'sample_create.txt');
  const createRes = await fileToolApproved.execute(
    { operation: 'create', targetPath: createTestFile, content: 'Created by Phase 1' },
    { founderApproved: true }
  );
  assert(createRes.success === true && createRes.errorCode === null, 'Create file when approval is present');

  // Test 3: Modify allowed file when approval is present
  const modifyRes = await fileToolApproved.execute(
    { operation: 'modify', targetPath: createTestFile, content: 'Modified content' },
    { founderApproved: true }
  );
  assert(modifyRes.success === true && modifyRes.bytesWritten > 0, 'Modify file when approval is present');

  // Test 4: Reject unauthorized write
  const unauthRes = await fileToolUnapproved.execute(
    { operation: 'create', targetPath: path.join('scratch', 'phase1_test_tmp', 'unauth.txt'), content: 'Denied' },
    { founderApproved: false }
  );
  assert(unauthRes.success === false && unauthRes.errorCode === 'BLOCKED_BY_APPROVAL', 'Reject unauthorized write');

  // Test 5: Reject path outside workspace
  const outsidePathRes = await fileToolApproved.execute(
    { operation: 'read', targetPath: 'C:/Windows/System32/drivers/etc/hosts' },
    { founderApproved: true }
  );
  assert(outsidePathRes.success === false && outsidePathRes.errorCode === 'PATH_OUTSIDE_WORKSPACE', 'Reject path outside workspace');

  // Test 6: Reject traversal path
  const traversalRes = await fileToolApproved.execute(
    { operation: 'create', targetPath: '../../outside_secret.txt', content: 'Traversal' },
    { founderApproved: true }
  );
  assert(traversalRes.success === false && traversalRes.errorCode === 'PATH_OUTSIDE_WORKSPACE', 'Reject traversal path');

  // -------------------------------------------------------------
  // 2. COMMAND RUNNER TOOL TESTS
  // -------------------------------------------------------------
  console.log('\n--- 2. LOCAL COMMAND RUNNER TOOL TESTS ---');

  // Test 7: Successful command
  const nodeVerRes = await commandToolApproved.execute(
    { command: 'node --version' },
    { founderApproved: true }
  );
  assert(nodeVerRes.success === true && nodeVerRes.exitCode === 0 && nodeVerRes.stdout.includes('v'), 'Successful command execution (node --version)');

  // Test 8: Failed command
  const failCmdRes = await commandToolApproved.execute(
    { command: 'node -e "process.exit(42)"' },
    { founderApproved: true }
  );
  assert(failCmdRes.success === false && failCmdRes.exitCode === 42 && failCmdRes.errorCode === 'COMMAND_FAILED', 'Failed command execution with non-zero exit code');

  // Test 9: Stdout captured
  const stdoutRes = await commandToolApproved.execute(
    { command: 'node -e "console.log(\'GARUDA_STDOUT_TEST\')"' },
    { founderApproved: true }
  );
  assert(stdoutRes.success === true && stdoutRes.stdout.includes('GARUDA_STDOUT_TEST'), 'Stdout captured cleanly');

  // Test 10: Stderr captured
  const stderrRes = await commandToolApproved.execute(
    { command: 'node -e "console.error(\'GARUDA_STDERR_TEST\')"' },
    { founderApproved: true }
  );
  assert(stderrRes.stderr.includes('GARUDA_STDERR_TEST'), 'Stderr captured cleanly');

  // Test 11: Exit code captured
  const exitCodeRes = await commandToolApproved.execute(
    { command: 'node -e "process.exit(7)"' },
    { founderApproved: true }
  );
  assert(exitCodeRes.exitCode === 7, 'Exit code captured cleanly');

  // Test 12: Unauthorized command blocked
  const unauthCmdRes = await commandToolUnapproved.execute(
    { command: 'node --version' },
    { founderApproved: false }
  );
  assert(unauthCmdRes.success === false && unauthCmdRes.errorCode === 'BLOCKED_BY_APPROVAL', 'Unauthorized command blocked');

  // Test 13: Invalid working directory rejected
  const invalidCwdRes = await commandToolApproved.execute(
    { command: 'node --version', cwd: '../../' },
    { founderApproved: true }
  );
  assert(invalidCwdRes.success === false && invalidCwdRes.errorCode === 'INVALID_WORKING_DIRECTORY', 'Invalid working directory outside workspace rejected');

  // -------------------------------------------------------------
  // 3. GOVERNANCE INTEGRATION & NO BYPASS TESTS
  // -------------------------------------------------------------
  console.log('\n--- 3. GOVERNANCE INTEGRATION TESTS ---');

  // Test 14: Governance is actually enforced
  const govEnforcedFile = await fileToolUnapproved.execute(
    { operation: 'modify', targetPath: readTestFile, content: 'Bypass attempt' },
    { founderApproved: false }
  );
  assert(govEnforcedFile.success === false && govEnforcedFile.errorCode === 'BLOCKED_BY_APPROVAL', 'Governance is actually enforced on file modification');

  // Test 15: No bypass exists
  const govEnforcedCmd = await commandToolUnapproved.execute(
    { command: 'dir' },
    {}
  );
  assert(govEnforcedCmd.success === false && govEnforcedCmd.errorCode === 'BLOCKED_BY_APPROVAL', 'No bypass exists for unapproved command runner execution');

  // Cleanup temporary test files
  try {
    if (fs.existsSync(readTestAbsPath)) fs.unlinkSync(readTestAbsPath);
    const createTestAbsPath = path.resolve(process.cwd(), createTestFile);
    if (fs.existsSync(createTestAbsPath)) fs.unlinkSync(createTestAbsPath);
    if (fs.existsSync(testTmpDir)) fs.rmdirSync(testTmpDir, { recursive: true });
  } catch (e) {
    // Cleanup silent error handling
  }

  console.log(`\n📊 Phase 1 Test Results: ${passed} Passed, ${failed} Failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runPhase1Tests();
}

module.exports = runPhase1Tests;
