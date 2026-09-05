const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { AstraExecutionEngine } = require("./astraExecutionEngine");

test("GARUDA Astra Engine - Unit Tests", async (t) => {
  const engine = new AstraExecutionEngine();

  await t.test("1. Reconnaissance scans files accurately", () => {
    const results = engine.reconnaissance("package.json", 1);
    assert.strictEqual(results.length, 1);
    assert.ok(results[0].relativePath.includes("package.json"));
    assert.ok(results[0].size > 0);
  });

  await t.test("2. Inspects file with numbered lines and SHA-256", () => {
    const inspect = engine.inspectFile("package.json", 10);
    assert.ok(!inspect.error);
    assert.strictEqual(inspect.path, "package.json");
    assert.ok(inspect.numberedContent.includes("1: {"));
    assert.ok(typeof inspect.sha256 === "string" && inspect.sha256.length === 64);
  });

  await t.test("3. Validates JS file syntax accurately", () => {
    const valid = engine.validateFile("server.js");
    assert.strictEqual(valid.valid, true);
    assert.strictEqual(valid.exitCode, 0);

    // Create a temporary corrupted JS file
    const tempCorrupt = "data/astra/corrupt_test.js";
    engine.applyPatch(tempCorrupt, "const x = { invalid syntax here");
    const invalid = engine.validateFile(tempCorrupt);
    assert.strictEqual(invalid.valid, false);
    assert.ok(invalid.stderr.includes("SyntaxError"));

    // Cleanup
    try { fs.unlinkSync(path.join(process.cwd(), tempCorrupt)); } catch {}
  });

  await t.test("4. Applies safe code patch with SHA-256 before/after tracking", () => {
    const tempFile = "data/astra/test_patch.js";
    const initialContent = "console.log('hello initial');";
    const updatedContent = "console.log('hello updated');";

    const p1 = engine.applyPatch(tempFile, initialContent);
    assert.strictEqual(p1.path, tempFile);
    assert.ok(p1.afterSha);

    const p2 = engine.applyPatch(tempFile, updatedContent);
    assert.strictEqual(p2.beforeSha, p1.afterSha);
    assert.notStrictEqual(p2.afterSha, p1.afterSha);

    // Cleanup
    try { fs.unlinkSync(path.join(process.cwd(), tempFile)); } catch {}
  });

  await t.test("5. Executes task in direct mode, validates, and logs audit trail", async () => {
    const targetFile = "data/astra/generated_utility.js";
    const code = "function add(a, b) { return a + b; } module.exports = { add };";

    const result = await engine.executeTask("Create addition utility", {
      targetFile,
      code,
      summary: "Add utility function"
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.file, targetFile);
    assert.ok(result.sha256);
    assert.strictEqual(result.healCyclesRun, 0);

    const history = engine.getAuditHistory(5);
    assert.ok(history.length > 0);
    assert.strictEqual(history[0].taskId, result.taskId);

    // Cleanup
    try { fs.unlinkSync(path.join(process.cwd(), targetFile)); } catch {}
  });
});
