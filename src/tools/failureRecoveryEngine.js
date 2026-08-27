const FailureDiagnosisEngine = require('./failureDiagnosisEngine');
const CorrectivePlanGenerator = require('./correctivePlanGenerator');
const BoundedRetryController = require('./boundedRetryController');

/**
 * GARUDA Governed Failure Recovery Engine
 * Master Phase 3 recovery entry point combining diagnosis, corrective planning, and bounded retry.
 */
class FailureRecoveryEngine {
  constructor(options = {}) {
    this.workspaceRoot = options.workspaceRoot || process.cwd();
    this.diagnoser = new FailureDiagnosisEngine();
    this.planGenerator = new CorrectivePlanGenerator();
    this.retryController = new BoundedRetryController(options);
  }

  /**
   * Diagnoses a task failure.
   */
  diagnoseFailure(failedResult) {
    return this.diagnoser.diagnose(failedResult);
  }

  /**
   * Generates a corrective plan for a retryable failure.
   */
  generateCorrectivePlan(originalTask, diagnosis) {
    return this.planGenerator.generatePlan(originalTask, diagnosis);
  }

  /**
   * Performs bounded recovery for a failed task.
   */
  async recoverTask(failedTask, initialResult, context = {}) {
    return this.retryController.recover(failedTask, initialResult, context);
  }
}

module.exports = FailureRecoveryEngine;
