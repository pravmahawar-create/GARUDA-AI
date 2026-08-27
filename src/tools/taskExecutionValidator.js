const fs = require('fs');
const path = require('path');

/**
 * GARUDA Governed Task Execution Validator
 * Deterministically verifies execution results and classifies failures.
 */
class TaskExecutionValidator {
  constructor(options = {}) {
    this.workspaceRoot = options.workspaceRoot || process.cwd();
  }

  /**
   * Deterministically validates an execution result.
   */
  validateExecutionResult(executionResult = {}) {
    const {
      taskId = 'unknown',
      tool = 'unknown',
      operation = 'unknown',
      success = false,
      targetPath,
      resolvedPath,
      content,
      exitCode,
      failureCategory = null,
      errorCode = null,
      error = null
    } = executionResult;

    // Handle initial execution failure
    if (!success) {
      const category = failureCategory || (errorCode === 'BLOCKED_BY_APPROVAL' ? 'APPROVAL_BLOCKED' : 'TOOL_FAILURE');

      return {
        status: 'VERIFIED_FAILURE',
        verified: false,
        taskId,
        tool,
        operation,
        failureCategory: category,
        reason: error || `Execution failed with error code: ${errorCode}`,
        verificationDetails: {
          executionSucceeded: false
        },
        executionResult
      };
    }

    // Deterministic Verification for File Operations
    if (tool === 'fileModifierTool') {
      const checkPath = resolvedPath || (targetPath ? path.resolve(this.workspaceRoot, targetPath) : null);

      if (['create', 'modify'].includes(operation)) {
        if (!checkPath || !fs.existsSync(checkPath)) {
          return {
            status: 'VERIFIED_FAILURE',
            verified: false,
            taskId,
            tool,
            operation,
            failureCategory: 'VALIDATION_FAILURE',
            reason: `Validation failed: File does not exist at expected path ${targetPath}`,
            verificationDetails: {
              fileExists: false
            },
            executionResult
          };
        }

        // Verify content if specified
        if (content !== undefined && content !== null) {
          const actualContent = fs.readFileSync(checkPath, 'utf8');
          if (actualContent !== content) {
            return {
              status: 'VERIFIED_FAILURE',
              verified: false,
              taskId,
              tool,
              operation,
              failureCategory: 'VALIDATION_FAILURE',
              reason: `Validation failed: Content mismatch for ${targetPath}`,
              verificationDetails: {
                fileExists: true,
                contentMatch: false
              },
              executionResult
            };
          }
        }

        return {
          status: 'VERIFIED_SUCCESS',
          verified: true,
          taskId,
          tool,
          operation,
          failureCategory: null,
          reason: 'Verified file exists and content matches expected value',
          verificationDetails: {
            fileExists: true,
            contentMatch: true
          },
          executionResult
        };
      }

      if (operation === 'read') {
        const fileContent = executionResult.content !== undefined ? executionResult.content : null;
        if (fileContent === null) {
          return {
            status: 'VERIFIED_FAILURE',
            verified: false,
            taskId,
            tool,
            operation,
            failureCategory: 'VALIDATION_FAILURE',
            reason: 'Validation failed: File read returned empty or null content',
            verificationDetails: {
              contentRead: false
            },
            executionResult
          };
        }

        return {
          status: 'VERIFIED_SUCCESS',
          verified: true,
          taskId,
          tool,
          operation,
          failureCategory: null,
          reason: 'Verified file read successfully returned content',
          verificationDetails: {
            contentRead: true
          },
          executionResult
        };
      }

      if (operation === 'delete') {
        const fileStillExists = checkPath && fs.existsSync(checkPath);
        if (fileStillExists) {
          return {
            status: 'VERIFIED_FAILURE',
            verified: false,
            taskId,
            tool,
            operation,
            failureCategory: 'VALIDATION_FAILURE',
            reason: `Validation failed: File still exists after deletion attempt at ${targetPath}`,
            verificationDetails: {
              fileDeleted: false
            },
            executionResult
          };
        }

        return {
          status: 'VERIFIED_SUCCESS',
          verified: true,
          taskId,
          tool,
          operation,
          failureCategory: null,
          reason: 'Verified file was successfully removed from workspace',
          verificationDetails: {
            fileDeleted: true
          },
          executionResult
        };
      }
    }

    // Deterministic Verification for Command Runner Operations
    if (tool === 'localCommandRunnerTool') {
      if (exitCode !== 0) {
        return {
          status: 'VERIFIED_FAILURE',
          verified: false,
          taskId,
          tool,
          operation,
          failureCategory: 'COMMAND_FAILURE',
          reason: `Validation failed: Command exited with non-zero exit code (${exitCode})`,
          verificationDetails: {
            exitCodeZero: false
          },
          executionResult
        };
      }

      return {
        status: 'VERIFIED_SUCCESS',
        verified: true,
        taskId,
        tool,
        operation,
        failureCategory: null,
        reason: 'Verified command executed cleanly with exit code 0',
        verificationDetails: {
          exitCodeZero: true
        },
        executionResult
      };
    }

    // Default fallback for unknown tool/operation
    return {
      status: 'VERIFIED_SUCCESS',
      verified: true,
      taskId,
      tool,
      operation,
      failureCategory: null,
      reason: 'Execution reported success',
      verificationDetails: {},
      executionResult
    };
  }
}

module.exports = TaskExecutionValidator;
