const assert = require("assert");
const registry = require("./modelRegistry");
const { classifyTask, estimateComplexity, TASK_TYPES } = require("./taskClassifier");
const { selectModel, selectModelForGoal } = require("./routerLogic");
const service = require("./adaptiveRouterService");

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
  console.log("\n=== Adaptive Model Router Tests ===\n");

  registry.registerDefaults();

  console.log("--- Model Registry ---");
  await test("registerDefaults creates 5 models", () => {
    const models = registry.listModels();
    assert.strictEqual(models.length, 5);
  });

  await test("getModel returns model by id", () => {
    const model = registry.getModel("gpt-4o");
    assert.ok(model);
    assert.strictEqual(model.name, "GPT-4o");
  });

  await test("getAvailableModels returns only available", () => {
    const available = registry.getAvailableModels();
    assert.ok(available.length > 0);
    assert.ok(available.every((m) => m.available));
  });

  await test("getModelsByCapability filters", () => {
    const codeModels = registry.getModelsByCapability("code");
    assert.ok(codeModels.length >= 3, "Should have 3+ code models");
  });

  await test("registerModel adds custom model", () => {
    registry.registerModel({ id: "test-model", name: "Test", provider: "test", capabilities: ["code"] });
    const model = registry.getModel("test-model");
    assert.ok(model);
    registry.removeModel("test-model");
  });

  console.log("\n--- Task Classifier ---");
  await test("classifyTask detects code generation", () => {
    const result = classifyTask({ text: "write a function to sort array" });
    assert.strictEqual(result.type, "code_generation");
    assert.ok(result.confidence > 0.4);
  });

  await test("classifyTask detects bug fix", () => {
    const result = classifyTask({ text: "fix this error in login" });
    assert.strictEqual(result.type, "bug_fix");
  });

  await test("classifyTask detects code review", () => {
    const result = classifyTask({ text: "review this code for issues" });
    assert.strictEqual(result.type, "code_review");
  });

  await test("classifyTask detects analysis", () => {
    const result = classifyTask({ text: "explain how this module works" });
    assert.strictEqual(result.type, "analysis");
  });

  await test("classifyTask detects simple query", () => {
    const result = classifyTask({ text: "hello" });
    assert.strictEqual(result.type, "simple_query");
  });

  await test("classifyTask uses explicit type", () => {
    const result = classifyTask({ type: "testing", text: "anything" });
    assert.strictEqual(result.type, "testing");
    assert.strictEqual(result.confidence, 1.0);
  });

  await test("TASK_TYPES covers all types", () => {
    assert.ok(Object.keys(TASK_TYPES).length >= 9);
  });

  console.log("\n--- Complexity Estimator ---");
  await test("estimateComplexity rates simple input low", () => {
    const result = estimateComplexity({ text: "hello" });
    assert.strictEqual(result.complexity, "low");
  });

  await test("estimateComplexity rates complex input high", () => {
    const result = estimateComplexity({ text: "implement a complex multi-step authentication system with OAuth integration and token refresh".repeat(3) });
    assert.strictEqual(result.complexity, "high");
  });

  console.log("\n--- Router Logic ---");
  await test("selectModel returns a model for code task", () => {
    const result = selectModel({ text: "write a function" });
    assert.ok(result.model, "Should select a model");
    assert.ok(result.score > 0);
    assert.ok(result.classification);
    assert.ok(result.complexity);
  });

  await test("selectModel respects maxCost constraint", () => {
    const result = selectModel({ text: "write code" }, { maxCost: 0.001 });
    assert.ok(result.model);
    assert.ok(result.model.costPer1kTokens <= 0.001);
  });

  await test("selectModel prefers local when asked", () => {
    const result = selectModel({ text: "analyze" }, { preferLocal: true });
    assert.ok(result.model);
    assert.strictEqual(result.model.provider, "local");
  });

  await test("selectModel returns alternatives", () => {
    const result = selectModel({ text: "review code" });
    assert.ok(result.alternatives);
    assert.ok(result.alternatives.length > 0);
  });

  await test("selectModelForGoal plans per-step", () => {
    const goal = {
      steps: [
        { id: "s1", type: "analyze", description: "analyze code" },
        { id: "s2", type: "modify", description: "write code" }
      ]
    };
    const result = selectModelForGoal(goal);
    assert.strictEqual(result.totalSteps, 2);
    assert.ok(result.uniqueModels.length > 0);
  });

  console.log("\n--- Service (Facade) ---");
  await test("service.init registers defaults", () => {
    service.init();
    assert.ok(service.getModels().length >= 5);
  });

  await test("service.route works", () => {
    service.init();
    const result = service.route({ text: "fix bug" });
    assert.ok(result.model);
  });

  await test("service.classify works", () => {
    const result = service.classify({ text: "write code" });
    assert.strictEqual(result.type, "code_generation");
  });

  await test("service.complexity works", () => {
    const result = service.complexity({ text: "hello" });
    assert.strictEqual(result.complexity, "low");
  });

  await test("service.getModelStats returns stats", () => {
    service.init();
    const stats = service.getModelStats();
    assert.ok(stats.total >= 5);
    assert.ok(stats.available >= 5);
    assert.ok(stats.byProvider.openai);
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
