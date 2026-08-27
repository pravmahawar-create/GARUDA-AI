const ParallelGovernedWorkerQueue = require('./parallelGovernedWorkerQueue');
const { TASK_STATES } = require('./taskStateTracker');
const { ApprovalGate } = require('../../scripts/dev-agent/core/DevelopmentApprovalGate');

async function runPhase7Tests() {
  console.log('🧪 Starting GARUDA Phase 7 Task Queue & Parallel Governed Workers Test Suite...\n');

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
  const queue = new ParallelGovernedWorkerQueue({ approvalGate: approvedGate, maxConcurrency: 2 });

  // -------------------------------------------------------------
  // 1. DEPENDENCY GRAPH & CYCLE DETECTION TESTS
  // -------------------------------------------------------------
  console.log('--- 1. DEPENDENCY GRAPH & CYCLE TESTS ---');

  // Test 1: Cycle detection rejects dependency cycles
  const cycleTasks = [
    { id: 'taskA', taskType: 'command_exec', command: 'node -v', dependencies: ['taskB'] },
    { id: 'taskB', taskType: 'command_exec', command: 'node -v', dependencies: ['taskA'] } // Cycle A -> B -> A!
  ];

  const cycleRes = await queue.processQueue(cycleTasks, { founderApproved: true });
  assert(cycleRes.status === 'CYCLE_DETECTED' && cycleRes.errorCode === 'DEPENDENCY_CYCLE', 'Dependency cycle detected and queue rejected safely');

  // Test 2: Independent tasks execute concurrently and complete
  const independentTasks = [
    { id: 'ind1', taskType: 'command_exec', command: 'node -v', dependencies: [] },
    { id: 'ind2', taskType: 'command_exec', command: 'node -v', dependencies: [] }
  ];

  const indRes = await queue.processQueue(independentTasks, { founderApproved: true });
  assert(
    indRes.status === 'COMPLETED' &&
    indRes.queueCompleted === true &&
    indRes.tasks.every((t) => t.status === TASK_STATES.VERIFIED_SUCCESS),
    'Independent tasks execute concurrently and complete successfully'
  );

  // -------------------------------------------------------------
  // 2. DEPENDENCY ENFORCEMENT & GOVERNANCE TESTS
  // -------------------------------------------------------------
  console.log('\n--- 2. DEPENDENCY & GOVERNANCE WORKER TESTS ---');

  // Test 3: Dependent tasks remain sequential and satisfy dependencies
  const sequentialTasks = [
    { id: 'seq1', taskType: 'command_exec', command: 'node -v', dependencies: [] },
    { id: 'seq2', taskType: 'command_exec', command: 'node -v', dependencies: ['seq1'] }
  ];

  const seqRes = await queue.processQueue(sequentialTasks, { founderApproved: true });
  assert(
    seqRes.status === 'COMPLETED' &&
    seqRes.tasks[0].status === TASK_STATES.VERIFIED_SUCCESS &&
    seqRes.tasks[1].status === TASK_STATES.VERIFIED_SUCCESS,
    'Dependent tasks remain sequential and execute after prerequisites complete'
  );

  // Test 4: Governed worker failure isolation & Phase 3 recovery integration
  const failingWorkerTasks = [
    { id: 'fail1', taskType: 'command_exec', command: 'node -e "process.exit(1)"', dependencies: [] }, // Persistent failure
    { id: 'depFail', taskType: 'command_exec', command: 'node -v', dependencies: ['fail1'] } // Blocked by fail1
  ];

  const failRes = await queue.processQueue(failingWorkerTasks, { founderApproved: true });
  assert(
    failRes.status === 'STOPPED_AT_FAILURE' &&
    failRes.tasks[0].status === TASK_STATES.VERIFIED_FAILURE &&
    failRes.tasks[1].status === TASK_STATES.PENDING,
    'Worker failure isolates failed task and prevents dependent tasks from running'
  );

  console.log(`\n📊 Phase 7 Test Results: ${passed} Passed, ${failed} Failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runPhase7Tests();
}

module.exports = runPhase7Tests;
