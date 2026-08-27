/**
 * GARUDA Governed Failure Diagnosis Engine
 * Deterministically classifies execution & validation failures into actionable recovery categories.
 */
class FailureDiagnosisEngine {
  /**
   * Diagnoses a Phase 2 execution/validation failure result.
   */
  diagnose(result = {}) {
    const failureCategory = result.failureCategory || 
      (result.executionResult && result.executionResult.failureCategory) || 
      'TOOL_FAILURE';
    const errorCode = result.errorCode || 
      (result.executionResult && result.executionResult.errorCode) || null;
    const reason = result.reason || 
      (result.executionResult && result.executionResult.error) || 'Unknown execution failure';

    // 1. Governance / Approval Blocked
    if (failureCategory === 'APPROVAL_BLOCKED' || errorCode === 'BLOCKED_BY_APPROVAL') {
      return {
        classification: 'requires_founder_intervention',
        failureCategory: 'APPROVAL_BLOCKED',
        retryable: false,
        requiresFounderIntervention: true,
        reason: 'Execution blocked by founder approval gate. Self-approval is strictly forbidden.',
        actionNeeded: 'Founder must explicitly provide founderApproved: true token.'
      };
    }

    // 2. Path Security / Traversal / Boundary Failures
    if (failureCategory === 'PATH_SECURITY_FAILURE' || errorCode === 'PATH_OUTSIDE_WORKSPACE' || errorCode === 'INVALID_WORKING_DIRECTORY') {
      return {
        classification: 'requires_founder_intervention',
        failureCategory: 'PATH_SECURITY_FAILURE',
        retryable: false,
        requiresFounderIntervention: true,
        reason: 'Path security violation or workspace escape attempt detected. Security policies cannot be automatically bypassed.',
        actionNeeded: 'Target path must be restricted to workspace boundary.'
      };
    }

    // 3. Invalid Task Schema / Unsupported Tool
    if (failureCategory === 'INVALID_TASK' || errorCode === 'INVALID_TASK' || errorCode === 'UNSUPPORTED_OPERATION') {
      return {
        classification: 'non_retryable',
        failureCategory: 'INVALID_TASK',
        retryable: false,
        requiresFounderIntervention: false,
        reason: 'Task format or operation is invalid or unsupported.',
        actionNeeded: 'Correct task schema or specify a supported tool operation.'
      };
    }

    // 4. Command Execution Failure
    if (failureCategory === 'COMMAND_FAILURE' || errorCode === 'COMMAND_FAILED' || errorCode === 'TIMEOUT') {
      return {
        classification: 'retryable',
        failureCategory: 'COMMAND_FAILURE',
        retryable: true,
        requiresFounderIntervention: false,
        reason: `Command execution failed: ${reason}`,
        actionNeeded: 'Execute bounded retry with process environment check.'
      };
    }

    // 5. Validation Failure (e.g. content mismatch or file missing after write)
    if (failureCategory === 'VALIDATION_FAILURE') {
      return {
        classification: 'retryable',
        failureCategory: 'VALIDATION_FAILURE',
        retryable: true,
        requiresFounderIntervention: false,
        reason: `Deterministic post-execution verification failed: ${reason}`,
        actionNeeded: 'Re-attempt target file modification with verified content.'
      };
    }

    // 6. Generic Tool Execution Failure
    return {
      classification: 'retryable',
      failureCategory: 'TOOL_FAILURE',
      retryable: true,
      requiresFounderIntervention: false,
      reason: `Tool execution failed: ${reason}`,
      actionNeeded: 'Retry task with clean parameter boundaries.'
    };
  }
}

module.exports = FailureDiagnosisEngine;
