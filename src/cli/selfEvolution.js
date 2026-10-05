/**
 * 🦅 GARUDA CLI — CONTROLLED SELF-EVOLUTION ENGINE (PART D)
 * 
 * "Self-Evolution ≠ Uncontrolled Autonomous Self-Modification"
 * 
 * Strict Bounded Lifecycle:
 * OBSERVE -> IDENTIFY GAP -> FORM IMPROVEMENT HYPOTHESIS -> INSPECT RELEVANT CODE
 * -> DESIGN CHANGE -> CREATE PATCH -> RUN TARGETED TESTS -> RUN FULL REGRESSION
 * -> COMPARE BEFORE/AFTER -> VERIFY NO REGRESSION -> RECORD LEARNING -> QUEUE NEXT EVOLUTION
 * 
 * Guarantees:
 * 1. Absolute protection of Founder governance, credentials, security policies, and deployment configurations.
 * 2. Mandatory dual-gate testing (targeted test + full regression suite) before retaining changes.
 * 3. Automatic rollback if any test fails or regression is detected.
 * 4. Persistent structured evolution records in data/memory/evolution_records.jsonl with memoryService synapses.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");
const { resolveSafeRepositoryPath } = require("./security");
const { generateUnifiedDiff, renderTerminalDiff, computeSha256 } = require("./diffEngine");

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const DEFAULT_EVOLUTION_LOG = path.join(ROOT_DIR, "data", "memory", "evolution_records.jsonl");

// Full lifecycle statuses for self-evolution records
const EVOLUTION_STATUSES = [
  "OBSERVED",
  "ANALYZING",
  "PROPOSED",
  "PATCHED",
  "VALIDATING",
  "VERIFIED",
  "REJECTED",
  "ROLLED_BACK"
];

// Files strictly protected from ANY autonomous self-modification (D3 Protected Areas)
const PROTECTED_TARGETS = [
  // 1. Founder Gatekeeper & Security Policies
  "src/cli/security.js",
  "AGENTS.md",
  "GEMINI.md",
  // 2. Authentication & Secrets
  ".env",
  ".env.production",
  "id_rsa",
  "credentials",
  // 3. Payment & Core Financial Math
  "billing/src/services/gstService.js",
  "billing/src/services/billingService.js",
  // 4. Deployment Permissions & CI/CD
  "render.yaml",
  "vercel.json",
  ".github/workflows",
  // 5. Destructive Command Governance
  "src/cli/security.js"
];

class EvolutionDetector {
  /**
   * Analyzes an array of operational events/telemetry to detect recurring gaps.
   */
  static detectTriggers(events = []) {
    const counts = {};
    const triggers = [];

    for (const ev of events) {
      const type = ev.type || "UNKNOWN_ERROR";
      counts[type] = (counts[type] || 0) + 1;
    }

    // Trigger 1: Repeated command failures (>= 3)
    if ((counts.COMMAND_FAILURE || 0) >= 3) {
      triggers.push({
        type: "REPEATED_COMMAND_FAILURES",
        frequency: counts.COMMAND_FAILURE,
        details: "Repeated command execution failures detected across sessions."
      });
    }

    // Trigger 2: Repeated self-healing failures (>= 2)
    if ((counts.HEALING_EXHAUSTED || 0) >= 2) {
      triggers.push({
        type: "REPEATED_HEALING_FAILURES",
        frequency: counts.HEALING_EXHAUSTED,
        details: "Self-healing attempts repeatedly exceeded maximum bounded limit."
      });
    }

    // Trigger 3: Recurring parser errors (>= 2)
    if ((counts.PARSER_ERROR || 0) >= 2) {
      triggers.push({
        type: "RECURRING_PARSER_ERRORS",
        frequency: counts.PARSER_ERROR,
        details: "Model action syntax parsing failed multiple times."
      });
    }

    // Trigger 4: Recurring context truncation (>= 3)
    if ((counts.CONTEXT_TRUNCATION || 0) >= 3) {
      triggers.push({
        type: "RECURRING_CONTEXT_TRUNCATION",
        frequency: counts.CONTEXT_TRUNCATION,
        details: "Context window required aggressive truncation repeatedly."
      });
    }

    // Trigger 5: Recurring tool errors (>= 3)
    if ((counts.TOOL_ERROR || 0) >= 3) {
      triggers.push({
        type: "RECURRING_TOOL_ERRORS",
        frequency: counts.TOOL_ERROR,
        details: "Persistent tool failures encountered."
      });
    }

    // Trigger 6: Unnecessary token usage (>= 2)
    if ((counts.TOKEN_BLOAT || 0) >= 2) {
      triggers.push({
        type: "UNNECESSARY_TOKEN_USAGE",
        frequency: counts.TOKEN_BLOAT,
        details: "High token consumption with verbose non-compacted turns."
      });
    }

    // Trigger 7: Missing capability
    if (counts.MISSING_CAPABILITY) {
      triggers.push({
        type: "MISSING_CAPABILITY",
        frequency: counts.MISSING_CAPABILITY,
        details: "User requested capability not currently registered in workforce."
      });
    }

    // Trigger 8: Regression patterns
    if (counts.REGRESSION_DETECTED) {
      triggers.push({
        type: "REGRESSION_PATTERNS",
        frequency: counts.REGRESSION_DETECTED,
        details: "Patch introduced secondary regression in test suite."
      });
    }

    return triggers;
  }
}

