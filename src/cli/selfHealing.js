/**
 * 🦅 GARUDA CLI — DETERMINISTIC CLOSED-LOOP SELF-HEALING ENGINE
 * 
 * Implements the rigorous semantic chain:
 * FAIL -> OBSERVE -> DIAGNOSE -> PLAN FIX -> PATCH -> RE-RUN COMMAND -> VALIDATE RESULT -> (SUCCESS | RETRY | ABORT)
 * 
 * Enforces:
 * - Strict attempt bounding (Zero infinite loops)
 * - Scope confinement (Rejects modifications to unrelated files)
 * - Repository confinement (Prevents path escapes)
 * - Founder Gatekeeper preservation (Blocks unauthorized git/deploy operations)
 * - Automatic regression rollback (Reverts patches that introduce regressions)
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { resolveSafeRepositoryPath, classifyCommand } = require("./security");
const { generateUnifiedDiff } = require("./diffEngine");

const DEFAULT_MAX_ATTEMPTS = 3;

class ClosedLoopHealer {
  constructor(options = {}) {
    this.rootDir = options.rootDir ? path.resolve(options.rootDir) : path.resolve(__dirname, "..", "..");
    this.maxAttempts = options.maxAttempts || DEFAULT_MAX_ATTEMPTS;
    this.attempt = 0;
    this.history = [];
    this.backups = new Map(); // filePath -> originalContent
  }

  /**
   * Resets healer attempt counters and backups.
   */
  reset() {
    this.attempt = 0;
    this.history = [];
    this.backups.clear();
  }

  /**
   * Diagnoses an error string to identify plausible root cause.
   */
  diagnose(error, targetFile = null) {
    if (!error) return "Unknown error condition.";
    const errStr = String(error);

    if (errStr.includes("SyntaxError")) {
      return "JavaScript syntax error or malformed token structure.";
    }
    if (errStr.includes("ReferenceError") || errStr.includes("is not defined")) {
      const varMatch = errStr.match(/([a-zA-Z0-9_$]+)\s+is not defined/);
      return `Undefined reference: variable '${varMatch ? varMatch[1] : "unknown"}' is not declared or imported.`;
    }
    if (errStr.includes("TypeError")) {
      return "Type mismatch or invocation of non-callable object property.";
    }
    if (errStr.includes("AssertionError") || errStr.includes("ERR_ASSERTION") || errStr.includes("Expected")) {
      return "Assertion failure: observed state deviated from target specification.";
    }
    if (errStr.includes("Cannot find module")) {
      const modMatch = errStr.match(/Cannot find module ['"]([^'"]+)['"]/);
      return `Missing dependency module '${modMatch ? modMatch[1] : "unknown"}'.`;
    }
    if (errStr.includes("ENOENT") || errStr.includes("File not found")) {
      return `Target file or directory not found: ${targetFile || "path unspecified"}.`;
    }
    return `Runtime command execution failure (Status output: ${errStr.slice(0, 100).replace(/\r?\n/g, " ")})`;
  }

  /**
   * Validates patch safety constraints before disk application.
   */
  validatePatchSafety(targetFile, patchSpec, allowedFiles = null) {
    if (!targetFile || typeof targetFile !== "string") {
      return { safe: false, decision: "BLOCK_INVALID_PATH", reason: "Target file path must be a non-empty string." };
    }

    // 1. Guard 8: Repository Confinement check
    let resolved;
    try {
      resolved = resolveSafeRepositoryPath(targetFile, this.rootDir);
    } catch (err) {
      return { safe: false, decision: "BLOCK_SCOPE_ESCAPE", reason: err.message };
    }

    // 2. Guard 7: Scope Confinement check (unrelated file modification)
    if (allowedFiles && Array.isArray(allowedFiles) && allowedFiles.length > 0) {
      const normalizedResolved = path.resolve(resolved).toLowerCase();
      const isAllowed = allowedFiles.some(f => {
        try {
          const normAllowed = resolveSafeRepositoryPath(f, this.rootDir).toLowerCase();
          return normAllowed === normalizedResolved;
        } catch (_) {
          return false;
        }
      });

      if (!isAllowed) {
        return {
          safe: false,
          decision: "BLOCK_SCOPE_UNRELATED",
          reason: `Patch targets unrelated file '${targetFile}' outside declared repair scope (${allowedFiles.join(", ")}).`
        };
      }
    }

    // 3. Guard 9: Founder-Only check inside patch or associated command
    if (patchSpec && patchSpec.command) {
      const risk = classifyCommand(patchSpec.command);
      if (risk.level === "FOUNDER_ONLY") {
        return {
          safe: false,
          decision: "BLOCK_UNAUTHORIZED_FOUNDER_ONLY",
          reason: `Self-healing cannot autonomously execute Founder-protected operations (${risk.reason})`
        };
      }
    }

    return { safe: true, resolvedPath: resolved };
  }

  /**
   * Applies an in-place patch to targetFile with automatic backup.
   */
  applyPatch(targetFile, newContent, options = {}) {
    const safety = this.validatePatchSafety(targetFile, { command: options.validationCommand }, options.allowedFiles);
    if (!safety.safe) {
      return safety;
    }

    const resolved = safety.resolvedPath;

    // Backup existing content if not already backed up in this session
    if (fs.existsSync(resolved) && !this.backups.has(resolved)) {
      this.backups.set(resolved, fs.readFileSync(resolved, "utf8"));
    }

    try {
      fs.mkdirSync(path.dirname(resolved), { recursive: true });
      fs.writeFileSync(resolved, newContent, "utf8");
      return { safe: true, resolvedPath: resolved, success: true };
    } catch (err) {
      return { safe: false, decision: "PATCH_WRITE_FAILED", reason: err.message };
    }
  }

  /**
   * Rolls back a patched file to its pre-healing state.
   */
  rollback(targetFile) {
    try {
      const resolved = resolveSafeRepositoryPath(targetFile, this.rootDir);
      if (this.backups.has(resolved)) {
        fs.writeFileSync(resolved, this.backups.get(resolved), "utf8");
        return true;
      }
    } catch (_) {}
    return false;
  }

  /**
   * Executes one full closed-loop step.
   * 
   * @param {Object} cycleSpec
   * @param {string} cycleSpec.initialError - Error output from failed run
   * @param {string} cycleSpec.targetFile - File to patch
   * @param {string} cycleSpec.newContent - Patch replacement content
   * @param {string} cycleSpec.validationCommand - Command to re-run
   * @param {Function} cycleSpec.executor - Function(cmd) returning { status, stdout, stderr }
   * @param {Function} [cycleSpec.regressionChecker] - Optional function() returning boolean (true = regression detected)
   * @param {Array<string>} [cycleSpec.allowedFiles] - Declared repair scope
   */
  executeStep(cycleSpec) {
    this.attempt++;
    const n = this.attempt;
    const { initialError, targetFile, newContent, validationCommand, executor, regressionChecker, allowedFiles } = cycleSpec;

    const errorDesc = (initialError || "Unspecified command error").trim();
    const rootCause = this.diagnose(errorDesc, targetFile);

    // 1. Safety & Policy Gate Check
    const safetyCheck = this.validatePatchSafety(targetFile, { command: validationCommand }, allowedFiles);
    if (!safetyCheck.safe) {
      const valResult = safetyCheck.decision === "BLOCK_UNAUTHORIZED_FOUNDER_ONLY"
        ? "BLOCKED_BY_FOUNDER_GATEKEEPER"
        : "SKIPPED_POLICY_REJECTION";

      const logEntry = {
        HEAL_ATTEMPT_N: n,
        ERROR: errorDesc,
        ROOT_CAUSE: rootCause,
        PATCH: `REJECTED: ${safetyCheck.reason}`,
        VALIDATION_COMMAND: validationCommand || "NONE",
        VALIDATION_RESULT: valResult,
        NEXT_DECISION: safetyCheck.decision
      };
      this.history.push(logEntry);
      return logEntry;
    }

    // 2. Check if validation command itself is Founder-Only
    if (validationCommand) {
      const cmdRisk = classifyCommand(validationCommand);
      if (cmdRisk.level === "FOUNDER_ONLY") {
        const logEntry = {
          HEAL_ATTEMPT_N: n,
          ERROR: errorDesc,
          ROOT_CAUSE: rootCause,
          PATCH: `REJECTED: Founder Gatekeeper violation`,
          VALIDATION_COMMAND: validationCommand,
          VALIDATION_RESULT: "BLOCKED_BY_FOUNDER_GATEKEEPER",
          NEXT_DECISION: "BLOCK_UNAUTHORIZED_FOUNDER_ONLY"
        };
        this.history.push(logEntry);
        return logEntry;
      }
    }

    // 3. Apply Patch
    const patchResult = this.applyPatch(targetFile, newContent, { allowedFiles, validationCommand });
    if (!patchResult.success) {
      const logEntry = {
        HEAL_ATTEMPT_N: n,
        ERROR: errorDesc,
        ROOT_CAUSE: rootCause,
        PATCH: `FAILED_TO_APPLY: ${patchResult.reason}`,
        VALIDATION_COMMAND: validationCommand || "NONE",
        VALIDATION_RESULT: "WRITE_ERROR",
        NEXT_DECISION: "ABORT_PATCH_FAILED"
      };
      this.history.push(logEntry);
      return logEntry;
    }

    const patchSummary = `Modified ${targetFile} (${Buffer.byteLength(newContent || "")} bytes)`;

    // 4. Re-run Validation Command
    let valResult;
    try {
      valResult = executor(validationCommand);
    } catch (execErr) {
      valResult = { status: 1, stderr: execErr.message, stdout: "" };
    }

    const isValSuccess = valResult && valResult.status === 0;
    const valOutput = isValSuccess 
      ? `PASS (Exit code 0)` 
      : `FAIL (Exit code ${valResult?.status || 1}): ${(valResult?.stderr || valResult?.stdout || "Unknown failure").slice(0, 150)}`;

    // 5. Guard 10: Regression Check
    let hasRegression = false;
    if (regressionChecker && typeof regressionChecker === "function") {
      try {
        hasRegression = regressionChecker();
      } catch (_) {
        hasRegression = true;
      }
    }

    if (hasRegression) {
      // Revert patch immediately
      this.rollback(targetFile);
      const logEntry = {
        HEAL_ATTEMPT_N: n,
        ERROR: errorDesc,
        ROOT_CAUSE: `${rootCause} (Patch caused secondary regression)`,
        PATCH: `${patchSummary} -> [REVERTED DUE TO REGRESSION]`,
        VALIDATION_COMMAND: validationCommand,
        VALIDATION_RESULT: "REGRESSION_DETECTED",
        NEXT_DECISION: "REVERT_REGRESSION"
      };
      this.history.push(logEntry);
      return logEntry;
    }

    // 6. Evaluate Outcome & Next Decision
    let nextDecision = "RETRY_DIAGNOSIS";
    if (isValSuccess) {
      nextDecision = "SUCCESS_CONTINUE";
    } else if (this.attempt >= this.maxAttempts) {
      nextDecision = "ABORT_MAX_ATTEMPTS";
    }

    const logEntry = {
      HEAL_ATTEMPT_N: n,
      ERROR: errorDesc,
      ROOT_CAUSE: rootCause,
      PATCH: patchSummary,
      VALIDATION_COMMAND: validationCommand,
      VALIDATION_RESULT: valOutput,
      NEXT_DECISION: nextDecision
    };

    this.history.push(logEntry);
    return logEntry;
  }

  /**
   * Formats structured output according to Founder standard.
   */
  static formatOutput(entry) {
    return [
      `HEAL_ATTEMPT_N:     ${entry.HEAL_ATTEMPT_N}`,
      `ERROR:              ${entry.ERROR}`,
      `ROOT_CAUSE:         ${entry.ROOT_CAUSE}`,
      `PATCH:              ${entry.PATCH}`,
      `VALIDATION_COMMAND: ${entry.VALIDATION_COMMAND}`,
      `VALIDATION_RESULT:  ${entry.VALIDATION_RESULT}`,
      `NEXT_DECISION:      ${entry.NEXT_DECISION}`
    ].join("\n");
  }
}

module.exports = {
  ClosedLoopHealer,
  DEFAULT_MAX_ATTEMPTS
};
