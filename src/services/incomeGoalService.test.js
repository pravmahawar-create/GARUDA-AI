const assert = require("assert");
const {
  DEFAULT_TARGET_AMOUNT,
  buildMilestones,
  buildMissionPlan,
  normalizeTargetAmount,
  requireFounderApproval
} = require("./incomeGoalService");

assert.strictEqual(DEFAULT_TARGET_AMOUNT, 100000);
assert.strictEqual(normalizeTargetAmount(), 100000);
assert.throws(() => normalizeTargetAmount(0), /greater than zero/);
assert.throws(() => buildMilestones(100000, 13), /between 1 and 12/);

const plan = buildMissionPlan({});
assert.strictEqual(plan.targetAmount, 100000);
assert.strictEqual(plan.currency, "INR");
assert.strictEqual(plan.milestones.length, 4);
assert.strictEqual(plan.milestones[3].targetAmount, 100000);
assert.strictEqual(plan.constraints.lawfulOnly, true);
assert.strictEqual(plan.constraints.verifiedOpportunitiesOnly, true);
assert.strictEqual(plan.constraints.founderApprovalForExecution, true);
assert.strictEqual(plan.constraints.noIncomeGuarantee, true);
assert.strictEqual(plan.missionPolicy.targetIsMinimum, true);
assert.strictEqual(plan.missionPolicy.stopAtTarget, false);
assert.strictEqual(plan.missionPolicy.continuousDiscovery, true);
assert.strictEqual(plan.missionPolicy.pursueUpsideOpportunities, true);
assert.strictEqual(plan.missionPolicy.idleOnOpportunityGap, false);
assert.strictEqual(plan.missionPolicy.controlRoom, "mobile_first");
assert.strictEqual(plan.optimizationTargetOnly, true);
assert.ok(plan.workflow.includes("request_founder_approval"));
assert.ok(plan.workflow.includes("verify_payment"));
assert.ok(plan.workflow.includes("continue_discovery_beyond_target"));

assert.doesNotThrow(() => requireFounderApproval({ founderApproved: "true" }));
assert.throws(() => requireFounderApproval({ founderApproved: false }), /Founder approval/);

console.log("Income goal engine validation test passed.");
