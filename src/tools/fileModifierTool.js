const fs = require('fs');
const path = require('path');
const { ApprovalGate, approvalGate: defaultApprovalGate } = require('../../scripts/dev-agent/core/DevelopmentApprovalGate');
const { requiresFounderApproval } = require('../motherCore/approval/approvalPolicy');

/**
 * GARUDA Governed File Modifier Tool
 * Enforces workspace boundaries, path safety, and explicit governance approval.
 */
class FileModifierTool {
  constructor(options = {}) {
    this.workspaceRoot = path.resolve(options.workspaceRoot || process.cwd());
    this.approvalGate = options.approvalGate || defaultApprovalGate;
  }

  /**
   * Resolves and validates a target path within the workspace root.
   */
  validatePath(targetPath) {
    if (!targetPath || typeof targetPath !== 'string') {
      return {
        valid: false,
        error: 'Target path must be a non-empty string',
        errorCode: 'INVALID_PATH'
      };
    }

    // Resolve absolute path
    const resolvedPath = path.resolve(this.workspaceRoot, targetPath);

    // Compute relative path from workspace root
    const relativePath = path.relative(this.workspaceRoot, resolvedPath);

    // Check path traversal or escape out of workspace
    const isOutsideWorkspace =
      relativePath.startsWith('..') ||
      path.isAbsolute(relativePath) ||
      resolvedPath === path.resolve(this.workspaceRoot, '..');

    if (isOutsideWorkspace) {
      return {
        valid: false,
        resolvedPath,
        relativePath,
        error: `Path traversal or outside workspace boundary rejected: ${targetPath}`,
        errorCode: 'PATH_OUTSIDE_WORKSPACE'
      };
    }

    return {
      valid: true,
      resolvedPath,
      relativePath
    };
  }

  /**
   * Executes a file operation with strict governance checks.
   */
  async execute(params = {}, context = {}) {
    const { operation, targetPath, content = '' } = params;

    const pathValidation = this.validatePath(targetPath);
    if (!pathValidation.valid) {
      return {
        success: false,
        tool: 'file_modifier',
        operation: operation || 'unknown',
        targetPath: targetPath || '',
        resolvedPath: pathValidation.resolvedPath || null,
        exitCode: null,
        stdout: '',
        stderr: '',
        error: pathValidation.error,
        errorCode: pathValidation.errorCode
      };
    }

    const { resolvedPath, relativePath } = pathValidation;

    // Check governance for write/delete operations
    const isWriteOperation = ['create', 'modify', 'delete'].includes(operation);
    if (isWriteOperation) {
      const actionType = operation === 'delete' ? 'delete_file' : 'file_write';
      const policyRequires = requiresFounderApproval({ type: actionType });
      const approvalEvaluation = this.approvalGate.evaluate(context);

      if (policyRequires && !approvalEvaluation.allowed) {
        return {
          success: false,
          tool: 'file_modifier',
          operation,
          targetPath: relativePath,
          resolvedPath,
          exitCode: null,
          stdout: '',
          stderr: '',
          error: approvalEvaluation.blockedReason || 'Blocked by founder approval policy',
          errorCode: 'BLOCKED_BY_APPROVAL'
        };
      }
    }

    try {
      switch (operation) {
        case 'read': {
          if (!fs.existsSync(resolvedPath)) {
            return {
              success: false,
              tool: 'file_modifier',
              operation: 'read',
              targetPath: relativePath,
              resolvedPath,
              exitCode: null,
              stdout: '',
              stderr: '',
              error: `File not found: ${relativePath}`,
              errorCode: 'FILE_NOT_FOUND'
            };
          }

          const fileContent = fs.readFileSync(resolvedPath, 'utf8');
          return {
            success: true,
            tool: 'file_modifier',
            operation: 'read',
            targetPath: relativePath,
            resolvedPath,
            content: fileContent,
            exitCode: 0,
            stdout: '',
            stderr: '',
            error: null,
            errorCode: null
          };
        }

        case 'create': {
          if (fs.existsSync(resolvedPath)) {
            return {
              success: false,
              tool: 'file_modifier',
              operation: 'create',
              targetPath: relativePath,
              resolvedPath,
              exitCode: null,
              stdout: '',
              stderr: '',
              error: `File already exists: ${relativePath}. Use 'modify' to overwrite.`,
              errorCode: 'FILE_ALREADY_EXISTS'
            };
          }

          // Ensure parent directory exists
          const parentDir = path.dirname(resolvedPath);
          if (!fs.existsSync(parentDir)) {
            fs.mkdirSync(parentDir, { recursive: true });
          }

          fs.writeFileSync(resolvedPath, content, 'utf8');
          return {
            success: true,
            tool: 'file_modifier',
            operation: 'create',
            targetPath: relativePath,
            resolvedPath,
            bytesWritten: Buffer.byteLength(content, 'utf8'),
            exitCode: 0,
            stdout: '',
            stderr: '',
            error: null,
            errorCode: null
          };
        }

        case 'modify': {
          // Ensure parent directory exists
          const parentDir = path.dirname(resolvedPath);
          if (!fs.existsSync(parentDir)) {
            fs.mkdirSync(parentDir, { recursive: true });
          }

          fs.writeFileSync(resolvedPath, content, 'utf8');
          return {
            success: true,
            tool: 'file_modifier',
            operation: 'modify',
            targetPath: relativePath,
            resolvedPath,
            bytesWritten: Buffer.byteLength(content, 'utf8'),
            exitCode: 0,
            stdout: '',
            stderr: '',
            error: null,
            errorCode: null
          };
        }

        case 'delete': {
          if (!fs.existsSync(resolvedPath)) {
            return {
              success: false,
              tool: 'file_modifier',
              operation: 'delete',
              targetPath: relativePath,
              resolvedPath,
              exitCode: null,
              stdout: '',
              stderr: '',
              error: `File not found for deletion: ${relativePath}`,
              errorCode: 'FILE_NOT_FOUND'
            };
          }

          fs.unlinkSync(resolvedPath);
          return {
            success: true,
            tool: 'file_modifier',
            operation: 'delete',
            targetPath: relativePath,
            resolvedPath,
            exitCode: 0,
            stdout: '',
            stderr: '',
            error: null,
            errorCode: null
          };
        }

        default:
          return {
            success: false,
            tool: 'file_modifier',
            operation: operation || 'unknown',
            targetPath: relativePath,
            resolvedPath,
            exitCode: null,
            stdout: '',
            stderr: '',
            error: `Unsupported operation: '${operation}'. Supported: read, create, modify, delete.`,
            errorCode: 'UNSUPPORTED_OPERATION'
          };
      }
    } catch (err) {
      return {
        success: false,
        tool: 'file_modifier',
        operation: operation || 'unknown',
        targetPath: relativePath,
        resolvedPath,
        exitCode: 1,
        stdout: '',
        stderr: '',
        error: err.message,
        errorCode: 'FILE_SYSTEM_ERROR'
      };
    }
  }
}

module.exports = FileModifierTool;
