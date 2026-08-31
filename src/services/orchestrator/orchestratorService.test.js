const assert = require("assert");
const registry = require("./serviceRegistry");
const { orchestrate } = require("./orchestrator");
const service = require("./orchestratorService");

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
  console.log("\n=== Connected System (Orchestrator) Tests ===\n");

  console.log("--- Service Registry ---");
  await test("initAll registers services", () => {
    const services = registry.initAll();
    assert.ok(services.length > 0, "Should register services");
  });

  await test("getService returns service", () => {
    registry.initAll();
    const svc = registry.getService("independence");
    assert.ok(svc, "Should find independence service");
  });

  await test("getService returns null for unknown", () => {
    const svc = registry.getService("nonexistent");
    assert.strictEqual(svc, null);
  });

  await test("listServices returns all", () => {
    const list = registry.listServices();
    assert.ok(list.length > 0);
    assert.ok(list.every((s) => typeof s.name === "string"));
    assert.ok(list.every((s) => Array.isArray(s.methods)));
  });

  console.log("\n--- Orchestrator ---");
  await test("orchestrate handles status action", () => {
    registry.initAll();
    const result = orchestrate({ action: "status" });
    assert.ok(result.output);
    assert.ok(result.steps.length > 0);
  });

  await test("orchestrate handles plan action", () => {
    registry.initAll();
    const result = orchestrate({ action: "plan", target: "fix login bug" });
    assert.ok(result.output);
    assert.ok(result.output.steps.length > 0);
  });

  await test("orchestrate handles review action with real file", () => {
    registry.initAll();
    const result = orchestrate({ action: "review", target: "src/cli/commandParser.js" });
    assert.ok(result.output);
    assert.ok(result.output.verdict);
    assert.ok(["APPROVE", "REQUEST_CHANGES", "REJECT"].includes(result.output.verdict));
  });

  await test("orchestrate handles generate action", () => {
    registry.initAll();
    const result = orchestrate({ action: "generate", target: "function", params: { name: "testFn" } });
    assert.ok(result.output);
    assert.ok(result.output.includes("function testFn"));
  });

  await test("orchestrate handles unknown action", () => {
    const result = orchestrate({ action: "unknown" });
    assert.ok(result.error);
  });

  console.log("\n--- Service (Facade) ---");
  await test("service.init initializes all", () => {
    const services = service.init();
    assert.ok(services.length > 0);
  });

  await test("service.review works", () => {
    service.init();
    const result = service.review("src/cli/commandParser.js");
    assert.ok(result.output);
    assert.ok(result.output.verdict);
  });

  await test("service.plan works", () => {
    service.init();
    const result = service.plan("fix bug");
    assert.ok(result.output);
    assert.ok(result.output.steps.length > 0);
  });

  await test("service.generate works", () => {
    service.init();
    const result = service.generate("function", { name: "add" });
    assert.ok(result.output);
    assert.ok(result.output.includes("function add"));
  });

  await test("service.status works", () => {
    service.init();
    const result = service.status();
    assert.ok(result.output);
    assert.ok(result.output.capabilities);
  });

  await test("service.getServices returns list", () => {
    service.init();
    const list = service.getServices();
    assert.ok(list.length > 5);
  });

  console.log("\n--- Integration: Full Pipeline ---");
  await test("review → remember pipeline works", () => {
    service.init();
    const result = service.review("src/cli/commandParser.js");
    const hasReview = result.steps.some((s) => s.step === "review");
    const hasRemember = result.steps.some((s) => s.step === "remember");
    assert.ok(hasReview, "Should have review step");
    assert.ok(hasRemember, "Should have remember step");
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
