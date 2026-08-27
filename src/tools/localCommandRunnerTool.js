const { exec } = require('child_process');
const path = require('path');
const { approvalGate: defaultApprovalGate } = require('../../scripts/dev-agent/core/DevelopmentApprovalGate');

/**
 * GARUDA Governed Local Command Runner Tool
 * Executes CLI commands inside controlled workspace boundaries with governance authorization.
 */
class LocalCommandRunnerTool {
  constructor(options = {}) {
    this.workspaceRoot = path.resolve(options.workspaceRoot || process.cwd());
    this.approvalGate = options.approvalGate || defaultApprovalGate;
    this.defaultTimeoutMs = options.defaultTimeoutMs || 30000;
  }

  /**
   * Validates that the working directory is inside the allowed workspace boundary.
   */
  validateCwd(customCwd) {
    if (!customCwd) {
      return { valid: true, resolvedCwd: this.workspaceRoot };
    }

    const resolvedCwd = path.resolve(this.workspaceRoot, customCwd);
    const relativePath = path.relative(this.workspaceRoot, resolvedCwd);

    const isOutside =
      relativePath.startsWith('..') ||
      path.isAbsolute(relativePath) ||
      resolvedCwd === path.resolve(this.workspaceRoot, '..');

    if (isOutside) {
      return {
        valid: false,
        resolvedCwd,
        error: `Working directory is outside workspace boundary: ${customCwd}`,
        errorCode: 'INVALID_WORKING_DIRECTORY'
      };
    }

    return { valid: true, resolvedCwd };
  }

  /**
   * Executes a command inside the approved workspace after governance verification.
   */
  async execute(params = {}, context = {}) {
    const command = params.command || params.cmd;
    const requestedCwd = params.cwd;
    const timeout = params.timeoutMs || this.defaultTimeoutMs;

    if (!command || typeof command !== 'string' || !command.trim()) {
      return {
        success: false,
        tool: 'command_runner',
        operation: 'exec',
        command: command || '',
        cwd: this.workspaceRoot,
        exitCode: null,
        stdout: '',
        stderr: '',
        error: 'Command string must be non-empty',
        errorCode: 'INVALID_COMMAND'
      };
    }

    // 1. Validate Working Directory
    const cwdValidation = this.validateCwd(requestedCwd);
    if (!cwdValidation.valid) {
      return {
        success: false,
        tool: 'command_runner',
        operation: 'exec',
        command,
        cwd: cwdValidation.resolvedCwd || this.workspaceRoot,
        exitCode: null,
        stdout: '',
        stderr: '',
        error: cwdValidation.error,
        errorCode: cwdValidation.errorCode
      };
    }

    const targetCwd = cwdValidation.resolvedCwd;

    // 2. Governance Authorization Check
    const approvalEvaluation = this.approvalGate.evaluate(context);
    if (!approvalEvaluation.allowed) {
      return {
        success: false,
        tool: 'command_runner',
        operation: 'exec',
        command,
        cwd: targetCwd,
        exitCode: null,
        stdout: '',
        stderr: '',
        error: approvalEvaluation.blockedReason || 'Blocked by founder approval policy',
        errorCode: 'BLOCKED_BY_APPROVAL'
      };
    }

    // 3. Process Execution
    return new Promise((resolve) => {
      exec(command, { cwd: targetCwd, timeout, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
        const stdoutStr = stdout ? stdout.toString() : '';
        const stderrStr = stderr ? stderr.toString() : '';

        if (error) {
          const exitCode = typeof error.code === 'number' ? error.code : 1;
          const isTimeout = error.killed && error.signal === 'SIGTERM';

          resolve({
            success: false,
            tool: 'command_runner',
            operation: 'exec',
            command,
            cwd: targetCwd,
            exitCode,
            stdout: stdoutStr,
            stderr: stderrStr,
            error: error.message,
            errorCode: isTimeout ? 'TIMEOUT' : 'COMMAND_FAILED'
          });
          return;
        }

        resolve({
          success: true,
          tool: 'command_runner',
          operation: 'exec',
          command,
          cwd: targetCwd,
          exitCode: 0,
          stdout: stdoutStr,
          stderr: stderrStr,
          error: null,
          errorCode: null
        });
      });
    });
  }
}

module.exports = LocalCommandRunnerTool;
