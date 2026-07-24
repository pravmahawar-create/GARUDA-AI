const assert = require("assert");
const { getGarudaRevenueState } = require("./universalRevenueService");

async function testUniversalRevenueService() {
  console.log("Running Universal Revenue Service Step 1 validation...");

  const state = await getGarudaRevenueState({ sampleJobs: [] });

  // 1. Verify Schema Sections
  assert.ok(state.summary, "summary section missing");
  assert.ok(state.pipeline, "pipeline section missing");
  assert.ok(state.outreach, "outreach section missing");
  assert.ok(state.accounting, "accounting section missing");
  assert.ok(state.governance, "governance section missing");
  assert.ok(state.legacy, "legacy section missing");

  // 2. Verify Revenue Separation (never mixing pipeline with settled revenue)
  assert.strictEqual(typeof state.summary.settledRevenueINR, "number");
  assert.strictEqual(typeof state.summary.pendingRevenueINR, "number");
  assert.strictEqual(typeof state.summary.pipelinePotentialINR, "number");
  assert.strictEqual(typeof state.summary.mtdSettledRevenueINR, "number");
  assert.ok(state.summary.lastUpdated);

  // 3. Verify Legacy Backward Compatibility Fields
  assert.ok("receivedRevenue" in state.legacy);
  assert.ok("mtdRevenue" in state.legacy);
  assert.ok("revenuePotential" in state.legacy);

  // 4. Verify Governance & Identity Statement
  assert.ok(state.governance.nextHighestRoiAction);
  assert.ok(state.governance.garudaIdentityStatement.includes("Praveen's AI representative"));

  console.log("Universal Revenue State Schema Result:");
  console.log(JSON.stringify(state, null, 2));

  console.log("Universal Revenue Service Step 1 validation passed.");
}

testUniversalRevenueService().catch((err) => {
  console.error("Universal Revenue Service validation failed:", err);
  process.exit(1);
});
