const assert = require("assert");
const { understandGoal } = require("./goalEngine");
const { decompose } = require("./taskDecomposer");
const { routeTask } = require("./router");
const { execute } = require("./executor");
const { buildExecutionResultSummary } = require("./reporter");

(async () => {
  const goal = understandGoal(
    "Continue Revenue Model development and integrate the Revenue Engine with Mother Brain autonomous execution"
  );

  assert.strictEqual(goal.domain, "revenue");
  assert.strictEqual(goal.intent, "develop_revenue_model");
  assert.strictEqual(goal.priority, "critical");
  assert.deepStrictEqual(decompose(goal), [
    "Analyze existing Revenue Engine",
    "Plan Revenue Engine integration with Mother Brain",
    "Validate Revenue Engine integration"
  ]);

  const plannedTasks = decompose(goal).map((task, index) => ({
    step: index + 1,
    task,
    status: "PENDING"
  }));

  assert.ok(plannedTasks.every((item) => routeTask(item.task) === "revenue"));

  const executedTasks = await execute(plannedTasks);
  assert.ok(Array.isArray(executedTasks), "execute() must resolve to an array, not a Promise");
  assert.ok(executedTasks.every((item) => item.engine === "Revenue"));
  assert.ok(executedTasks.every((item) => item.status === "SUCCESS"));

  // Regression guard for the original sync/async mismatch:
  // the executor must evaluate a resolved revenue result, not a Promise.
  executedTasks.forEach((item) => {
    assert.ok(
      item.result && !(item.result instanceof Promise),
      `Revenue result must not be a Promise for task: ${item.task}`
    );
    assert.strictEqual(
      item.result.success,
      true,
      `Revenue result.success must be true (was ${item.result.success}) for task: ${item.task}`
    );
  });

  assert.deepStrictEqual(
    executedTasks.map((item) => item.result.output.taskType),
    ["revenue_analysis", "revenue_integration_plan", "revenue_validation"]
  );

  const revenueSummary = buildExecutionResultSummary(executedTasks[0]);
  assert.strictEqual(revenueSummary.success, true);
  assert.strictEqual(revenueSummary.revenueEngineReady, true);
  assert.strictEqual(revenueSummary.inspectedModuleCount, 23);
  assert.deepStrictEqual(revenueSummary.issues, []);

  console.log("Revenue goal routing test passed.");
})().catch((err) => {
  console.error("Revenue goal routing test FAILED:", err);
  process.exitCode = 1;
});