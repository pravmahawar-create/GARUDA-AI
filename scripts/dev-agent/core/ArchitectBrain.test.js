const assert = require("assert");
const ArchitectBrain = require("./ArchitectBrain");

const brain = new ArchitectBrain();
const plan = brain.plan({
  goalId: "mission-validator",
  goal: "Create a bounded mission input validator",
  domain: "revenue",
  confidence: 0.9,
  engineeringSpec: {
    template: "required_fields_validator",
    modulePath: "src/generated/missionInputValidator.js",
    testPath: "src/generated/missionInputValidator.test.js",
    requiredFields: ["missionId", "target"]
  }
});
assert.strictEqual(plan.status, "PLAN_READY_FOR_REVIEW");
assert.strictEqual(plan.tasks.length, 6);
assert.strictEqual(plan.dependencyOrder.length, 6);
assert.strictEqual(new Set(plan.dependencyOrder).size, 6);
assert.strictEqual(plan.engineeringHandoff.policy.rawCodeAccepted, false);
assert.strictEqual(plan.governance.sourceWriteAllowed, false);
assert.strictEqual(plan.governance.commitPushDeployAllowed, false);
assert.strictEqual(plan.governance.founderApprovalRequired, true);
assert.ok(plan.tasks.every((item) => item.blockedActions.includes("write_source") && item.blockedActions.includes("push")));
assert.ok(plan.risks.some((risk) => risk.id === "REVENUE_COMPLIANCE"));
assert.match(plan.planId, /^[a-f0-9]{64}$/);

const analysisOnly = brain.plan({ goal: "Map the current frontend shell" });
assert.strictEqual(analysisOnly.engineeringHandoff, null);
assert.strictEqual(analysisOnly.tasks[2].deliverable, "implementation_proposal");
assert.throws(() => brain.plan({ goal: "" }), /required/);
assert.throws(() => brain.plan({ goal: "x", engineeringSpec: { template: "raw_code" } }), /not allow-listed/);

console.log("Architect Brain structured plan validation passed.");
