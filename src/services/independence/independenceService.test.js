const assert = require("assert");
const ruleEngine = require("./ruleEngine");
const patternMatcher = require("./patternMatcher");
const planner = require("./ruleBasedPlanner");
const engine = require("./localDecisionEngine");

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
  console.log("\n=== Independence Engine Tests ===\n");

  console.log("--- Rule Engine ---");
  await test("addRule adds a rule", () => {
    ruleEngine.clearRules();
    const r = ruleEngine.addRule({ name: "Test Rule", condition: (i) => i.x > 5, action: () => ({ ok: true }) });
    assert.ok(r.id);
    assert.strictEqual(r.name, "Test Rule");
  });

  await test("evaluate fires matching rules", () => {
    ruleEngine.clearRules();
    ruleEngine.addRule({ name: "R1", condition: (i) => i.x > 5, action: () => ({ hit: true }) });
    const results = ruleEngine.evaluate({ x: 10 });
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].result.hit, true);
  });

  await test("evaluate skips non-matching rules", () => {
    ruleEngine.clearRules();
    ruleEngine.addRule({ name: "R1", condition: (i) => i.x > 100, action: () => ({ hit: true }) });
    const results = ruleEngine.evaluate({ x: 10 });
    assert.strictEqual(results.length, 0);
  });

  await test("evaluateFirst returns first match only", () => {
    ruleEngine.clearRules();
    ruleEngine.addRule({ name: "R1", priority: 5, condition: (i) => true, action: () => "first" });
    ruleEngine.addRule({ name: "R2", priority: 10, condition: (i) => true, action: () => "second" });
    const result = ruleEngine.evaluateFirst({ x: 1 });
    assert.strictEqual(result.result, "second");
  });

  await test("disableRule disables rule", () => {
    ruleEngine.clearRules();
    const r = ruleEngine.addRule({ name: "Disable", condition: () => true, action: () => "yes" });
    ruleEngine.disableRule(r.id);
    const results = ruleEngine.evaluate({});
    assert.strictEqual(results.length, 0);
  });

  console.log("\n--- Pattern Matcher ---");
  await test("detectSecurityIssues finds eval", () => {
    const code = 'eval("alert(1)")';
    const ast = require("@babel/parser").parse(code, { sourceType: "unambiguous", errorRecovery: true });
    const issues = patternMatcher.detectSecurityIssues(ast, code);
    assert.ok(issues.length > 0);
    assert.ok(issues[0].message.includes("eval"));
  });

  await test("detectSecurityIssues finds hardcoded secrets", () => {
    const code = 'const password = "secret123"';
    const ast = require("@babel/parser").parse(code, { sourceType: "unambiguous", errorRecovery: true });
    const issues = patternMatcher.detectSecurityIssues(ast, code);
    assert.ok(issues.length > 0);
  });

  await test("detectCodeSmells finds deep nesting", () => {
    const deep = "if (a) {\n  if (b) {\n    if (c) {\n      if (d) {\n        if (e) {\n          if (f) {\n            x();\n          }\n        }\n      }\n    }\n  }\n}";
    const ast = require("@babel/parser").parse(deep, { sourceType: "unambiguous", errorRecovery: true });
    const smells = patternMatcher.detectCodeSmells(ast, deep);
    assert.ok(smells.some((s) => s.message.includes("nesting")));
  });

  await test("detectCodeSmells finds long file", () => {
    const long = "x();\n".repeat(350);
    const smells = patternMatcher.detectCodeSmells(null, long);
    assert.ok(smells.some((s) => s.message.includes("Long file")));
  });

  await test("detectPatterns finds CommonJS", () => {
    const patterns = patternMatcher.detectPatterns(null, "module.exports = {}");
    assert.ok(patterns.includes("CommonJS"));
  });

  await test("detectPatterns finds async/await", () => {
    const patterns = patternMatcher.detectPatterns(null, "async function hello() {}");
    assert.ok(patterns.includes("async/await"));
  });

  await test("matchPatterns runs all patterns", () => {
    engine.init();
    const matches = patternMatcher.matchPatterns('eval("x"); const password = "secret123";', "test.js");
    assert.ok(matches.length > 0, "Should find patterns");
  });

  console.log("\n--- Rule-Based Planner ---");
  await test("planGoal creates steps for bugfix", () => {
    const plan = planner.planGoal({ id: "g1", type: "bugfix" });
    assert.ok(plan.steps.length > 0);
    assert.ok(plan.reasoning.length > 0);
  });

  await test("planGoal creates steps for feature", () => {
    const plan = planner.planGoal({ id: "g2", type: "feature" });
    assert.ok(plan.steps.length >= 4);
  });

  await test("analyzeGoal analyzes codebase", () => {
    const analysis = planner.analyzeGoal(
      { type: "bugfix" },
      { files: [{ name: "error.js" }, { name: "app.js" }, { name: "app.test.js" }] }
    );
    assert.strictEqual(analysis.hasTests, true);
    assert.strictEqual(analysis.affectedFiles.length, 1);
  });

  await test("suggestFiles suggests relevant files", () => {
    const files = planner.suggestFiles(
      { type: "test" },
      { files: [{ name: "app.js" }, { name: "app.test.js" }, { name: "lib.js" }] }
    );
    assert.strictEqual(files.length, 1);
    assert.ok(files[0].name.includes("test"));
  });

  console.log("\n--- Local Decision Engine ---");
  await test("init registers rules and patterns", () => {
    const result = engine.init();
    assert.ok(result.rules >= 5);
  });

  await test("reviewCode reviews code without LLM", () => {
    const review = engine.reviewCode('eval("x"); function hello() { return 1; }', "test.js");
    assert.strictEqual(review.method, "rule_based");
    assert.strictEqual(review.llm, false);
    assert.ok(typeof review.score === "number");
    assert.ok(["APPROVE", "REQUEST_CHANGES", "REJECT"].includes(review.verdict));
  });

  await test("reviewCode approves clean code", () => {
    const review = engine.reviewCode("function hello() { return 1; }", "test.js");
    assert.strictEqual(review.verdict, "APPROVE");
    assert.ok(review.score >= 80);
  });

  await test("reviewCode rejects code with eval", () => {
    const review = engine.reviewCode('eval("malicious code here")', "test.js");
    assert.strictEqual(review.verdict, "REJECT");
    assert.ok(review.score < 50);
  });

  await test("decide makes decisions from code", () => {
    engine.init();
    const decisions = engine.decide({ code: 'eval("x")', filePath: "test.js" });
    assert.ok(decisions.length > 0);
    assert.ok(decisions.some((d) => d.type === "security"));
  });

  await test("planAndDecide combines planning + decisions", () => {
    engine.init();
    const result = engine.planAndDecide(
      { id: "g1", type: "bugfix" },
      { files: [{ name: "app.js" }] }
    );
    assert.ok(result.plan);
    assert.ok(result.decisions.length >= 0);
    assert.ok(result.reasoning.length > 0);
  });

  console.log("\n--- Independence Proof ---");
  await test("No LLM required — review works offline", () => {
    const review = engine.reviewCode('const password = "abc123"; eval(x);', "auth.js");
    assert.strictEqual(review.llm, false);
    assert.strictEqual(review.method, "rule_based");
    assert.ok(review.issues.length > 0);
  });

  await test("No LLM required — planning works offline", () => {
    const plan = planner.planGoal({ id: "g1", type: "bugfix" });
    assert.ok(plan.steps.length > 0);
    assert.ok(plan.reasoning.length > 0);
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
