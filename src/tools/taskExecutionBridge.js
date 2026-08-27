const FileModifierTool = require('./fileModifierTool');
const LocalCommandRunnerTool = require('./localCommandRunnerTool');
const { approvalGate: defaultApprovalGate } = require('../../scripts/dev-agent/core/DevelopmentApprovalGate');
const { requiresFounderApproval } = require('../motherCore/approval/approvalPolicy');

/**
 * GARUDA Mother Brain Task Execution Bridge
 * Translates structured Mother Brain tasks into governed tool calls.
 */
class TaskExecutionBridge {
  constructor(options = {}) {
    this.workspaceRoot = options.workspaceRoot || process.cwd();
    this.approvalGate = options.approvalGate || defaultApprovalGate;

    this.fileModifier = new FileModifierTool({
      workspaceRoot: this.workspaceRoot,
      approvalGate: this.approvalGate
    });

    this.commandRunner = new LocalCommandRunnerTool({
      workspaceRoot: this.workspaceRoot,
      approvalGate: this.approvalGate
    });
  }

  /**
   * Maps task types to canonical tool operations.
   */
  resolveToolOperation(taskType) {
    const type = String(taskType || '').toLowerCase().trim();

    switch (type) {
      case 'file_read':
      case 'read_file':
      case 'read':
        return { toolName: 'file_modifier', operation: 'read' };

      case 'file_create':
      case 'create_file':
      case 'create':
        return { toolName: 'file_modifier', operation: 'create' };

      case 'file_modify':
      case 'file_write':
      case 'write_file':
      case 'modify':
      case 'write':
        return { toolName: 'file_modifier', operation: 'modify' };

      case 'file_delete':
      case 'delete_file':
      case 'delete':
        return { toolName: 'file_modifier', operation: 'delete' };

      case 'command_exec':
      case 'exec_command':
      case 'command':
      case 'exec':
        return { toolName: 'command_runner', operation: 'exec' };

      default:
        return null;
    }
  }

  /**
   * Classifies error codes into standard Phase 2 failure categories.
   */
  classifyFailure(errorCode, errorMsg) {
    if (errorCode === 'BLOCKED_BY_APPROVAL') {
      return 'APPROVAL_BLOCKED';
    }
    if (errorCode === 'PATH_OUTSIDE_WORKSPACE' || errorCode === 'INVALID_WORKING_DIRECTORY') {
      return 'PATH_SECURITY_FAILURE';
    }
    if (errorCode === 'COMMAND_FAILED' || errorCode === 'TIMEOUT') {
      return 'COMMAND_FAILURE';
    }
    if (errorCode === 'INVALID_TASK' || errorCode === 'UNSUPPORTED_OPERATION') {
      return 'INVALID_TASK';
    }
    return 'TOOL_FAILURE';
  }

  /**
   * Executes a structured Mother Brain task with full governance enforcement.
   */
  async executeTask(task = {}, context = {}) {
    const taskId = String(task.id || task.taskId || `task_${Date.now()}`);
    const taskType = task.taskType || task.type;

    if (!taskType) {
      return {
        success: false,
        taskId,
        tool: 'none',
        operation: 'none',
        exitCode: null,
        stdout: '',
        stderr: '',
        error: 'Task must specify a taskType or type',
        errorCode: 'INVALID_TASK',
        failureCategory: 'INVALID_TASK',
        governanceStatus: 'REJECTED'
      };
    }

    const mapping = this.resolveToolOperation(taskType);
    if (!mapping) {
      return {
        success: false,
        taskId,
        tool: 'none',
        operation: 'none',
        exitCode: null,
        stdout: '',
        stderr: '',
        error: `Unsupported task type: '${taskType}'`,
        errorCode: 'INVALID_TASK',
        failureCategory: 'INVALID_TASK',
        governanceStatus: 'REJECTED'
      };
    }

    const { toolName, operation } = mapping;

    // Check Governance before dispatching
    const isWrite = ['create', 'modify', 'delete', 'exec'].includes(operation);
    const actionType = operation === 'exec' ? 'autonomous_execution' : (operation === 'delete' ? 'delete_file' : 'file_write');
    const policyRequires = requiresFounderApproval({ type: actionType });

    const approvalEvaluation = this.approvalGate.evaluate(context);
    if (isWrite && policyRequires && !approvalEvaluation.allowed) {
      return {
        success: false,
        taskId,
        tool: toolName,
        operation,
        targetPath: task.targetPath || task.path || null,
        command: task.command || task.cmd || null,
        exitCode: null,
        stdout: '',
        stderr: '',
        error: approvalEvaluation.blockedReason || 'Blocked by founder approval policy',
        errorCode: 'BLOCKED_BY_APPROVAL',
        failureCategory: 'APPROVAL_BLOCKED',
        governanceStatus: 'BLOCKED_BY_APPROVAL'
      };
    }

    // Tool Dispatch
    if (toolName === 'file_modifier') {
      const targetPath = task.targetPath || task.path || task.file;
      const content = task.content !== undefined ? task.content : '';

      const toolResult = await this.fileModifier.execute(
        { operation, targetPath, content },
        context
      );

      const failureCategory = toolResult.success
        ? null
        : this.classifyFailure(toolResult.errorCode, toolResult.error);

      return {
        success: toolResult.success,
        taskId,
        tool: 'fileModifierTool',
        operation,
        targetPath: toolResult.targetPath || targetPath,
        resolvedPath: toolResult.resolvedPath || null,
        content: toolResult.content || null,
        bytesWritten: toolResult.bytesWritten || 0,
        exitCode: toolResult.exitCode,
        stdout: toolResult.stdout || '',
        stderr: toolResult.stderr || '',
        error: toolResult.error,
        errorCode: toolResult.errorCode,
        failureCategory,
        governanceStatus: 'APPROVED'
      };
    }

    if (toolName === 'command_runner') {
      const command = task.command || task.cmd;
      const cwd = task.cwd;
      const timeoutMs = task.timeoutMs;

      const toolResult = await this.commandRunner.execute(
        { command, cwd, timeoutMs },
        context
      );

      const failureCategory = toolResult.success
        ? null
        : this.classifyFailure(toolResult.errorCode, toolResult.error);

      return {
        success: toolResult.success,
        taskId,
        tool: 'localCommandRunnerTool',
        operation: 'exec',
        command: toolResult.command || command,
        cwd: toolResult.cwd,
        exitCode: toolResult.exitCode,
        stdout: toolResult.stdout || '',
        stderr: toolResult.stderr || '',
        error: toolResult.error,
        errorCode: toolResult.errorCode,
        failureCategory,
        governanceStatus: 'APPROVED'
      };
    }

    return {
      success: false,
      taskId,
      tool: toolName,
      operation,
      exitCode: null,
      stdout: '',
      stderr: '',
      error: 'Tool dispatch unexpected failure',
      errorCode: 'TOOL_FAILURE',
      failureCategory: 'TOOL_FAILURE',
      governanceStatus: 'APPROVED'
    };
  }
}

module.exports = TaskExecutionBridge;
