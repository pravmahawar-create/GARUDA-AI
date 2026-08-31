const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { createBackup, restoreBackup, listBackups, sha256 } = require("./fileBackupService");
const { computeLineDiff, applyPatchToFile, generatePatchReport } = require("./diffPatcher");
const { validateImports, extractModuleReferences } = require("./importValidator");
const { orchestrateModification, orchestrateRollback } = require("./modificationOrchestrator");
const { logModification, getLogEntries, clearLog } = require("./modificationLogger");

const ROOT = process.cwd();
const TEST_FILE = path.join(ROOT, "data", "test-safe-mod-temp.js");
const TEST_CONTENT = `const fs = require("fs");
const path = require("path");

function hello() {
  return "world";
}

module.exports = { hello };
`;
const TEST_CONTENT_MODIFIED = `const fs = require("fs");
const path = require("path");

function hello() {
  return "modified world";
}

module.exports = { hello };
`;
const TEST_CONTENT_BROKEN = `const nope = require("./nonexistent-module-xyz");
function hello() { return "broken"; }
module.exports = { hello };
`;

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

function cleanup() {
  try { fs.unlinkSync(TEST_FILE); } catch {}
  try { fs.unlinkSync(TEST_FILE + ".bak"); } catch {}
}

async function main() {
  console.log("\n=== Safe File Modification Engine Tests ===\n");

  cleanup();
  fs.writeFileSync(TEST_FILE, TEST_CONTENT, "utf8");

  console.log("--- File Backup Service ---");
  await test("createBackup creates backup file", () => {
    const result = createBackup(TEST_FILE);
    assert.ok(result.success, "Backup should succeed");
    assert.ok(result.backupPath, "Should have backup path");
    assert.ok(result.originalHash, "Should have original hash");
    assert.ok(result.originalSize > 0, "Should have size");
    assert.ok(fs.existsSync(result.backupPath), "Backup file should exist");
  });

  await test("createBackup computes SHA-256 hash", () => {
    const hash = sha256("hello world");
    assert.strictEqual(hash.length, 64, "Hash should be 64 chars");
    assert.strictEqual(hash, sha256("hello world"), "Same input should produce same hash");
  });

  await test("listBackups returns backups", () => {
    const backups = listBackups(TEST_FILE);
    assert.ok(backups.length > 0, "Should find backups");
    assert.ok(backups[0].createdAt, "Should have createdAt");
  });

  await test("createBackup fails for nonexistent file", () => {
    const result = createBackup("/nonexistent/file.js");
    assert.ok(!result.success, "Should fail");
    assert.ok(result.error.includes("not found"), "Should say not found");
  });

  console.log("\n--- Diff Patcher ---");
  await test("computeLineDiff detects changes", () => {
    const diff = computeLineDiff(TEST_CONTENT, TEST_CONTENT_MODIFIED);
    assert.ok(diff.hunks.length > 0, "Should have hunks");
    assert.ok(diff.totalChanges > 0, "Should have changes");
  });

  await test("computeLineDiff detects no changes", () => {
    const diff = computeLineDiff(TEST_CONTENT, TEST_CONTENT);
    assert.strictEqual(diff.hunks.length, 0, "Should have no hunks");
    assert.strictEqual(diff.totalChanges, 0, "Should have no changes");
  });

  await test("applyPatchToFile modifies file", () => {
    const result = applyPatchToFile(TEST_FILE, TEST_CONTENT_MODIFIED);
    assert.ok(result.success, "Should succeed");
    assert.ok(result.changed, "Should detect change");
    const content = fs.readFileSync(TEST_FILE, "utf8");
    assert.ok(content.includes("modified world"), "File should be modified");
    fs.writeFileSync(TEST_FILE, TEST_CONTENT, "utf8");
  });

  await test("generatePatchReport produces report", () => {
    const diff = computeLineDiff(TEST_CONTENT, TEST_CONTENT_MODIFIED);
    const report = generatePatchReport(diff, "test.js");
    assert.ok(report.includes("Patch Report"), "Should contain header");
    assert.ok(report.includes("hunk"), "Should mention hunks");
  });

  console.log("\n--- Import Validator ---");
  await test("validateImports finds valid requires", () => {
    const result = validateImports(TEST_FILE, TEST_CONTENT);
    assert.ok(result.valid, "Should be valid");
    assert.ok(result.totalRefs >= 2, "Should find at least 2 refs (fs, path)");
  });

  await test("validateImports detects broken requires", () => {
    const result = validateImports(TEST_FILE, TEST_CONTENT_BROKEN);
    assert.ok(!result.valid, "Should be invalid");
    assert.ok(result.brokenCount > 0, "Should find broken");
  });

  await test("extractModuleReferences extracts requires", () => {
    const refs = extractModuleReferences(TEST_CONTENT);
    assert.ok(refs.includes("fs"), "Should find fs");
    assert.ok(refs.includes("path"), "Should find path");
  });

  console.log("\n--- Modification Orchestrator ---");
  await test("orchestrateModification blocks without approval", () => {
    const result = orchestrateModification(TEST_FILE, TEST_CONTENT_MODIFIED, { founderApproved: false });
    assert.ok(!result.success, "Should block");
    assert.strictEqual(result.stage, "approval", "Stage should be approval");
  });

  await test("orchestrateModification succeeds with approval", () => {
    fs.writeFileSync(TEST_FILE, TEST_CONTENT, "utf8");
    const result = orchestrateModification(TEST_FILE, TEST_CONTENT_MODIFIED, { founderApproved: true, reason: "test modification" });
    assert.ok(result.success, "Should succeed");
    assert.ok(result.changed, "Should detect change");
    assert.ok(result.backup, "Should have backup");
    assert.ok(result.oldHash, "Should have old hash");
    assert.ok(result.newHash, "Should have new hash");
    fs.writeFileSync(TEST_FILE, TEST_CONTENT, "utf8");
  });

  await test("orchestrateModification blocks broken imports", () => {
    const result = orchestrateModification(TEST_FILE, TEST_CONTENT_BROKEN, { founderApproved: true });
    assert.ok(!result.success, "Should block");
    assert.strictEqual(result.stage, "import_validation", "Stage should be import_validation");
  });

  await test("orchestrateModification skips import validation when asked", () => {
    fs.writeFileSync(TEST_FILE, TEST_CONTENT, "utf8");
    const result = orchestrateModification(TEST_FILE, TEST_CONTENT_MODIFIED, { founderApproved: true, skipImportValidation: true });
    assert.ok(result.success, "Should succeed");
    fs.writeFileSync(TEST_FILE, TEST_CONTENT, "utf8");
  });

  await test("orchestrateModification detects no-change", () => {
    const result = orchestrateModification(TEST_FILE, TEST_CONTENT, { founderApproved: true });
    assert.ok(result.success, "Should succeed");
    assert.ok(!result.changed, "Should detect no change");
  });

  console.log("\n--- Modification Logger ---");
  await test("logModification writes entry", () => {
    clearLog();
    const entry = logModification({ targetPath: "test.js", action: "TEST", reason: "testing" });
    assert.ok(entry.timestamp, "Should have timestamp");
    assert.strictEqual(entry.action, "TEST", "Should have action");
  });

  await test("getLogEntries reads entries", () => {
    const entries = getLogEntries(10);
    assert.ok(entries.length > 0, "Should have entries");
    assert.strictEqual(entries[0].action, "TEST", "Should read back action");
  });

  console.log("\n--- Integration: App.js Route Mounting ---");
  await test("service can be imported without error", () => {
    const svc = require("./safeModificationService");
    assert.ok(svc, "Should export service");
    assert.ok(typeof svc.orchestrateModification === "function", "Should have orchestrateModification");
    assert.ok(typeof svc.createBackup === "function", "Should have createBackup");
  });

  console.log("\n--- Summary ===");
  console.log(`  passed: ${passed}`);
  console.log(`  failed: ${failed}`);
  console.log(`  total:  ${passed + failed}\n`);

  cleanup();
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("FATAL:", err);
  cleanup();
  process.exit(1);
});
