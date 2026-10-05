/**
 * 🦅 GARUDA CLI — CONTROLLED SELF-EVOLUTION UNIT TESTS (PART D)
 * 
 * Verifies:
 * - D1: Multi-trigger detection (command failures, parser errors, context truncation, token bloat)
 * - Protected governance file locking (never alters security or founder policies)
 * - Dual-gate validation (targeted test + regression test)
 * - Automatic rollback on failure
 * - D2: Persistent evolution memory schema & memoryService synapse linking
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const os = require("os");
const {
  ControlledSelfEvolution,
  EvolutionDetector,
  EvolutionPlanner,
  EvolutionSandbox,
  EvolutionValidator,
  EvolutionMemory,
  EvolutionReporter
} = require("./selfEvolution");

console.log("\n=======================================================");
console.log("🦅 GARUDA CLI CONTROLLED SELF-EVOLUTION TEST MATRIX");
console.log("=======================================================\n");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✔ ok  ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✖ FAIL ${name}:`, err.message);
    failed++;
  }
}

const ROOT = path.resolve(__dirname, "..", "..");
const testLogDir = path.join(os.tmpdir(), "garuda-evo-test-" + Date.now());
const testLogPath = path.join(testLogDir, "evolution_records.jsonl");

try {
  // ==========================================
  // D1: Trigger Detection
  // ==========================================
  console.log("--- D1: Evolution Trigger Detection ---");
  test("EvolutionDetector catches repeated command failures (>= 3)", () => {
    const events = [
      { type: "COMMAND_FAILURE" },
      { type: "COMMAND_FAILURE" },
      { type: "COMMAND_FAILURE" }
    ];
    const triggers = EvolutionDetector.detectTriggers(events);
    assert.strictEqual(triggers.length, 1);
    assert.strictEqual(triggers[0].type, "REPEATED_COMMAND_FAILURES");
    assert.strictEqual(triggers[0].frequency, 3);
  });

  test("EvolutionDetector catches recurring parser and truncation errors", () => {
    const events = [
      { type: "PARSER_ERROR" },
      { type: "PARSER_ERROR" },
      { type: "CONTEXT_TRUNCATION" },
      { type: "CONTEXT_TRUNCATION" },
      { type: "CONTEXT_TRUNCATION" },
      { type: "TOKEN_BLOAT" },
      { type: "TOKEN_BLOAT" }
    ];
    const triggers = EvolutionDetector.detectTriggers(events);
    assert.strictEqual(triggers.length, 3);
    const types = triggers.map(t => t.type);
    assert.ok(types.includes("RECURRING_PARSER_ERRORS"));
    assert.ok(types.includes("RECURRING_CONTEXT_TRUNCATION"));
    assert.ok(types.includes("UNNECESSARY_TOKEN_USAGE"));
  });

  // ==========================================
  // Governance Protection
  // ==========================================
  console.log("\n--- Governance & Protected Target Guards ---");
  test("EvolutionPlanner blocks autonomous modification of security.js and AGENTS.md", () => {
    const planner = new EvolutionPlanner(ROOT);
    assert.strictEqual(planner.isProtectedFile("src/cli/security.js"), true);
    assert.strictEqual(planner.isProtectedFile("AGENTS.md"), true);
    assert.strictEqual(planner.isProtectedFile("GEMINI.md"), true);
    assert.strictEqual(planner.isProtectedFile(".env"), true);
    assert.strictEqual(planner.isProtectedFile("render.yaml"), true);
    assert.strictEqual(planner.isProtectedFile("src/cli/toolParser.js"), false);
  });

  test("ControlledSelfEvolution immediately rejects changes to protected governance files", () => {
    const evo = new ControlledSelfEvolution({ rootDir: ROOT, logPath: testLogPath });
    const trigger = { type: "REPEATED_COMMAND_FAILURES", frequency: 4 };

    const record = evo.evolve({
      trigger,
      targetFile: "src/cli/security.js", // Protected file!
      patchContent: "module.exports = {};",
      targetedTestCmd: "node -v",
      regressionTestCmd: "node -v"
    });

    assert.strictEqual(record.status, "REJECTED");
    assert.strictEqual(record.reason, "TOUCHES_PROTECTED_GOVERNANCE_OR_SECURITY");
    assert.strictEqual(record.files_changed.length, 0);
  });

  // ==========================================
  // Dual-Gate Validation & Rollback
  // ==========================================
  console.log("\n--- Dual-Gate Validation & Rollback ---");
  test("rolls back patch when targeted test fails", () => {
    const evo = new ControlledSelfEvolution({ rootDir: ROOT, logPath: testLogPath });
    const targetFile = "src/cli/temp_evo_target.js";
    const fullPath = path.join(ROOT, targetFile);

    fs.writeFileSync(fullPath, "const initial = 100;", "utf8");

    try {
      const record = evo.evolve({
        trigger: { type: "RECURRING_TOOL_ERRORS", frequency: 3 },
        targetFile,
        patchContent: "const broken = true;",
        targetedTestCmd: "node fake_failing_test",
        regressionTestCmd: "node -v"
      }, {
        executor: (cmd) => {
          if (cmd === "node fake_failing_test") return { status: 1, output: "SyntaxError in patch" };
          return { status: 0, output: "OK" };
        }
      });

      assert.strictEqual(record.status, "ROLLED_BACK");
      assert.strictEqual(record.reason, "TARGETED_TEST_FAILED");
      assert.ok(record.rollback_reference.includes("Restored pre-patch content"));

      // Verify file was restored to initial state
      const diskContent = fs.readFileSync(fullPath, "utf8");
      assert.strictEqual(diskContent, "const initial = 100;");
    } finally {
      try { if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath); } catch (_) {}
    }
  });

  test("rolls back patch when secondary regression test fails", () => {
    const evo = new ControlledSelfEvolution({ rootDir: ROOT, logPath: testLogPath });
    const targetFile = "src/cli/temp_evo_target2.js";
    const fullPath = path.join(ROOT, targetFile);

    fs.writeFileSync(fullPath, "const initialSafe = true;", "utf8");

    try {
      const record = evo.evolve({
        trigger: { type: "RECURRING_PARSER_ERRORS", frequency: 2 },
        targetFile,
        patchContent: "const candidate = true;",
        targetedTestCmd: "node target_test",
        regressionTestCmd: "npm run test:cli"
      }, {
        executor: (cmd) => {
          if (cmd === "node target_test") return { status: 0, output: "PASS" };
          if (cmd === "npm run test:cli") return { status: 1, output: "Regression in CLI tests" };
          return { status: 0, output: "OK" };
        }
      });

      assert.strictEqual(record.status, "ROLLED_BACK");
      assert.strictEqual(record.reason, "REGRESSION_TEST_FAILED");
      assert.ok(record.rollback_reference.includes("Restored pre-patch content"));

      // Verify file was restored
      const diskContent = fs.readFileSync(fullPath, "utf8");
      assert.strictEqual(diskContent, "const initialSafe = true;");
    } finally {
      try { if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath); } catch (_) {}
    }
  });

  test("retains patch and records VERIFIED when all dual-gate tests pass", () => {
    const evo = new ControlledSelfEvolution({ rootDir: ROOT, logPath: testLogPath });
    const targetFile = "src/cli/temp_evo_target3.js";
    const fullPath = path.join(ROOT, targetFile);

    fs.writeFileSync(fullPath, "const oldParser = 1;", "utf8");

    try {
      const record = evo.evolve({
        trigger: { type: "RECURRING_PARSER_ERRORS", frequency: 3 },
        targetFile,
        patchContent: "const improvedParser = 2;",
        targetedTestCmd: "node target_test",
        regressionTestCmd: "npm run test:cli"
      }, {
        executor: () => ({ status: 0, output: "PASS" })
      });

      assert.strictEqual(record.status, "VERIFIED");
      assert.strictEqual(record.verification_evidence.targeted_test_exit, 0);
      assert.strictEqual(record.verification_evidence.regression_suite_exit, 0);
      assert.notStrictEqual(record.before_hash, record.after_hash);
      assert.strictEqual(record.rollback_reference, null);

      // Verify file content was retained
      const diskContent = fs.readFileSync(fullPath, "utf8");
      assert.strictEqual(diskContent, "const improvedParser = 2;");

      const report = EvolutionReporter.formatReport(record);
      assert.ok(report.includes("🟢 VERIFIED"));
    } finally {
      try { if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath); } catch (_) {}
    }
  });

  // ==========================================
  // D2: Evolution Memory Schema
  // ==========================================
  console.log("\n--- D2: Evolution Memory Schema & Persistence ---");
  test("EvolutionMemory persists structured records adhering to schema", () => {
    const memory = new EvolutionMemory(testLogPath);
    const history = memory.getHistory();
    assert.ok(history.length >= 3);

    const latest = history[history.length - 1];
    assert.ok(latest.evolution_id.startsWith("evo_"));
    assert.ok(latest.timestamp);
    assert.ok(latest.observed_problem);
    assert.strictEqual(typeof latest.frequency, "number");
    assert.ok(latest.affected_component);
    assert.ok(latest.hypothesis);
    assert.ok(latest.proposed_change);
    assert.ok(Array.isArray(latest.files_changed));
    assert.ok(Array.isArray(latest.tests_run));
    assert.ok(Array.isArray(latest.tests_added));
    assert.ok(["VERIFIED", "ROLLED_BACK", "REJECTED"].includes(latest.status));
    assert.ok(latest.validation_result);
    assert.ok(latest.regression_result);
    assert.ok(latest.verification_evidence);
  });

} finally {
  try { fs.rmSync(testLogDir, { recursive: true, force: true }); } catch (_) {}
}

console.log(`\n=======================================================`);
console.log(`SELF-EVOLUTION SUITE SUMMARY: ${passed} passed, ${failed} failed (Total: ${passed + failed})`);
console.log(`=======================================================\n`);

if (failed > 0) process.exit(1);
