const fs = require('fs');
const path = require('path');
const { TASK_STATES } = require('./taskStateTracker');
const TaskContinuationController = require('./taskContinuationController');
const { ApprovalGate } = require('../../scripts/dev-agent/core/DevelopmentApprovalGate');

async function runPhase4Tests() {
  console.log('🧪 Starting GARUDA Phase 4 Verified Mission Continuation Test Suite...\n');

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

  const testTmpDir = path.join(process.cwd(), 'scratch', 'phase4_test_tmp');
  if (!fs.existsSync(testTmpDir)) {
    fs.mkdirSync(testTmpDir, { recursive: true });
  }

  const approvedGate = new ApprovalGate({ founderApproved: true });
  const unapprovedGate = new ApprovalGate({ founderApproved: false });

  const controllerApproved = new TaskContinuationController({ approvalGate: approvedGate, maxContinuationDepth: 3 });
  const controllerUnapproved = new TaskContinuationController({ approvalGate: unapprovedGate, maxContinuationDepth: 3 });

  // -------------------------------------------------------------
  // 1. SEQUENTIAL TASK CONTINUATION & DEPENDENCY TESTS
  // -------------------------------------------------------------
  console.log('--- 1. MISSION CONTINUATION & DEPENDENCY TESTS ---');

  const fileAPath = path.join('scratch', 'phase4_test_tmp', 'fileA.txt');
  const fileBPath = path.join('scratch', 'phase4_test_tmp', 'fileB.txt');

  const validMissionTasks = [
    {
      id: 'taskA',
      taskType: 'file_create',
      targetPath: fileAPath,
      content: 'Task A Output',
      dependencies: []
    },
    {
      id: 'taskB',
      taskType: 'file_create',
      targetPath: fileBPath,
      content: 'Task B Output',
      dependencies: ['taskA'] // Depends on Task A!
    }
  ];

  // Test 1: Task A success allows eligible Task B
  const missionRes1 = await controllerApproved.runMission(validMissionTasks, { founderApproved: true });
  assert(
    missionRes1.status === 'COMPLETED' &&
    missionRes1.missionCompleted === true &&
    missionRes1.totalStepsExecuted === 2 &&
    missionRes1.tasks.every((t) => t.status === TASK_STATES.VERIFIED_SUCCESS),
    'Task A success allows eligible Task B to execute and complete mission'
  );

  // Test 2: Dependency enforced (Task B cannot run if Task A failed)
  const failingMissionTasks = [
    {
      id: 'taskA_fail',
      taskType: 'command_exec',
      command: 'node -e "process.exit(1)"', // Fails!
      dependencies: []
    },
    {
      id: 'taskB_dep',
      taskType: 'file_create',
      targetPath: path.join('scratch', 'phase4_test_tmp', 'fileB_dep.txt'),
      content: 'Should not run',
      dependencies: ['taskA_fail']
    }
  ];

  const missionRes2 = await controllerApproved.runMission(failingMissionTasks, { founderApproved: true });
  const taskB_dep = missionRes2.tasks.find((t) => t.id === 'taskB_dep');
  assert(
    missionRes2.status === 'STOPPED_AT_FAILURE' &&
    missionRes2.missionCompleted === false &&
    taskB_dep.status === TASK_STATES.PENDING,
    'Task A failure stops continuation; dependent Task B remains PENDING and does NOT run'
  );

  // Test 3: Blocked task stops safely under unapproved governance
  const missionRes3 = await controllerUnapproved.runMission(validMissionTasks, { founderApproved: false });
  assert(
    missionRes3.status === 'STOPPED_AT_APPROVAL' &&
    missionRes3.missionCompleted === false,
    'Task requiring unapproved governance blocks safely and stops mission continuation'
  );

  // Test 4: Continuation depth limit enforced
  const longMissionTasks = Array.from({ length: 5 }, (_, i) => ({
    id: `task_${i + 1}`,
    taskType: 'command_exec',
    command: 'node -v',
    dependencies: i > 0 ? [`task_${i}`] : []
  }));

  const controllerDepthLimit = new TaskContinuationController({ approvalGate: approvedGate, maxContinuationDepth: 2 });
  const missionRes4 = await controllerDepthLimit.runMission(longMissionTasks, { founderApproved: true });
  assert(
    missionRes4.status === 'DEPTH_LIMIT_REACHED' &&
    missionRes4.totalStepsExecuted === 2 &&
    missionRes4.maxContinuationDepth === 2,
    'Continuation depth limit enforced; stops safely at maxContinuationDepth'
  );

  // Test 5: Invalid next task rejected
  const invalidNextTaskMission = [
    {
      id: 'task1_ok',
      taskType: 'command_exec',
      command: 'node -v',
      dependencies: []
    },
    {
      id: 'task2_bad',
      taskType: 'invalid_unsupported_task_type',
      dependencies: ['task1_ok']
    }
  ];

  const missionRes5 = await controllerApproved.runMission(invalidNextTaskMission, { founderApproved: true });
  assert(
    missionRes5.status === 'STOPPED_AT_FAILURE' &&
    missionRes5.tasks[1].status === TASK_STATES.VERIFIED_FAILURE,
    'Invalid next task type rejected safely during continuation'
  );

  // Test 6: Every task in continuation passes governance & validation
  const absA = path.resolve(process.cwd(), fileAPath);
  const absB = path.resolve(process.cwd(), fileBPath);
  assert(
    fs.existsSync(absA) && fs.existsSync(absB) &&
    fs.readFileSync(absA, 'utf8') === 'Task A Output' &&
    fs.readFileSync(absB, 'utf8') === 'Task B Output',
    'Every task in continuation passed governance and deterministic validation on disk'
  );

  // Cleanup temporary test files
  try {
    if (fs.existsSync(absA)) fs.unlinkSync(absA);
    if (fs.existsSync(absB)) fs.unlinkSync(absB);
    if (fs.existsSync(testTmpDir)) fs.rmdirSync(testTmpDir, { recursive: true });
  } catch (e) {
    // Silent cleanup
  }

  console.log(`\n📊 Phase 4 Test Results: ${passed} Passed, ${failed} Failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runPhase4Tests();
}

module.exports = runPhase4Tests;
