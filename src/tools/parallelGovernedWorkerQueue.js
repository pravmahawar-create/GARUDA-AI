const { TASK_STATES, TaskStateTracker } = require('./taskStateTracker');
const TaskEligibilityEvaluator = require('./taskEligibilityEvaluator');
const TaskExecutionBridge = require('./taskExecutionBridge');
const TaskExecutionValidator = require('./taskExecutionValidator');
const FailureRecoveryEngine = require('./failureRecoveryEngine');

/**
 * GARUDA Governed Parallel Worker Queue
 * Manages task queues, enforces dependency graphs, detects dependency cycles,
 * and executes independent tasks concurrently under bounded worker concurrency limits.
 */
class ParallelGovernedWorkerQueue {
  constructor(options = {}) {
    this.workspaceRoot = options.workspaceRoot || process.cwd();
    this.maxConcurrency = Math.min(options.maxConcurrency || 3, 5); // Max 5 parallel workers
    this.approvalGate = options.approvalGate;
    this.bridge = new TaskExecutionBridge({ workspaceRoot: this.workspaceRoot, approvalGate: this.approvalGate });
    this.validator = new TaskExecutionValidator({ workspaceRoot: this.workspaceRoot });
    this.evaluator = new TaskEligibilityEvaluator({ approvalGate: this.approvalGate });
    this.recoveryEngine = new FailureRecoveryEngine({ workspaceRoot: this.workspaceRoot, maxRetries: 2 });
  }

  /**
   * Detects dependency cycles in task list using Depth-First Search (DFS).
   */
  detectCycle(tasks = []) {
    const adj = new Map();
    for (const task of tasks) {
      adj.set(task.id, task.dependencies || []);
    }

    const visited = new Set();
    const recStack = new Set();

    function dfs(nodeId) {
      visited.add(nodeId);
      recStack.add(nodeId);

      const neighbors = adj.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) return true;
        } else if (recStack.has(neighbor)) {
          return true; // Cycle detected!
        }
      }

      recStack.delete(nodeId);
      return false;
    }

    for (const task of tasks) {
      if (!visited.has(task.id)) {
        if (dfs(task.id)) return true;
      }
    }

    return false;
  }

  /**
   * Finds ALL currently eligible independent tasks from tracker.
   */
  findEligibleBatch(tracker, context = {}) {
    const tasks = tracker.getAllTasks();
    const completedTaskIds = new Set(
      tasks.filter((t) => t.status === TASK_STATES.VERIFIED_SUCCESS).map((t) => t.id)
    );

    const eligible = [];
    for (const task of tasks) {
      if (task.status === TASK_STATES.PENDING) {
        const depsSatisfied = (task.dependencies || []).every((depId) => completedTaskIds.has(depId));
        if (depsSatisfied) {
          eligible.push(task);
        }
      }
    }
    return eligible;
  }

  /**
   * Processes a task queue with bounded parallel execution.
   */
  async processQueue(initialTasks = [], context = {}) {
    // 1. Dependency Cycle Check
    if (this.detectCycle(initialTasks)) {
      return {
        status: 'CYCLE_DETECTED',
        queueCompleted: false,
        error: 'Dependency cycle detected in task queue',
        errorCode: 'DEPENDENCY_CYCLE',
        tasks: initialTasks
      };
    }

    const tracker = new TaskStateTracker(initialTasks);
    let activeWorkers = 0;

    while (true) {
      const eligibleBatch = this.findEligibleBatch(tracker, context);
      if (eligibleBatch.length === 0) {
        break; // No more eligible tasks
      }

      // Limit batch size to maxConcurrency
      const batchToRun = eligibleBatch.slice(0, this.maxConcurrency);

      // Execute batch concurrently using Promise.all
      await Promise.all(
        batchToRun.map(async (taskToRun) => {
          tracker.updateState(taskToRun.id, TASK_STATES.RUNNING);

          // Execute task via Governed Bridge
          const execResult = await this.bridge.executeTask(taskToRun.rawTask, context);
          const validation = this.validator.validateExecutionResult(execResult);

          if (validation.status === 'VERIFIED_SUCCESS') {
            tracker.updateState(taskToRun.id, TASK_STATES.VERIFIED_SUCCESS, { validation });
            return;
          }

          // Task failed — Route to Phase 3 Recovery
          tracker.updateState(taskToRun.id, TASK_STATES.RECOVERY, { validation });
          const recoveryRes = await this.recoveryEngine.recoverTask(taskToRun.rawTask, validation, context);

          if (recoveryRes.recovered && recoveryRes.status === 'RECOVERED_SUCCESS') {
            tracker.updateState(taskToRun.id, TASK_STATES.VERIFIED_SUCCESS, { recovery: recoveryRes });
          } else {
            const isApproval = recoveryRes.diagnosis && recoveryRes.diagnosis.failureCategory === 'APPROVAL_BLOCKED';
            tracker.updateState(taskToRun.id, isApproval ? TASK_STATES.BLOCKED : TASK_STATES.VERIFIED_FAILURE, { recovery: recoveryRes });
          }
        })
      );
    }

    const allTasks = tracker.getAllTasks();
    const hasFailures = allTasks.some((t) => [TASK_STATES.VERIFIED_FAILURE, TASK_STATES.BLOCKED].includes(t.status));

    return {
      status: tracker.isMissionComplete() ? 'COMPLETED' : (hasFailures ? 'STOPPED_AT_FAILURE' : 'INCOMPLETE'),
      queueCompleted: tracker.isMissionComplete(),
      maxConcurrency: this.maxConcurrency,
      tasks: allTasks
    };
  }
}

module.exports = ParallelGovernedWorkerQueue;
