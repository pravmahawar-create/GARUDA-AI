/**
 * GARUDA Corrective Plan Generator
 * Produces structured, inspectable corrective action plans for retryable failures.
 */
class CorrectivePlanGenerator {
  /**
   * Generates a corrective task plan based on diagnosis and original task.
   */
  generatePlan(originalTask = {}, diagnosis = {}) {
    if (!diagnosis.retryable) {
      return {
        hasCorrectivePlan: false,
        reason: diagnosis.reason || 'Failure is not retryable.',
        correctiveTask: null
      };
    }

    const { failureCategory } = diagnosis;
    const originalType = originalTask.taskType || originalTask.type || 'unknown';

    // 1. Command Execution Failure Corrective Plan
    if (failureCategory === 'COMMAND_FAILURE') {
      return {
        hasCorrectivePlan: true,
        strategy: 'COMMAND_RETRY',
        reason: 'Re-running command with fresh process buffer and standard timeout.',
        correctiveTask: {
          ...originalTask,
          id: `${originalTask.id || 'cmd'}_retry_${Date.now()}`,
          timeoutMs: (originalTask.timeoutMs || 30000) + 10000 // Give extra 10s buffer on retry
        }
      };
    }

    // 2. Validation Failure Corrective Plan (e.g. File write/modify validation failure)
    if (failureCategory === 'VALIDATION_FAILURE') {
      return {
        hasCorrectivePlan: true,
        strategy: 'FILE_REWRITE',
        reason: 'Re-writing target file with explicit content verification and directory check.',
        correctiveTask: {
          ...originalTask,
          id: `${originalTask.id || 'file'}_retry_${Date.now()}`
        }
      };
    }

    // 3. Generic Tool Failure Corrective Plan
    return {
      hasCorrectivePlan: true,
      strategy: 'TOOL_RETRY',
      reason: 'Retrying tool execution with default parameters.',
      correctiveTask: {
        ...originalTask,
        id: `${originalTask.id || 'task'}_retry_${Date.now()}`
      }
    };
  }
}

module.exports = CorrectivePlanGenerator;
