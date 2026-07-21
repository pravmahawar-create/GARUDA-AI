const assert = require("assert");
const { understandGoal } = require("./goalEngine");
const { decompose } = require("./taskDecomposer");

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

console.log("Revenue goal routing test passed.");
