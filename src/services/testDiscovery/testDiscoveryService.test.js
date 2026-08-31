const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { scanTestFiles, findTestFileForSource } = require("./testFileScanner");
const { mapTestsToSources, extractImports } = require("./testToSourceMapper");
const { runTestFile, runMultipleTests } = require("./testRunner");
const { analyzeCoverage } = require("./coverageAnalyzer");
const { generateTestScaffold, writeTestScaffold } = require("./testScaffoldGenerator");

const ROOT = process.cwd();
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
  console.log("\n=== Test Discovery & Execution Engine Tests ===\n");

  console.log("--- Test File Scanner ---");
  await test("scanTestFiles finds test files", () => {
    const result = scanTestFiles(ROOT);
    assert.ok(result.totalTestFiles > 0, "Should find test files");
    assert.ok(result.files.length > 0, "Files array should not be empty");
    assert.ok(result.scannedAt, "Should have scannedAt");
  });

  await test("scanTestFiles groups by directory", () => {
    const result = scanTestFiles(ROOT);
    assert.ok(Object.keys(result.byDirectory).length > 0, "Should have directories");
  });

  await test("findTestFileForSource finds matching test", () => {
    const scan = scanTestFiles(ROOT);
    const testFiles = findTestFileForSource("src/services/repositoryIntelligence/repositoryIntelligenceService.js", scan.files);
    assert.ok(testFiles.length > 0, "Should find test file");
    assert.ok(testFiles[0].includes("repositoryIntelligenceService.test"), "Should match by name");
  });

  await test("findTestFileForSource returns empty for untested", () => {
    const scan = scanTestFiles(ROOT);
    const testFiles = findTestFileForSource("src/services/nonexistent-module.js", scan.files);
    assert.strictEqual(testFiles.length, 0, "Should return empty");
  });

  console.log("\n--- Test-to-Source Mapper ---");
  await test("extractImports finds relative imports", () => {
    const imports = extractImports(path.join(ROOT, "src", "services", "repositoryIntelligence", "repositoryIntelligenceService.test.js"));
    assert.ok(imports.length > 0, "Should find imports");
    assert.ok(imports.some((i) => i.includes("repositoryIntelligence")), "Should find repo intel imports");
  });

  await test("mapTestsToSources maps correctly", () => {
    const scan = scanTestFiles(ROOT);
    const sourceFiles = scan.files.map((f) => f.path.replace(/\.test\./, "."));
    const mapping = mapTestsToSources(scan.files, sourceFiles.slice(0, 50));
    assert.ok(typeof mapping.testToSource === "object", "Should have testToSource");
    assert.ok(typeof mapping.sourceToTest === "object", "Should have sourceToTest");
    assert.ok(Array.isArray(mapping.untestedFiles), "Should have untestedFiles");
  });

  console.log("\n--- Test Runner ---");
  await test("runTestFile runs a passing test", () => {
    const testFile = path.join(ROOT, "src", "services", "safeModification", "safeModificationService.test.js");
    const result = runTestFile(testFile, { timeoutMs: 60000 });
    assert.strictEqual(result.status, "PASSED", "Should pass");
    assert.strictEqual(result.exitCode, 0, "Exit code should be 0");
    assert.ok(result.durationMs > 0, "Should have duration");
  });

  await test("runTestFile detects failing test", () => {
    const fixturePath = path.join(ROOT, "data", "test-fail-fixture.js");
    fs.writeFileSync(fixturePath, 'throw new Error("intentional failure");', "utf8");
    const result = runTestFile(fixturePath, { timeoutMs: 5000 });
    assert.strictEqual(result.status, "FAILED", "Should fail");
    assert.ok(result.exitCode !== 0, "Exit code should be non-zero");
    fs.unlinkSync(fixturePath);
  });

  await test("runMultipleTests runs batch", () => {
    const files = [
      path.join(ROOT, "src", "services", "safeModification", "safeModificationService.test.js")
    ];
    const existing = files.filter((f) => fs.existsSync(f));
    const result = runMultipleTests(existing, { timeoutMs: 60000 });
    assert.ok(result.summary.total > 0, "Should have results");
    assert.ok(result.summary.passed > 0, "Should have passing tests");
  });

  console.log("\n--- Coverage Analyzer ---");
  await test("analyzeCoverage produces coverage report", () => {
    const scan = scanTestFiles(ROOT);
    const sourceFiles = scan.files.slice(0, 20).map((f) => f.path.replace(/\.test\./, "."));
    const coverage = analyzeCoverage(sourceFiles, ROOT);
    assert.ok(coverage.totalSourceFiles > 0, "Should have source files");
    assert.ok(typeof coverage.coverageRatio === "number", "Should have coverage ratio");
    assert.ok(coverage.coverageRatio >= 0 && coverage.coverageRatio <= 1, "Ratio should be 0-1");
    assert.ok(typeof coverage.byDirectory === "object", "Should have byDirectory");
  });

  console.log("\n--- Test Scaffold Generator ---");
  await test("generateTestScaffold generates scaffold", () => {
    const sourceFile = path.join(ROOT, "src", "services", "repositoryIntelligence", "fileGraphBuilder.js");
    const result = generateTestScaffold(sourceFile);
    assert.ok(result.success, "Should succeed");
    assert.ok(result.scaffold.length > 0, "Should have scaffold content");
    assert.ok(result.scaffold.includes("require"), "Should include require");
    assert.ok(result.exportsFound.length > 0, "Should find exports");
  });

  await test("generateTestScaffold fails for missing file", () => {
    const result = generateTestScaffold("/nonexistent/file.js");
    assert.ok(!result.success, "Should fail");
  });

  await test("writeTestScaffold writes file", () => {
    const testDir = path.join(ROOT, "data");
    const testSource = path.join(testDir, "scaffold-test-source.js");
    fs.writeFileSync(testSource, 'function hello() { return "hi"; } module.exports = { hello };', "utf8");
    const result = writeTestScaffold(testSource);
    assert.ok(result.success, "Should succeed");
    assert.ok(result.written, "Should be written");
    assert.ok(fs.existsSync(result.testFilePath), "Test file should exist");
    const content = fs.readFileSync(result.testFilePath, "utf8");
    assert.ok(content.includes("hello"), "Should include function name");
    fs.unlinkSync(result.testFilePath);
    fs.unlinkSync(testSource);
  });

  console.log("\n--- Integration ---");
  await test("service can be imported without error", () => {
    const svc = require("./testDiscoveryService");
    assert.ok(svc, "Should export service");
    assert.ok(typeof svc.scanTestFiles === "function", "Should have scanTestFiles");
    assert.ok(typeof svc.runTestFile === "function", "Should have runTestFile");
    assert.ok(typeof svc.analyzeCoverage === "function", "Should have analyzeCoverage");
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
