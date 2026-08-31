const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { detectCapabilityGaps, generateModule, expand, listExpanded, getExpansionStats, loadCapabilities, saveCapabilities } = require("./selfExpansionService");

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
  const capsFile = path.join(process.cwd(), "data", "self-expansion", "capabilities.json");
  if (fs.existsSync(capsFile)) fs.writeFileSync(capsFile, "[]", "utf8");
  const expandedDir = path.join(process.cwd(), "src", "services", "expanded");
  if (fs.existsSync(expandedDir)) fs.rmSync(expandedDir, { recursive: true });
}

async function main() {
  console.log("\n=== Self-Expansion Engine Tests ===\n");
  cleanup();

  console.log("--- Capability Gap Detection ---");
  await test("detectCapabilityGaps finds gaps", () => {
    const gaps = detectCapabilityGaps();
    assert.ok(gaps.length > 0, "Should find gaps");
    assert.ok(gaps.every((g) => g.name && g.category && g.requiredMethods));
  });

  await test("detectCapabilityGaps excludes existing", () => {
    saveCapabilities([{ name: "cache", category: "test" }]);
    const gaps = detectCapabilityGaps();
    assert.ok(!gaps.some((g) => g.name === "cache"), "Should not include existing");
    cleanup();
  });

  console.log("\n--- Module Generation ---");
  await test("generateModule creates utility code", () => {
    const code = generateModule({ name: "stringUtils", category: "utility", description: "String utils", requiredMethods: ["slugify", "capitalize"] });
    assert.ok(code.includes("function slugify"));
    assert.ok(code.includes("function capitalize"));
    assert.ok(code.includes("module.exports"));
  });

  await test("generateModule creates cache code", () => {
    const code = generateModule({ name: "cache", category: "performance", description: "Cache", requiredMethods: ["get", "set", "delete", "clear"] });
    assert.ok(code.includes("function get"));
    assert.ok(code.includes("function set"));
    assert.ok(code.includes("function del"));
    assert.ok(code.includes("function clear"));
  });

  await test("generateModule creates logger code", () => {
    const code = generateModule({ name: "logger", category: "observability", description: "Logger", requiredMethods: ["info", "warn", "error"] });
    assert.ok(code.includes("function info"));
    assert.ok(code.includes("function warn"));
    assert.ok(code.includes("function error"));
  });

  console.log("\n--- Expansion ---");
  await test("expand generates modules", () => {
    cleanup();
    const result = expand({ max: 2 });
    assert.strictEqual(result.status, "expanded");
    assert.strictEqual(result.generated, 2);
    assert.ok(result.details.length === 2);
  });

  await test("expand creates files", () => {
    cleanup();
    expand({ max: 1 });
    const expandedDir = path.join(process.cwd(), "src", "services", "expanded");
    assert.ok(fs.existsSync(expandedDir));
    const files = fs.readdirSync(expandedDir);
    assert.ok(files.length > 0);
  });

  await test("expand persists capabilities", () => {
    cleanup();
    expand({ max: 1 });
    const caps = loadCapabilities();
    assert.ok(caps.length > 0);
    assert.ok(caps[0].name);
    assert.ok(caps[0].createdAt);
  });

  await test("expand returns no_gaps when all present", () => {
    const allGaps = detectCapabilityGaps();
    for (const gap of allGaps) {
      const caps = loadCapabilities();
      caps.push({ name: gap.name, category: gap.category, description: gap.description, requiredMethods: gap.requiredMethods, methods: gap.requiredMethods, createdAt: new Date().toISOString(), status: "existing" });
      saveCapabilities(caps);
    }
    const result = expand();
    assert.strictEqual(result.status, "no_gaps");
    cleanup();
  });

  console.log("\n--- Stats ---");
  await test("listExpanded returns capabilities", () => {
    cleanup();
    expand({ max: 2 });
    const list = listExpanded();
    assert.ok(list.length > 0);
  });

  await test("getExpansionStats counts", () => {
    cleanup();
    expand({ max: 3 });
    const stats = getExpansionStats();
    assert.ok(stats.total > 0);
    assert.ok(stats.byCategory);
  });

  console.log("\n=== Summary ===");
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
