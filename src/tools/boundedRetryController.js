const TaskExecutionBridge = require('./taskExecutionBridge');
const TaskExecutionValidator = require('./taskExecutionValidator');
const FailureDiagnosisEngine = require('./failureDiagnosisEngine');
const CorrectivePlanGenerator = require('./correctivePlanGenerator');

/**
 * GARUDA Governed Bounded Retry Controller
 * Manages finite, governed retry loops with strict limits and re-validation.
 */
class BoundedRetryController {
  constructor(options = {}) {
    this.workspaceRoot = options.workspaceRoot || process.cwd();
    this.maxRetries = Math.min(options.maxRetries || 2, 3); // Capped at max 3 retries
    this.bridge = options.bridge || new TaskExecutionBridge({ workspaceRoot: this.workspaceRoot });
    this.validator = options.validator || new TaskExecutionValidator({ workspaceRoot: this.workspaceRoot });
    this.diagnoser = new FailureDiagnosisEngine();
    this.planGenerator = new CorrectivePlanGenerator();
  }

  /**
   * Attempts controlled recovery for a failed task execution.
   */
  async recover(failedTask = {}, initialResult = {}, context = {}) {
    // 1. Diagnose Failure
    const diagnosis = this.diagnoser.diagnose(initialResult);

    // If failure is not retryable or requires founder intervention, stop immediately
    if (!diagnosis.retryable || diagnosis.requiresFounderIntervention) {
      return {
        status: 'RECOVERY_BLOCKED',
        recovered: false,
        retryCount: 0,
        maxRetries: this.maxRetries,
        reason: diagnosis.reason,
        actionNeeded: diagnosis.actionNeeded,
        diagnosis,
        finalResult: initialResult
      };
    }

    let currentTask = failedTask;
    let currentResult = initialResult;
    let retryCount = 0;

    while (retryCount < this.maxRetries) {
      retryCount++;

      // 2. Generate Corrective Plan
      const plan = this.planGenerator.generatePlan(currentTask, diagnosis);
      if (!plan.hasCorrectivePlan || !plan.correctiveTask) {
        return {
          status: 'NO_CORRECTIVE_PLAN',
          recovered: false,
          retryCount,
          maxRetries: this.maxRetries,
          reason: 'Corrective plan generator produced no viable corrective task.',
          diagnosis,
          finalResult: currentResult
        };
      }

      // 3. Execute Corrective Task through Governed Tool Bridge
      const retryExecResult = await this.bridge.executeTask(plan.correctiveTask, context);

      // 4. Deterministic Re-validation
      const retryValidation = this.validator.validateExecutionResult(retryExecResult);

      if (retryValidation.status === 'VERIFIED_SUCCESS' || retryValidation.verifiedStatus === 'VERIFIED_SUCCESS') {
        return {
          status: 'RECOVERED_SUCCESS',
          recovered: true,
          retryCount,
          maxRetries: this.maxRetries,
          reason: `Successfully recovered task on retry attempt ${retryCount}/${this.maxRetries}`,
          diagnosis,
          correctiveStrategy: plan.strategy,
          finalResult: retryValidation
        };
      }

      // Update current state for potential next retry
      currentTask = plan.correctiveTask;
      currentResult = retryValidation;
    }

    // Retries exhausted
    return {
      status: 'RECOVERY_EXHAUSTED',
      recovered: false,
      retryCount,
      maxRetries: this.maxRetries,
      reason: `Recovery attempts exhausted (${retryCount}/${this.maxRetries}). Bounded limit enforced.`,
      diagnosis,
      finalResult: currentResult
    };
  }
}

module.exports = BoundedRetryController;
