const assert = require("assert");
const { requiresFounderApproval } = require("./approvalPolicy");
const { createBuildIntent } = require("../agents/builderAgent");
const { executeSafeActions } = require("../executor/safeExecutor");

for (const type of ["file_write", "revenue_external_action", "financial_action", "external_action", "deployment", "autonomous_execution", "constitutional_change"]) {
  assert.strictEqual(requiresFounderApproval({ type }), true, `${type} must require Founder approval`);
}
assert.strictEqual(requiresFounderApproval({ type: "read" }), false);

const intent = createBuildIntent({ planner: { priorityTask: { type: "mother_core_expansion" } } });
assert.strictEqual(intent.safeActions[0].status, "approval_required");
assert.strictEqual(intent.safeActions[0].requiresFounderApproval, true);

const result = executeSafeActions({ priorityTask: { type: "mother_core_expansion" } });
assert.strictEqual(result.changedFiles, 0);
assert.strictEqual(result.approvalRequired, true);
assert.ok(result.executed.every((item) => item.status === "BLOCKED_BY_APPROVAL" && item.action === "proposed"));

console.log("Self-build and revenue-sensitive approval policy validation passed.");
