const WorkforceRouter = require('../../scripts/dev-agent/core/WorkforceRouter');
const TaskExecutionBridge = require('./taskExecutionBridge');
const TaskExecutionValidator = require('./taskExecutionValidator');
const FailureRecoveryEngine = require('./failureRecoveryEngine');

/**
 * GARUDA Governed External Worker Orchestrator
 * Orchestrates external AI workers (local_brain_worker, aider, gemini, cline, copilot)
 * under strict permission boundaries, independent verification, and failure recovery routing.
 */
class ExternalWorkerOrchestrator {
  constructor(options = {}) {
    this.workspaceRoot = options.workspaceRoot || process.cwd();
    this.approvalGate = options.approvalGate;
    this.workforceRouter = options.workforceRouter || new WorkforceRouter();
    this.bridge = new TaskExecutionBridge({ workspaceRoot: this.workspaceRoot, approvalGate: this.approvalGate });
    this.validator = new TaskExecutionValidator({ workspaceRoot: this.workspaceRoot });
    this.recoveryEngine = new FailureRecoveryEngine({ workspaceRoot: this.workspaceRoot, maxRetries: 2 });
  }

  /**
   * Selects an appropriate worker for a task using WorkforceRouter capabilities.
   */
  selectWorker(task = {}) {
    const requiredCapability = task.requiredCapability || (task.taskType === 'command_exec' ? 'run_commands' : 'read');
    const workerName = task.requestedWorker || 'local_brain_worker';

    // Verify capability matching
    const routing = this.workforceRouter.route(task, {
      requestedWorker: workerName,
      requiredCapability
    });

    if (!routing || routing.success === false) {
      return {
        success: false,
        worker: null,
        error: routing ? routing.reason : 'Worker capability mismatch',
        errorCode: 'WORKER_MISMATCH'
      };
    }

    return {
      success: true,
      worker: routing.selectedWorker || workerName,
      capabilities: routing.capabilities || [],
      costClass: routing.costClass || 'zero_external_cost'
    };
  }

  /**
   * Orchestrates worker execution under strict GARUDA governance and independent verification.
   */
  async executeWithWorker(task = {}, context = {}) {
    // 1. Worker Selection & Capability Check
    const selection = this.selectWorker(task);
    if (!selection.success) {
      return {
        status: 'WORKER_REJECTED',
        verified: false,
        error: selection.error,
        errorCode: selection.errorCode,
        taskId: task.id
      };
    }

    // 2. Permission Boundary Check: Prohibit auto-push & auto-deploy
    if (task.autoGitPush === true || task.autoDeploy === true) {
      return {
        status: 'GOVERNANCE_BLOCKED',
        verified: false,
        error: 'Automatic git push and production deployment are strictly prohibited by governance.',
        errorCode: 'UNAUTHORIZED_AUTO_ACTION',
        taskId: task.id
      };
    }

    // 3. Worker Execution via Governed Bridge (Do not trust worker "done" claims!)
    const execResult = await this.bridge.executeTask(task, context);

    // 4. GARUDA Independent Verification
    const validation = this.validator.validateExecutionResult(execResult);

    if (validation.status === 'VERIFIED_SUCCESS') {
      return {
        status: 'VERIFIED_SUCCESS',
        verified: true,
        worker: selection.worker,
        taskId: task.id,
        validationResult: validation
      };
    }

    // 5. Worker Failure Routing into Phase 3 Recovery Engine
    const recoveryRes = await this.recoveryEngine.recoverTask(task, validation, context);

    if (recoveryRes.recovered && recoveryRes.status === 'RECOVERED_SUCCESS') {
      return {
        status: 'VERIFIED_SUCCESS',
        verified: true,
        worker: selection.worker,
        recovered: true,
        taskId: task.id,
        recoveryResult: recoveryRes
      };
    }

    return {
      status: 'VERIFIED_FAILURE',
      verified: false,
      worker: selection.worker,
      taskId: task.id,
      error: recoveryRes.reason,
      errorCode: recoveryRes.status
    };
  }
}

module.exports = ExternalWorkerOrchestrator;
