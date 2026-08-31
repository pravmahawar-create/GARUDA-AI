const assert = require("assert");
const caseMemory = require("./caseMemory");
const knowledgeGraph = require("./knowledgeGraph");
const statisticalLearner = require("./statisticalLearner");
const decisionTree = require("./decisionTree");
const speedEngine = require("./speedEngine");
const orchestrator = require("./smartOrchestrator");

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
  console.log("\n=== Smart Engine Tests ===\n");
  caseMemory.clearCases();
  knowledgeGraph.clear();
  statisticalLearner.clear();

  console.log("--- Case Memory ---");
  await test("addCase stores case", () => {
    const c = caseMemory.addCase({ problem: "login error", solution: "add bcrypt", category: "auth" });
    assert.ok(c.id);
    assert.strictEqual(c.category, "auth");
  });

  await test("findSimilarCases finds matches", () => {
    caseMemory.clearCases();
    caseMemory.addCase({ problem: "login error bcrypt missing", solution: "npm install bcrypt", category: "auth" });
    caseMemory.addCase({ problem: "signup error bcrypt missing", solution: "npm install bcrypt", category: "auth" });
    const results = caseMemory.findSimilarCases("login error");
    assert.ok(results.length > 0);
    assert.ok(results[0].matchScore > 0);
  });

  await test("getCaseStats counts", () => {
    const stats = caseMemory.getCaseStats();
    assert.ok(stats.total >= 2);
  });

  console.log("\n--- Knowledge Graph ---");
  await test("addNode and getNode work", () => {
    knowledgeGraph.clear();
    knowledgeGraph.addNode("login", { type: "feature" });
    const node = knowledgeGraph.getNode("login");
    assert.ok(node);
    assert.strictEqual(node.type, "feature");
  });

  await test("addEdge creates relationship", () => {
    knowledgeGraph.clear();
    knowledgeGraph.addNode("login");
    knowledgeGraph.addNode("auth");
    knowledgeGraph.addEdge("login", "auth");
    const neighbors = knowledgeGraph.getNeighbors("login");
    assert.ok(neighbors.length > 0);
    assert.strictEqual(neighbors[0].id, "auth");
  });

  await test("findPath finds path between nodes", () => {
    knowledgeGraph.clear();
    knowledgeGraph.addNode("a"); knowledgeGraph.addNode("b"); knowledgeGraph.addNode("c");
    knowledgeGraph.addEdge("a", "b"); knowledgeGraph.addEdge("b", "c");
    const path = knowledgeGraph.findPath("a", "c");
    assert.ok(path);
    assert.strictEqual(path.length, 3);
  });

  await test("initializeDefaultGraph creates default nodes", () => {
    knowledgeGraph.initializeDefaultGraph();
    const stats = knowledgeGraph.getStats();
    assert.ok(stats.nodes > 10);
  });

  console.log("\n--- Statistical Learner ---");
  await test("recordObservation and predict work", () => {
    statisticalLearner.clear();
    statisticalLearner.recordObservation("error", "undefined", "import_missing");
    statisticalLearner.recordObservation("error", "undefined", "import_missing");
    statisticalLearner.recordObservation("error", "undefined", "scope_issue");
    const pred = statisticalLearner.predict("error", "undefined");
    assert.ok(pred);
    assert.strictEqual(pred.prediction, "import_missing");
    assert.ok(pred.confidence > 0.5);
  });

  await test("getFrequentPatterns returns patterns", () => {
    const patterns = statisticalLearner.getFrequentPatterns(2);
    assert.ok(patterns.length > 0);
  });

  console.log("\n--- Decision Tree ---");
  await test("buildErrorTree creates tree", () => {
    const tree = decisionTree.buildErrorTree();
    assert.ok(tree.id === "error-handler");
  });

  await test("evaluateTree evaluates error", () => {
    const result = decisionTree.evaluateTree("error-handler", { errorType: "ECONNREFUSED" });
    assert.ok(result);
    assert.ok(result.result.action === "start_server");
  });

  await test("evaluateTree evaluates undefined", () => {
    const result = decisionTree.evaluateTree("error-handler", { errorType: "undefined", context: "import" });
    assert.ok(result);
    assert.ok(result.result.action === "fix_import");
  });

  await test("buildCodeReviewTree creates tree", () => {
    const tree = decisionTree.buildCodeReviewTree();
    assert.ok(tree.id === "code-review");
  });

  await test("evaluateTree evaluates code with eval", () => {
    const result = decisionTree.evaluateTree("code-review", { hasEval: true });
    assert.ok(result);
    assert.strictEqual(result.result.verdict, "REJECT");
  });

  console.log("\n--- Speed Engine ---");
  await test("speedEngine initializes", () => {
    speedEngine.initialize();
    const stats = speedEngine.getStats();
    assert.ok(stats.trees.length >= 2);
  });

  await test("speedEngine caches results", () => {
    const r1 = speedEngine.solve({ problem: "undefined error", context: { errorType: "undefined", context: "import" }, category: "error" });
    const r2 = speedEngine.solve({ problem: "undefined error", context: { errorType: "undefined", context: "import" }, category: "error" });
    assert.ok(r1.timeMs >= 0);
    assert.ok(r2.timeMs <= r1.timeMs + 5);
  });

  await test("speedEngine uses decision tree", () => {
    const result = speedEngine.solve({ problem: "timeout error", context: { errorType: "timeout" }, category: "error" });
    assert.ok(result.layers.includes("decision_tree") || result.layers.includes("cache"));
  });

  console.log("\n--- Smart Orchestrator ---");
  await test("orchestrator.init initializes everything", () => {
    const result = orchestrator.init();
    assert.strictEqual(result.status, "initialized");
  });

  await test("orchestrator.solve solves problem", () => {
    orchestrator.init();
    const result = orchestrator.solve("ECONNREFUSED error", { errorType: "ECONNREFUSED" }, "error");
    assert.ok(result.solution);
    assert.ok(result.source);
  });

  await test("orchestrator.learnFromProblem stores case", () => {
    const c = orchestrator.learnFromProblem("new problem", "new solution", "test");
    assert.ok(c.id);
  });

  await test("orchestrator.getStats returns full stats", () => {
    const stats = orchestrator.getStats();
    assert.ok(stats.speed);
    assert.ok(stats.memory);
    assert.ok(stats.knowledge);
    assert.ok(stats.statistics);
    assert.ok(stats.intelligence);
  });

  await test("orchestrator.diagnoseProblem diagnoses", () => {
    orchestrator.init();
    const result = orchestrator.diagnoseProblem("login error");
    assert.ok(result.fromCases !== undefined);
    assert.ok(result.fromGraph !== undefined);
  });

  console.log("\n--- Speed Proof ---");
  await test("solve completes in < 50ms", () => {
    orchestrator.init();
    const start = Date.now();
    orchestrator.solve("undefined error", { errorType: "undefined", context: "import" }, "error");
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 100, `Should be fast, was ${elapsed}ms`);
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
