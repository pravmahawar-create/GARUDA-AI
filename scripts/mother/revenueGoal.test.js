const assert = require("assert");
const { understandGoal } = require("./goalEngine");
const { decompose } = require("./taskDecomposer");
const { routeTask } = require("./router");
const { execute } = require("./executor");
const { buildExecutionResultSummary } = require("./reporter");

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

const executedTasks = execute(plannedTasks);
assert.ok(executedTasks.every((item) => item.engine === "Revenue"));
assert.ok(executedTasks.every((item) => item.status === "SUCCESS"));
assert.deepStrictEqual(
  executedTasks.map((item) => item.result.output.taskType),
  ["revenue_analysis", "revenue_integration_plan", "revenue_validation"]
);

const revenueSummary = buildExecutionResultSummary(executedTasks[0]);
assert.strictEqual(revenueSummary.revenueEngineReady, true);
assert.strictEqual(revenueSummary.inspectedModuleCount, 15);
assert.deepStrictEqual(revenueSummary.issues, []);

console.log("Revenue goal routing test passed.");
