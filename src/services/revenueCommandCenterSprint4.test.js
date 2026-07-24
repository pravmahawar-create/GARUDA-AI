const assert = require("assert");
const { getRevenueMetrics, calculateNextHighestRoiAction, parseMonetaryValue } = require("./revenueCommandCenterService");
const { executeRevenueTask } = require("../../scripts/mother/revenueEngine");

async function testSprint4CommandCenter() {
  // 1. Validate monetary parsing logic
  assert.strictEqual(parseMonetaryValue("$10,000 fixed price"), 10000);
  assert.strictEqual(parseMonetaryValue("$120,000 / yr"), 120000);
  assert.strictEqual(parseMonetaryValue("$50k"), 50000);

  // 2. Validate Next Highest ROI Action decision matrix
  const action1 = calculateNextHighestRoiAction({ founderApprovalsPending: 3 });
  assert.strictEqual(action1.action, "REVIEW_PENDING_PROPOSALS");
  assert.strictEqual(action1.priority, "CRITICAL");

  const action2 = calculateNextHighestRoiAction({ founderApprovalsPending: 0, garudaDeliverableOpportunities: 2, proposalReadyOpportunities: 0 });
  assert.strictEqual(action2.action, "GENERATE_AUTOMATED_PROPOSALS");
  assert.strictEqual(action2.priority, "HIGH");

  const action3 = calculateNextHighestRoiAction({ founderApprovalsPending: 0, garudaDeliverableOpportunities: 0, opportunitiesDiscovered: 0 });
  assert.strictEqual(action3.action, "RUN_LIVE_OPPORTUNITY_DISCOVERY");
  assert.strictEqual(action3.priority, "HIGH");

  // 3. Validate getRevenueMetrics output structure & real data aggregation
  const commandCenter = await getRevenueMetrics();
  assert.ok(commandCenter.timestamp);
  assert.ok(commandCenter.dataSource);

  const m = commandCenter.metrics;
  assert.ok(typeof m.opportunitiesDiscovered === "number");
  assert.ok(typeof m.qualifiedOpportunities === "number");
  assert.ok(typeof m.garudaDeliverableOpportunities === "number");
  assert.ok(typeof m.proposalReadyOpportunities === "number");
  assert.ok(typeof m.founderApprovalsPending === "number");
  assert.ok(typeof m.submittedProposals === "number");
  assert.ok(typeof m.clientResponses === "number");
  assert.ok(typeof m.negotiations === "number");
  assert.ok(typeof m.wonOpportunities === "number");
  assert.ok(typeof m.lostOpportunities === "number");
  assert.ok(typeof m.revenuePotential === "string");
  assert.ok(typeof m.revenueClosed === "string");
  assert.ok(typeof m.conversionPercentage === "string");

  assert.ok(commandCenter.nextHighestRoiAction.action);
  assert.ok(commandCenter.nextHighestRoiAction.priority);
  assert.ok(commandCenter.nextHighestRoiAction.reason);

  // 4. Validate Mother Brain task execution
  const motherResult = await executeRevenueTask("Show Revenue Command Center metrics and pipeline dashboard");
  assert.strictEqual(motherResult.success, true);
  assert.strictEqual(motherResult.output.taskType, "revenue_command_center");
  assert.ok(motherResult.output.commandCenter.metrics);
  assert.ok(motherResult.output.commandCenter.nextHighestRoiAction);

  console.log("Sprint 4 Revenue Command Center validation passed.");
}

testSprint4CommandCenter().catch((err) => {
  console.error("Sprint 4 validation failed:", err);
  process.exit(1);
});
