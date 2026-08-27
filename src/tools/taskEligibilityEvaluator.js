const { TASK_STATES } = require('./taskStateTracker');
const { approvalGate: defaultApprovalGate } = require('../../scripts/dev-agent/core/DevelopmentApprovalGate');
const { requiresFounderApproval } = require('../motherCore/approval/approvalPolicy');

/**
 * GARUDA Task Eligibility Evaluator
 * Reuses & extends dependency checking logic to determine whether a next task is eligible to run.
 */
class TaskEligibilityEvaluator {
  constructor(options = {}) {
    this.approvalGate = options.approvalGate || defaultApprovalGate;
  }

  /**
   * Finds the next eligible task from a TaskStateTracker instance.
   */
  findNextEligibleTask(tracker, context = {}) {
    const tasks = tracker.getAllTasks();

    // Map of tasks that achieved VERIFIED_SUCCESS
    const completedTaskIds = new Set(
      tasks.filter((t) => t.status === TASK_STATES.VERIFIED_SUCCESS).map((t) => t.id)
    );

    // Find first task in PENDING status whose dependencies are all satisfied
    const candidate = tasks.find((task) => {
      if (task.status !== TASK_STATES.PENDING) {
        return false;
      }

      // Reusing dependency check pattern: all dependency IDs must be in completedTaskIds
      const dependenciesSatisfied = task.dependencies.every((depId) => completedTaskIds.has(depId));
      return dependenciesSatisfied;
    });

    if (!candidate) {
      return {
        eligible: false,
        reason: 'No eligible pending tasks found with satisfied dependencies.',
        task: null
      };
    }

    // Check Governance for candidate task
    const isWrite = ['file_create', 'file_modify', 'file_delete', 'command_exec', 'create', 'modify', 'delete', 'exec'].includes(candidate.taskType);
    const actionType = candidate.taskType === 'command_exec' ? 'autonomous_execution' : 'file_write';
    const policyRequires = requiresFounderApproval({ type: actionType });

    const approvalEval = this.approvalGate.evaluate(context);
    if (isWrite && policyRequires && !approvalEval.allowed) {
      return {
        eligible: false,
        reason: `Candidate task '${candidate.id}' blocked by founder approval governance.`,
        task: candidate,
        blockedByApproval: true
      };
    }

    return {
      eligible: true,
      reason: 'Task is pending, dependencies satisfied, and governance approved.',
      task: candidate,
      blockedByApproval: false
    };
  }
}

module.exports = TaskEligibilityEvaluator;
