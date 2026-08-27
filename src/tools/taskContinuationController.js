const { TASK_STATES, TaskStateTracker } = require('./taskStateTracker');
const TaskEligibilityEvaluator = require('./taskEligibilityEvaluator');
const TaskExecutionBridge = require('./taskExecutionBridge');
const TaskExecutionValidator = require('./taskExecutionValidator');
const FailureRecoveryEngine = require('./failureRecoveryEngine');

/**
 * GARUDA Bounded Mission Continuation Controller
 * Sequentially executes eligible tasks in a mission up to a bounded continuation limit.
 */
class TaskContinuationController {
  constructor(options = {}) {
    this.workspaceRoot = options.workspaceRoot || process.cwd();
    this.maxContinuationDepth = Math.min(options.maxContinuationDepth || 5, 10);
    this.approvalGate = options.approvalGate;
    this.bridge = new TaskExecutionBridge({ workspaceRoot: this.workspaceRoot, approvalGate: this.approvalGate });
    this.validator = new TaskExecutionValidator({ workspaceRoot: this.workspaceRoot });
    this.evaluator = new TaskEligibilityEvaluator({ approvalGate: this.approvalGate });
    this.recoveryEngine = new FailureRecoveryEngine({ workspaceRoot: this.workspaceRoot, maxRetries: 2 });
  }

  /**
   * Executes a bounded mission continuation loop over a set of structured tasks.
   */
  async runMission(initialTasks = [], context = {}) {
    const tracker = new TaskStateTracker(initialTasks);
    let stepCount = 0;
    let stopReason = null;
    let overallStatus = 'IN_PROGRESS';

    while (stepCount < this.maxContinuationDepth) {
      // 1. Evaluate next eligible task
      const eligibility = this.evaluator.findNextEligibleTask(tracker, context);

      if (!eligibility.eligible) {
        if (eligibility.blockedByApproval && eligibility.task) {
          tracker.updateState(eligibility.task.id, TASK_STATES.BLOCKED, { reason: eligibility.reason });
          stopReason = eligibility.reason;
          overallStatus = 'STOPPED_AT_APPROVAL';
        } else {
          stopReason = eligibility.reason;
          overallStatus = tracker.isMissionComplete() ? 'COMPLETED' : 'NO_MORE_ELIGIBLE_TASKS';
        }
        break;
      }

      const taskToRun = eligibility.task;
      stepCount++;

      // 2. Mark task as RUNNING
      tracker.updateState(taskToRun.id, TASK_STATES.RUNNING, { step: stepCount });

      // 3. Execute Task through Governed Tool Bridge
      const execResult = await this.bridge.executeTask(taskToRun.rawTask, context);

      // 4. Deterministically Validate Result
      const validation = this.validator.validateExecutionResult(execResult);

      if (validation.status === 'VERIFIED_SUCCESS') {
        tracker.updateState(taskToRun.id, TASK_STATES.VERIFIED_SUCCESS, { step: stepCount, validation });
        continue; // Proceed to next eligible task in loop!
      }

      // 5. Task Failed — Attempt Governed Phase 3 Recovery
      tracker.updateState(taskToRun.id, TASK_STATES.RECOVERY, { step: stepCount, initialValidation: validation });
      const recoveryRes = await this.recoveryEngine.recoverTask(taskToRun.rawTask, validation, context);

      if (recoveryRes.recovered && recoveryRes.status === 'RECOVERED_SUCCESS') {
        tracker.updateState(taskToRun.id, TASK_STATES.VERIFIED_SUCCESS, { step: stepCount, recovery: recoveryRes });
        continue; // Recovered! Proceed to next eligible task in loop!
      }

      // Recovery Failed or Blocked — Stop Continuation immediately!
      const isApprovalBlock = recoveryRes.diagnosis && recoveryRes.diagnosis.failureCategory === 'APPROVAL_BLOCKED';
      const finalTaskState = isApprovalBlock ? TASK_STATES.BLOCKED : TASK_STATES.VERIFIED_FAILURE;
      tracker.updateState(taskToRun.id, finalTaskState, { step: stepCount, recovery: recoveryRes });
      stopReason = `Task '${taskToRun.id}' failed verification and recovery: ${recoveryRes.reason}`;
      overallStatus = isApprovalBlock ? 'STOPPED_AT_APPROVAL' : 'STOPPED_AT_FAILURE';
      break;
    }

    if (stepCount >= this.maxContinuationDepth && overallStatus === 'IN_PROGRESS') {
      overallStatus = 'DEPTH_LIMIT_REACHED';
      stopReason = `Reached maximum continuation depth limit (${this.maxContinuationDepth}).`;
    }

    return {
      status: overallStatus,
      missionCompleted: tracker.isMissionComplete(),
      totalStepsExecuted: stepCount,
      maxContinuationDepth: this.maxContinuationDepth,
      stopReason,
      tasks: tracker.getAllTasks()
    };
  }
}

module.exports = TaskContinuationController;
