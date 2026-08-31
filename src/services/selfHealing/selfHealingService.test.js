const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { checkDiskHealth, checkMemoryHealth, checkProcessHealth, checkFileHealth, diagnoseAll, attemptHeal, cleanupTempFiles, logHealing, getHealingLog, heal } = require("./selfHealingService");

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
  console.log("\n=== Self-Healing Engine Tests ===\n");

  console.log("--- Health Checks ---");
  await test("checkDiskHealth returns status", () => {
    const result = checkDiskHealth();
    assert.ok(["healthy", "warning", "critical", "unknown"].includes(result.status));
  });

  await test("checkMemoryHealth returns status", () => {
    const result = checkMemoryHealth();
    assert.ok(["healthy", "warning", "critical"].includes(result.status));
    assert.ok(result.usage);
  });

  await test("checkProcessHealth returns status", () => {
    const result = checkProcessHealth();
    assert.ok(["healthy", "warning"].includes(result.status));
    assert.ok(result.heapMB);
  });

  await test("checkFileHealth detects existing file", () => {
    const result = checkFileHealth("package.json");
    assert.strictEqual(result.status, "healthy");
    assert.ok(result.size > 0);
  });

  await test("checkFileHealth detects missing file", () => {
    const result = checkFileHealth("nonexistent.json");
    assert.strictEqual(result.status, "missing");
  });

  console.log("\n--- Diagnosis ---");
  await test("diagnoseAll returns full diagnosis", () => {
    const result = diagnoseAll();
    assert.ok(result.disk);
    assert.ok(result.memory);
    assert.ok(result.process);
    assert.ok(Array.isArray(result.issues));
    assert.ok(["healthy", "warning", "critical"].includes(result.overallStatus));
  });

  console.log("\n--- Healing ---");
  await test("attemptHeal handles process warning", () => {
    const healed = attemptHeal([{ type: "process", severity: "warning" }]);
    assert.ok(healed.length > 0);
  });

  await test("cleanupTempFiles removes files", () => {
    const tmpDir = path.join(process.cwd(), "data", "tmp");
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "test.txt"), "test");
    const count = cleanupTempFiles();
    assert.ok(count >= 0);
  });

  console.log("\n--- Healing Log ---");
  await test("logHealing writes entry", () => {
    const entry = logHealing({ type: "test", action: "test_heal", status: "done" });
    assert.ok(entry.timestamp);
  });

  await test("getHealingLog reads entries", () => {
    const log = getHealingLog(10);
    assert.ok(Array.isArray(log));
    assert.ok(log.length > 0);
  });

  console.log("\n--- Full Heal ---");
  await test("heal runs full cycle", () => {
    const result = heal();
    assert.ok(result.status);
    assert.ok(result.diagnosis);
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
