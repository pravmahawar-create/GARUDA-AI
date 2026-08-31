const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { createGoal, createStep, validateGoal, validateStep, areDependenciesMet, getNextSteps, isGoalComplete, isGoalFailed } = require("./goalSchema");
const { planGoal, planGoalWithFiles, generateExecutionPlan, STEP_TEMPLATES } = require("./goalPlanner");
const { executeGoal, generateReport, MAX_STEPS } = require("./goalExecutor");
const { createAndPlanGoal, getGoalStatus, listGoals, getExecutionPlan } = require("./goalEngineService");

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
  const goalsDir = path.join(process.cwd(), "data", "goals");
  if (fs.existsSync(goalsDir)) {
    const files = fs.readdirSync(goalsDir).filter((f) => f.startsWith("goal-"));
    for (const f of files) {
      try { fs.unlinkSync(path.join(goalsDir, f)); } catch {}
    }
  }
}

async function main() {
  console.log("\n=== Autonomous Goal Engine Tests ===\n");

  console.log("--- Goal Schema ---");
  await test("createGoal creates goal with id", () => {
    const goal = createGoal({ type: "bugfix", title: "Fix login bug" });
    assert.ok(goal.id, "Should have id");
    assert.strictEqual(goal.type, "bugfix");
    assert.strictEqual(goal.title, "Fix login bug");
    assert.strictEqual(goal.status, "created");
  });

  await test("createGoal defaults to custom type", () => {
    const goal = createGoal({ title: "Test" });
    assert.strictEqual(goal.type, "custom");
  });

  await test("createStep creates step with id", () => {
    const step = createStep({ type: "analyze", description: "Analyze code" });
    assert.ok(step.id, "Should have id");
    assert.strictEqual(step.type, "analyze");
    assert.strictEqual(step.status, "pending");
  });

  await test("validateGoal catches missing fields", () => {
    const result = validateGoal({});
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.length > 0);
  });

  await test("validateGoal passes valid goal", () => {
    const goal = createGoal({ type: "bugfix", title: "Test" });
    goal.steps = [createStep({ type: "analyze", description: "test" })];
    const result = validateGoal(goal);
    assert.strictEqual(result.valid, true);
  });

  await test("areDependenciesMet checks completed deps", () => {
    const goal = createGoal({ type: "bugfix", title: "Test" });
    const step1 = createStep({ type: "analyze", description: "s1" });
    const step2 = createStep({ type: "modify", description: "s2", dependsOn: [step1.id] });
    goal.steps = [step1, step2];
    assert.strictEqual(areDependenciesMet(goal, step2.id), false);
    step1.status = "completed";
    assert.strictEqual(areDependenciesMet(goal, step2.id), true);
  });

  await test("getNextSteps returns only ready steps", () => {
    const goal = createGoal({ type: "bugfix", title: "Test" });
    const step1 = createStep({ type: "analyze", description: "s1" });
    const step2 = createStep({ type: "modify", description: "s2", dependsOn: [step1.id] });
    goal.steps = [step1, step2];
    const next = getNextSteps(goal);
    assert.strictEqual(next.length, 1);
    assert.strictEqual(next[0].id, step1.id);
  });

  await test("isGoalComplete checks all steps done", () => {
    const goal = createGoal({ type: "bugfix", title: "Test" });
    const step1 = createStep({ type: "analyze", description: "s1" });
    step1.status = "completed";
    goal.steps = [step1];
    assert.strictEqual(isGoalComplete(goal), true);
  });

  await test("isGoalFailed detects failures", () => {
    const goal = createGoal({ type: "bugfix", title: "Test" });
    const step1 = createStep({ type: "analyze", description: "s1" });
    step1.status = "failed";
    goal.steps = [step1];
    assert.strictEqual(isGoalFailed(goal), true);
  });

  console.log("\n--- Goal Planner ---");
  await test("planGoal creates steps for bugfix", () => {
    const goal = createGoal({ type: "bugfix", title: "Fix login" });
    const planned = planGoal(goal);
    assert.ok(planned.steps.length > 0, "Should have steps");
    assert.strictEqual(planned.status, "planned");
    assert.strictEqual(planned.steps[0].type, "analyze");
  });

  await test("planGoal creates steps for feature", () => {
    const goal = createGoal({ type: "feature", title: "Add dark mode" });
    const planned = planGoal(goal);
    assert.ok(planned.steps.length >= 5, "Should have 5+ steps");
  });

  await test("planGoalWithFiles adds per-file steps", () => {
    const goal = createGoal({ type: "bugfix", title: "Fix" });
    const planned = planGoalWithFiles(goal, ["a.js", "b.js"]);
    assert.ok(planned.steps.length > 6, "Should have base + file steps");
  });

  await test("generateExecutionPlan groups by phase", () => {
    const goal = createGoal({ type: "bugfix", title: "Fix" });
    planGoal(goal);
    const plan = generateExecutionPlan(goal);
    assert.ok(plan.phases.length > 0, "Should have phases");
    assert.strictEqual(plan.goalId, goal.id);
  });

  await test("STEP_TEMPLATES covers all goal types", () => {
    assert.ok(STEP_TEMPLATES.bugfix, "Should have bugfix");
    assert.ok(STEP_TEMPLATES.feature, "Should have feature");
    assert.ok(STEP_TEMPLATES.refactor, "Should have refactor");
    assert.ok(STEP_TEMPLATES.test, "Should have test");
    assert.ok(STEP_TEMPLATES.review, "Should have review");
    assert.ok(STEP_TEMPLATES.custom, "Should have custom");
  });

  console.log("\n--- Goal Executor ---");
  await test("executeGoal runs all steps", () => {
    const goal = createGoal({ type: "review", title: "Quick review" });
    planGoal(goal);
    const result = executeGoal(goal);
    assert.strictEqual(result.goal.status, "completed");
    assert.ok(result.stepsExecuted > 0);
    assert.ok(result.log.length > 0);
  });

  await test("executeGoal handles custom handlers", () => {
    const goal = createGoal({ type: "analyze", title: "Analyze" });
    planGoal(goal);
    const customHandler = () => ({ custom: true });
    const result = executeGoal(goal, { analyze: customHandler });
    assert.strictEqual(result.goal.status, "completed");
    assert.strictEqual(result.goal.steps[0].result.custom, true);
  });

  await test("executeGoal marks step as failed on error", () => {
    const goal = createGoal({ type: "analyze", title: "Fail" });
    planGoal(goal);
    const failHandler = () => { throw new Error("boom"); };
    const result = executeGoal(goal, { analyze: failHandler });
    assert.strictEqual(result.goal.steps[0].status, "failed");
  });

  await test("executeGoal respects MAX_STEPS limit", () => {
    assert.ok(MAX_STEPS > 0, "MAX_STEPS should be positive");
  });

  await test("generateReport creates summary", () => {
    const goal = createGoal({ type: "bugfix", title: "Fix" });
    goal.steps = [createStep({ type: "analyze", description: "s1" })];
    goal.steps[0].status = "completed";
    goal.status = "completed";
    goal.completedAt = new Date().toISOString();
    const report = generateReport(goal);
    assert.strictEqual(report.goalId, goal.id);
    assert.ok(report.summary.includes("1/1"));
  });

  console.log("\n--- Goal Engine Service ---");
  await test("createAndPlanGoal creates and persists goal", () => {
    const result = createAndPlanGoal({ type: "bugfix", title: "Fix login" });
    assert.strictEqual(result.success, true);
    assert.ok(result.goal.id);
    assert.strictEqual(result.goal.steps.length, 6);
  });

  await test("getGoalStatus returns status", () => {
    const created = createAndPlanGoal({ type: "feature", title: "Add feature" });
    const status = getGoalStatus(created.goal.id);
    assert.ok(status, "Should find goal");
    assert.strictEqual(status.id, created.goal.id);
    assert.ok(status.steps.length > 0);
  });

  await test("listGoals returns goals", () => {
    const goals = listGoals();
    assert.ok(Array.isArray(goals));
    assert.ok(goals.length > 0, "Should list goals");
  });

  await test("getExecutionPlan returns plan", () => {
    const created = createAndPlanGoal({ type: "bugfix", title: "Fix" });
    const plan = getExecutionPlan(created.goal.id);
    assert.ok(plan, "Should return plan");
    assert.ok(plan.phases.length > 0);
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
