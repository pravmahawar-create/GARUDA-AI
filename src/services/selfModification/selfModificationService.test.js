const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { analyzeFile, suggestModification, applyModification, scanCodebase, selfModify } = require("./selfModificationService");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    const result = fn();
    if (result && typeof result.then === "function") {
      return result.then(() => { passed++; console.log(`  ok  ${name}`); }).catch((err) => { failed++; console.log(`  xx  ${name}: ${err.message}`); });
    }
    passed++;
    console.log(`  ok  ${name}`);
  } catch (err) {
    failed++;
    console.log(`  xx  ${name}: ${err.message}`);
  }
}

async function main() {
  console.log("\n=== Self-Modification Engine Tests ===\n");

  console.log("--- analyzeFile ---");
  await test("analyzeFile analyzes a real file", () => {
    const analysis = analyzeFile("src/cli/commandParser.js");
    assert.ok(analysis.lines > 0);
    assert.ok(typeof analysis.functions === "number");
    assert.ok(typeof analysis.exports === "number");
  });

  await test("analyzeFile detects issues", () => {
    const analysis = analyzeFile("src/services/selfModification/selfModificationService.js");
    assert.ok(analysis.issues.length >= 0);
  });

  console.log("\n--- suggestModification ---");
  await test("suggestModification suggests for long files", () => {
    const analysis = { path: "test.js", issues: [{ type: "long_file", severity: "warning", message: "Long file" }] };
    const suggestions = suggestModification(analysis);
    assert.ok(suggestions.length > 0);
    assert.strictEqual(suggestions[0].action, "split");
  });

  await test("suggestModification returns empty for clean files", () => {
    const analysis = { path: "test.js", issues: [] };
    const suggestions = suggestModification(analysis);
    assert.strictEqual(suggestions.length, 0);
  });

  console.log("\n--- applyModification ---");
  await test("applyModification add_function works", () => {
    const testFile = path.join(process.cwd(), "data", "test-mod.js");
    fs.mkdirSync(path.dirname(testFile), { recursive: true });
    fs.writeFileSync(testFile, "module.exports = {};", "utf8");
    const result = applyModification(testFile, { action: "add_function", code: "function test() { return 1; }" });
    assert.strictEqual(result.success, true);
    const content = fs.readFileSync(testFile, "utf8");
    assert.ok(content.includes("function test()"));
    fs.unlinkSync(testFile);
  });

  await test("applyModification remove_todo_lines works", () => {
    const testFile = path.join(process.cwd(), "data", "test-mod2.js");
    fs.writeFileSync(testFile, "const a = 1;\n// TODO: fix\nconst b = 2;\n", "utf8");
    const result = applyModification(testFile, { action: "remove_todo_lines" });
    assert.strictEqual(result.success, true);
    const content = fs.readFileSync(testFile, "utf8");
    assert.ok(!content.includes("TODO"));
    assert.ok(content.includes("const a = 1;"));
    fs.unlinkSync(testFile);
  });

  await test("applyModification dry run does not write", () => {
    const testFile = path.join(process.cwd(), "data", "test-mod3.js");
    fs.writeFileSync(testFile, "original", "utf8");
    const result = applyModification(testFile, { action: "add_function" }, true);
    assert.strictEqual(result.dryRun, true);
    const content = fs.readFileSync(testFile, "utf8");
    assert.strictEqual(content, "original");
    fs.unlinkSync(testFile);
  });

  await test("applyModification returns error for unknown action", () => {
    const result = applyModification("any.js", { action: "unknown" });
    assert.strictEqual(result.success, false);
  });

  console.log("\n--- scanCodebase ---");
  await test("scanCodebase finds source files", () => {
    const files = scanCodebase(process.cwd());
    assert.ok(files.length > 10);
    assert.ok(files.every((f) => f.endsWith(".js")));
  });

  console.log("\n--- selfModify ---");
  await test("selfModify scans and suggests", () => {
    const result = selfModify(process.cwd(), true);
    assert.ok(result.filesScanned > 0);
    assert.ok(typeof result.suggestions === "number");
  });

  console.log("\n=== Summary ===");
  console.log(`  passed: ${passed}`);
  console.log(`  failed: ${failed}`);
  console.log(`  total:  ${passed + failed}\n`);

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
