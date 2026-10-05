/**
 * 🦅 GARUDA CLI — ADVERSARIAL SELF-HEALING TEST SUITE (PART C)
 * 
 * Verifies all 10 adversarial failure modes:
 * 1. First command fails.
 * 2. First patch is wrong.
 * 3. Second patch is partially correct.
 * 4. Third attempt succeeds.
 * 5. All attempts fail (bounded max limit).
 * 6. Validation command itself fails.
 * 7. Patch modifies an unrelated file (scope confinement).
 * 8. Patch attempts to escape repository (repository confinement).
 * 9. Patch requires Founder-only operation (Gatekeeper).
 * 10. Patch creates regression (automatic rollback).
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { ClosedLoopHealer } = require("./selfHealing");

console.log("\n=======================================================");
console.log("🦅 GARUDA CLI SELF-HEALING CLOSED-LOOP TEST MATRIX");
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
const tempSandboxDir = path.join(os.tmpdir(), "garuda-heal-sandbox-" + Date.now());
fs.mkdirSync(tempSandboxDir, { recursive: true });

// Setup sandbox test file
const targetFile = path.join(ROOT, "src", "cli", "test_self_heal_target.js");
const originalCode = "function calculateTotal(items) { return items.reduce((a, b) => a + b); }\nmodule.exports = calculateTotal;";

try {
  fs.writeFileSync(targetFile, originalCode, "utf8");

  // ==========================================
  // Case 1: First command fails
  // ==========================================
  test("Case 1: detects first command failure and diagnoses root cause", () => {
    const healer = new ClosedLoopHealer({ rootDir: ROOT, maxAttempts: 3 });
    const initialError = "TypeError: calculateTotal is not defined in test execution";
    const res = healer.executeStep({
      initialError,
      targetFile: "src/cli/test_self_heal_target.js",
      newContent: originalCode,
      validationCommand: "node -e 'process.exit(1)'",
      executor: () => ({ status: 1, stderr: "AssertionError: expected total 100", stdout: "" }),
      allowedFiles: ["src/cli/test_self_heal_target.js"]
    });

    assert.strictEqual(res.HEAL_ATTEMPT_N, 1);
    assert.ok(res.ROOT_CAUSE.includes("Undefined reference"));
    assert.strictEqual(res.NEXT_DECISION, "RETRY_DIAGNOSIS");
    const formatted = ClosedLoopHealer.formatOutput(res);
    assert.ok(formatted.includes("HEAL_ATTEMPT_N:     1"));
  });

  // ==========================================
  // Case 2 & 3 & 4: Progressive Multi-Attempt Fix
  // (Attempt 1 wrong -> Attempt 2 partial -> Attempt 3 succeeds)
  // ==========================================
  test("Case 2, 3, 4: progressive healing (Wrong -> Partial -> Success)", () => {
    const healer = new ClosedLoopHealer({ rootDir: ROOT, maxAttempts: 3 });

    // Attempt 1: First patch is wrong
    const res1 = healer.executeStep({
      initialError: "ReferenceError: x is not defined",
      targetFile: "src/cli/test_self_heal_target.js",
      newContent: "const x = undefined; module.exports = x;",
      validationCommand: "node src/cli/test_self_heal_target.js",
      executor: () => ({ status: 1, stderr: "TypeError: calculateTotal is not a function", stdout: "" }),
      allowedFiles: ["src/cli/test_self_heal_target.js"]
    });
    assert.strictEqual(res1.HEAL_ATTEMPT_N, 1);
    assert.strictEqual(res1.NEXT_DECISION, "RETRY_DIAGNOSIS");

    // Attempt 2: Second patch is partially correct (syntax passes, logic fails)
    const res2 = healer.executeStep({
      initialError: res1.VALIDATION_RESULT,
      targetFile: "src/cli/test_self_heal_target.js",
      newContent: "function calculateTotal(items) { return items ? 0 : 0; } module.exports = calculateTotal;",
      validationCommand: "node src/cli/test_self_heal_target.js",
      executor: () => ({ status: 1, stderr: "AssertionError: Expected sum 15, got 0", stdout: "" }),
      allowedFiles: ["src/cli/test_self_heal_target.js"]
    });
    assert.strictEqual(res2.HEAL_ATTEMPT_N, 2);
    assert.strictEqual(res2.NEXT_DECISION, "RETRY_DIAGNOSIS");

    // Attempt 3: Third patch succeeds
    const res3 = healer.executeStep({
      initialError: res2.VALIDATION_RESULT,
      targetFile: "src/cli/test_self_heal_target.js",
      newContent: "function calculateTotal(items) { return (items || []).reduce((a, b) => a + b, 0); } module.exports = calculateTotal;",
      validationCommand: "node src/cli/test_self_heal_target.js",
      executor: () => ({ status: 0, stderr: "", stdout: "All tests passed" }),
      allowedFiles: ["src/cli/test_self_heal_target.js"]
    });
    assert.strictEqual(res3.HEAL_ATTEMPT_N, 3);
    assert.strictEqual(res3.NEXT_DECISION, "SUCCESS_CONTINUE");
    assert.ok(res3.VALIDATION_RESULT.includes("PASS"));
  });

  // ==========================================
  // Case 5: All attempts fail (hard maximum enforced, no infinite loop)
  // ==========================================
  test("Case 5: all attempts fail enforces hard limit and aborts", () => {
    const healer = new ClosedLoopHealer({ rootDir: ROOT, maxAttempts: 3 });

    for (let i = 1; i <= 3; i++) {
      const res = healer.executeStep({
        initialError: "SyntaxError: Unexpected token",
        targetFile: "src/cli/test_self_heal_target.js",
        newContent: "invalid syntax !!!",
        validationCommand: "node src/cli/test_self_heal_target.js",
        executor: () => ({ status: 1, stderr: "SyntaxError: Unexpected token", stdout: "" }),
        allowedFiles: ["src/cli/test_self_heal_target.js"]
      });

      if (i < 3) {
        assert.strictEqual(res.NEXT_DECISION, "RETRY_DIAGNOSIS");
      } else {
        assert.strictEqual(res.NEXT_DECISION, "ABORT_MAX_ATTEMPTS");
      }
    }
  });

  // ==========================================
  // Case 6: Validation command itself fails
  // ==========================================
  test("Case 6: handles validation command execution crash gracefully", () => {
    const healer = new ClosedLoopHealer({ rootDir: ROOT, maxAttempts: 3 });
    const res = healer.executeStep({
      initialError: "Command timed out",
      targetFile: "src/cli/test_self_heal_target.js",
      newContent: originalCode,
      validationCommand: "invalid_command_that_does_not_exist_xyz",
      executor: () => { throw new Error("Spawn error: invalid command"); },
      allowedFiles: ["src/cli/test_self_heal_target.js"]
    });

    assert.ok(res.VALIDATION_RESULT.includes("Spawn error"));
    assert.strictEqual(res.NEXT_DECISION, "RETRY_DIAGNOSIS");
  });

  // ==========================================
  // Case 7: Patch modifies an unrelated file (Scope Confinement)
  // ==========================================
  test("Case 7: blocks patch modifying unrelated file outside repair scope", () => {
    const healer = new ClosedLoopHealer({ rootDir: ROOT, maxAttempts: 3 });
    const res = healer.executeStep({
      initialError: "TypeError in billing component",
      targetFile: "package.json", // Unrelated file
      newContent: "{}",
      validationCommand: "npm test",
      executor: () => ({ status: 0, stderr: "", stdout: "" }),
      allowedFiles: ["src/cli/test_self_heal_target.js"] // Allowed scope
    });

    assert.strictEqual(res.NEXT_DECISION, "BLOCK_SCOPE_UNRELATED");
    assert.strictEqual(res.VALIDATION_RESULT, "SKIPPED_POLICY_REJECTION");
  });

  // ==========================================
  // Case 8: Patch attempts to escape repository (Repository Confinement)
  // ==========================================
  test("Case 8: blocks patch attempting repository boundary escape", () => {
    const healer = new ClosedLoopHealer({ rootDir: ROOT, maxAttempts: 3 });
    const res = healer.executeStep({
      initialError: "Failed build",
      targetFile: "../../Windows/System32/evil.dll",
      newContent: "malicious_payload()",
      validationCommand: "echo test",
      executor: () => ({ status: 0, stderr: "", stdout: "" })
    });

    assert.strictEqual(res.NEXT_DECISION, "BLOCK_SCOPE_ESCAPE");
    assert.strictEqual(res.VALIDATION_RESULT, "SKIPPED_POLICY_REJECTION");
  });

  // ==========================================
  // Case 9: Patch requires Founder-only operation (Gatekeeper)
  // ==========================================
  test("Case 9: intercepts and blocks Founder-only commands during healing", () => {
    const healer = new ClosedLoopHealer({ rootDir: ROOT, maxAttempts: 3 });
    const res = healer.executeStep({
      initialError: "Production sync required",
      targetFile: "src/cli/test_self_heal_target.js",
      newContent: originalCode,
      validationCommand: "git push origin main", // Forbidden without Founder aadesh
      executor: () => ({ status: 0, stderr: "", stdout: "" }),
      allowedFiles: ["src/cli/test_self_heal_target.js"]
    });

    assert.strictEqual(res.NEXT_DECISION, "BLOCK_UNAUTHORIZED_FOUNDER_ONLY");
    assert.strictEqual(res.VALIDATION_RESULT, "BLOCKED_BY_FOUNDER_GATEKEEPER");
  });

  // ==========================================
  // Case 10: Patch creates regression (Automatic Rollback)
  // ==========================================
  test("Case 10: automatically rolls back patch if regression checker fails", () => {
    const healer = new ClosedLoopHealer({ rootDir: ROOT, maxAttempts: 3 });
    
    // Save known original content
    fs.writeFileSync(targetFile, "ORIGINAL_SAFE_CONTENT", "utf8");

    const res = healer.executeStep({
      initialError: "Small optimization needed",
      targetFile: "src/cli/test_self_heal_target.js",
      newContent: "AGGRESSIVE_UNSTABLE_OPTIMIZATION",
      validationCommand: "node src/cli/test_self_heal_target.js",
      executor: () => ({ status: 0, stderr: "", stdout: "" }), // Validation of target passed
      regressionChecker: () => true, // BUT regression checker flags secondary breakage
      allowedFiles: ["src/cli/test_self_heal_target.js"]
    });

    assert.strictEqual(res.NEXT_DECISION, "REVERT_REGRESSION");
    assert.strictEqual(res.VALIDATION_RESULT, "REGRESSION_DETECTED");

    // Verify file content was automatically rolled back on disk
    const contentOnDisk = fs.readFileSync(targetFile, "utf8");
    assert.strictEqual(contentOnDisk, "ORIGINAL_SAFE_CONTENT");
  });

} finally {
  // Cleanup test file
  try { if (fs.existsSync(targetFile)) fs.unlinkSync(targetFile); } catch (_) {}
  try { fs.rmSync(tempSandboxDir, { recursive: true, force: true }); } catch (_) {}
}

console.log(`\n=======================================================`);
console.log(`SELF-HEALING SUITE SUMMARY: ${passed} passed, ${failed} failed (Total: ${passed + failed})`);
console.log(`=======================================================\n`);

if (failed > 0) process.exit(1);