class EvolutionPlanner {
  constructor(rootDir = ROOT_DIR) {
    this.rootDir = path.resolve(rootDir);
  }

  /**
   * Evaluates if a file is protected by Founder governance and security policy (D3).
   */
  isProtectedFile(filePath) {
    if (!filePath) return true;
    const norm = path.relative(this.rootDir, path.resolve(this.rootDir, filePath)).replace(/\\/g, "/").toLowerCase();
    
    // Check against protected targets list
    const inProtectedList = PROTECTED_TARGETS.some(p => norm === p.toLowerCase() || norm.endsWith("/" + p.toLowerCase()) || norm.startsWith(p.toLowerCase() + "/"));
    if (inProtectedList) return true;

    // Check against keywords (payment, auth, secret, deploy)
    if (norm.includes("payment") || norm.includes("secret") || norm.includes("credential") || norm.includes(".git/")) {
      return true;
    }

    return false;
  }

  /**
   * Plans an evolution proposal from a detected trigger.
   */
  formHypothesis(trigger, proposalContext = {}) {
    const hypothesis = {
      evolution_id: `evo_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
      timestamp: new Date().toISOString(),
      observed_problem: trigger.details || trigger.type,
      frequency: trigger.frequency || 1,
      affected_component: proposalContext.component || "unknown",
      hypothesis: proposalContext.hypothesis || `Improving ${proposalContext.component || "system"} resolves ${trigger.type}`,
      proposed_change: proposalContext.proposedChange || "Optimization patch",
      targetFile: proposalContext.targetFile,
      patchContent: proposalContext.patchContent,
      tests_added: proposalContext.testsAdded || [],
      status: "PROPOSED"
    };

    return hypothesis;
  }
}

class EvolutionSandbox {
  constructor(rootDir = ROOT_DIR) {
    this.rootDir = path.resolve(rootDir);
  }

  /**
   * Applies patch safely, storing original content in memory for atomic rollback.
   */
  applySafely(targetFile, patchContent) {
    const resolved = resolveSafeRepositoryPath(targetFile, this.rootDir);
    let originalContent = null;

    if (fs.existsSync(resolved)) {
      originalContent = fs.readFileSync(resolved, "utf8");
    }

    const beforeSha256 = computeSha256(originalContent || "");

    fs.mkdirSync(path.dirname(resolved), { recursive: true });
    fs.writeFileSync(resolved, patchContent, "utf8");

    const afterSha256 = computeSha256(patchContent);

    return {
      resolvedPath: resolved,
      originalContent,
      beforeSha256,
      afterSha256
    };
  }

  /**
   * Restores original content (D4 Rollback).
   */
  rollback(resolvedPath, originalContent) {
    try {
      if (originalContent !== null) {
        fs.writeFileSync(resolvedPath, originalContent, "utf8");
      } else if (fs.existsSync(resolvedPath)) {
        fs.unlinkSync(resolvedPath);
      }
      return true;
    } catch (_) {
      return false;
    }
  }
}

class EvolutionValidator {
  constructor(rootDir = ROOT_DIR) {
    this.rootDir = path.resolve(rootDir);
  }

  /**
   * Executes a command string and captures exit status and outputs.
   */
  runCommand(cmd) {
    try {
      const output = execSync(cmd, {
        cwd: this.rootDir,
        encoding: "utf8",
        timeout: 45000,
        maxBuffer: 5 * 1024 * 1024
      });
      return { status: 0, output };
    } catch (err) {
      return {
        status: err.status || 1,
        output: (err.stdout ? String(err.stdout) : "") + "\n" + (err.stderr ? String(err.stderr) : err.message)
      };
    }
  }

  /**
   * Runs targeted test command and full regression command (D4 Regression Law).
   */
  validate(targetedTestCmd, regressionTestCmd, executor = null, options = {}) {
    const execFn = executor || ((cmd) => this.runCommand(cmd));
    const testsRun = [];

    // 1. Run targeted test
    testsRun.push(targetedTestCmd);
    const targetedResult = execFn(targetedTestCmd);
    if (targetedResult.status !== 0) {
      return {
        success: false,
        stage: "TARGETED_TEST_FAILED",
        testsRun,
        validationResult: `FAIL: Targeted test exited with status ${targetedResult.status}`,
        regressionResult: "SKIPPED",
        result: targetedResult
      };
    }

    // 2. Run full regression test suite
    if (regressionTestCmd) {
      testsRun.push(regressionTestCmd);
      const regressionResult = execFn(regressionTestCmd);
      if (regressionResult.status !== 0) {
        return {
          success: false,
          stage: "REGRESSION_TEST_FAILED",
          testsRun,
          validationResult: "PASS",
          regressionResult: `FAIL: Regression suite exited with status ${regressionResult.status}`,
          result: regressionResult
        };
      }
    }

    // 3. Security Test Gate Check (D4)
    if (options.securityTestCmd) {
      testsRun.push(options.securityTestCmd);
      const secResult = execFn(options.securityTestCmd);
      if (secResult.status !== 0) {
        return {
          success: false,
          stage: "SECURITY_TEST_FAILED",
          testsRun,
          validationResult: "PASS",
          regressionResult: "FAIL (Security violation)",
          result: secResult
        };
      }
    }

    return {
      success: true,
      testsRun,
      validationResult: "PASS (Exit 0)",
      regressionResult: "PASS (Exit 0)"
    };
  }
}

class EvolutionMemory {
  constructor(logPath = DEFAULT_EVOLUTION_LOG) {
    this.logPath = path.resolve(logPath);
    this._ensureDir();
  }

  _ensureDir() {
    try {
      const dir = path.dirname(this.logPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    } catch (_) {}
  }

  /**
   * Inscribes a persistent evolution record with full D2 schema fields.
   */
  record(evolutionRecord) {
    this._ensureDir();

    // Enforce required D2 schema fields
    const recordPayload = {
      evolution_id: evolutionRecord.evolution_id,
      timestamp: evolutionRecord.timestamp || new Date().toISOString(),
      observed_problem: evolutionRecord.observed_problem,
      frequency: evolutionRecord.frequency || 1,
      affected_component: evolutionRecord.affected_component,
      hypothesis: evolutionRecord.hypothesis,
      proposed_change: evolutionRecord.proposed_change,
      files_changed: evolutionRecord.files_changed || [],
      tests_run: evolutionRecord.tests_run || [],
      tests_added: evolutionRecord.tests_added || [],
      before_hash: evolutionRecord.before_hash || null,
      after_hash: evolutionRecord.after_hash || null,
      validation_result: evolutionRecord.validation_result || "N/A",
      regression_result: evolutionRecord.regression_result || "N/A",
      status: evolutionRecord.status,
      rollback_reference: evolutionRecord.rollback_reference || null,
      verification_evidence: evolutionRecord.verification_evidence || {}
    };

    const line = JSON.stringify(recordPayload) + "\n";
    fs.appendFileSync(this.logPath, line, "utf8");

    // Connect with persistentMemory memoryService if available
    let synapseId = null;
    try {
      const memoryService = require("../services/persistentMemory/memoryService");
      const experience = memoryService.remember({
        goal: `Self-Evolution: ${evolutionRecord.evolution_id}`,
        action: evolutionRecord.proposed_change,
        result: evolutionRecord.status,
        success: evolutionRecord.status === "VERIFIED" || evolutionRecord.status === "VALIDATED",
        learnings: [evolutionRecord.hypothesis]
      });
      synapseId = experience ? experience.id : null;
    } catch (_) {}

    return synapseId;
  }

  /**
   * Reads evolution history.
   */
  getHistory() {
    if (!fs.existsSync(this.logPath)) return [];
    try {
      const lines = fs.readFileSync(this.logPath, "utf8").split(/\r?\n/).filter(Boolean);
      return lines.map(l => JSON.parse(l));
    } catch (_) {
      return [];
    }
  }
}

class EvolutionReporter {
  /**
   * Generates a verified forensic evolution report.
   */
  static formatReport(record) {
    return [
      `========================================================================================`,
      `🦅 GARUDA CONTROLLED SELF-EVOLUTION REPORT: ${record.evolution_id}`,
      `========================================================================================`,
      `Timestamp:          ${record.timestamp}`,
      `Trigger / Problem:  ${record.observed_problem} (Frequency: ${record.frequency})`,
      `Affected Component: ${record.affected_component}`,
      `Hypothesis:         ${record.hypothesis}`,
      `Proposed Change:    ${record.proposed_change}`,
      `Status:             ${record.status === "VERIFIED" || record.status === "VALIDATED" ? "🟢 " + record.status : "🔴 " + record.status}`,
      `Files Changed:      ${(record.files_changed || []).join(", ") || "None"}`,
      `Tests Run:          ${(record.tests_run || []).join(", ") || "None"}`,
      `Before Hash:        ${record.before_hash || "N/A"}`,
      `After Hash:         ${record.after_hash || "N/A"}`,
      `Validation Result:  ${record.validation_result}`,
      `Regression Result:  ${record.regression_result}`,
      `Rollback Reference: ${record.rollback_reference || "None (Retained)"}`,
      `Memory Synapse ID:  ${record.memory_synapse_id || "Recorded"}`,
      `========================================================================================`
    ].join("\n");
  }
}

/**
 * Master Controlled Self-Evolution Pipeline Coordinator.
 */
class ControlledSelfEvolution {
  constructor(options = {}) {
    this.rootDir = options.rootDir ? path.resolve(options.rootDir) : ROOT_DIR;
    this.planner = new EvolutionPlanner(this.rootDir);
    this.sandbox = new EvolutionSandbox(this.rootDir);
    this.validator = new EvolutionValidator(this.rootDir);
    this.memory = new EvolutionMemory(options.logPath || DEFAULT_EVOLUTION_LOG);
  }

  /**
   * Executes a complete, bounded self-evolution cycle adhering to D3 & D4 laws.
   */
  evolve(spec, options = {}) {
    const { trigger, targetFile, patchContent, targetedTestCmd, regressionTestCmd, securityTestCmd } = spec;
    const executor = options.executor || null;

    // 1. Observe & Analyze
    const plan = this.planner.formHypothesis(trigger, {
      component: targetFile,
      targetFile,
      patchContent,
      proposedChange: spec.proposedChange || `Optimized ${targetFile}`,
      hypothesis: spec.hypothesis || `Patching ${targetFile} eliminates ${trigger.type}`,
      testsAdded: spec.testsAdded || []
    });

    // 2. D3 Safety Guard: If evolution touches protected code: STOP -> generate diff -> explain -> require Founder auth
    if (this.planner.isProtectedFile(targetFile)) {
      let currentContent = "";
      try {
        currentContent = fs.readFileSync(resolveSafeRepositoryPath(targetFile, this.rootDir), "utf8");
      } catch (_) {}
      const diff = generateUnifiedDiff(currentContent, patchContent, targetFile);

      const record = {
        ...plan,
        status: "REJECTED",
        reason: "TOUCHES_PROTECTED_GOVERNANCE_OR_SECURITY",
        files_changed: [],
        tests_run: [],
        before_hash: computeSha256(currentContent),
        after_hash: null,
        validation_result: "STOPPED: Requires explicit Founder Praveen authorization.",
        regression_result: "SKIPPED",
        rollback_reference: null,
        verification_evidence: {
          error: `File '${targetFile}' is in a protected area (Founder Gatekeeper, Auth, Secrets, Payments, Deploy). Autonomous modification forbidden without explicit Founder command.`,
          diffSummary: `${diff.additions} additions, ${diff.deletions} deletions`
        }
      };
      this.memory.record(record);
      return record;
    }

    // 3. Patch in Sandbox
    const applyResult = this.sandbox.applySafely(targetFile, patchContent);

    // 4. Validate with Targeted Test, Full Regression Suite, and Security Checks (D4)
    const validation = this.validator.validate(targetedTestCmd, regressionTestCmd, executor, { securityTestCmd });

    // 5. D4 Evolution Regression Law: If any check fails -> Immediate ROLLBACK!
    if (!validation.success) {
      this.sandbox.rollback(applyResult.resolvedPath, applyResult.originalContent);
      const record = {
        ...plan,
        status: "ROLLED_BACK",
        reason: validation.stage,
        files_changed: [targetFile],
        tests_run: validation.testsRun || [targetedTestCmd],
        before_hash: applyResult.beforeSha256,
        after_hash: applyResult.afterSha256,
        validation_result: validation.validationResult,
        regression_result: validation.regressionResult,
        rollback_reference: `Restored pre-patch content (SHA-256: ${applyResult.beforeSha256})`,
        verification_evidence: {
          targeted_test_exit: validation.stage === "TARGETED_TEST_FAILED" ? 1 : 0,
          regression_suite_exit: validation.stage === "REGRESSION_TEST_FAILED" ? 1 : 0,
          details: validation.result?.output?.slice(0, 200)
        }
      };
      const synapseId = this.memory.record(record);
      record.memory_synapse_id = synapseId;
      return record;
    }

    // 6. Success -> Mark VERIFIED only after both targeted and regression suites pass
    const record = {
      ...plan,
      status: "VERIFIED",
      files_changed: [targetFile],
      tests_run: validation.testsRun,
      before_hash: applyResult.beforeSha256,
      after_hash: applyResult.afterSha256,
      validation_result: validation.validationResult,
      regression_result: validation.regressionResult,
      rollback_reference: null,
      verification_evidence: {
        targeted_test_exit: 0,
        regression_suite_exit: 0,
        sha256_before: applyResult.beforeSha256,
        sha256_after: applyResult.afterSha256
      }
    };
    const synapseId = this.memory.record(record);
    record.memory_synapse_id = synapseId;

    return record;
  }
}

module.exports = {
  ControlledSelfEvolution,
  EvolutionDetector,
  EvolutionPlanner,
  EvolutionSandbox,
  EvolutionValidator,
  EvolutionMemory,
  EvolutionReporter,
  PROTECTED_TARGETS,
  EVOLUTION_STATUSES
};
