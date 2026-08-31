/**
 * 🦅 GARUDA Campaign Orchestrator Service — Test Suite
 * Growth Stage Phase 2
 *
 * Run: node src/services/campaignOrchestratorService.test.js
 */

const assert = require("assert");
const {
  CAMPAIGN_STATUS,
  CAMPAIGN_STATUS_FLOW,
  CampaignOrchestratorService
} = require("./campaignOrchestratorService");

const service = new CampaignOrchestratorService();
service.clearForTesting();

const VALID_BRIEF = {
  businessName: "Skyline Residences",
  industry: "Real Estate",
  productOrService: "Luxury 3 & 4 BHK residences",
  targetAudience: "Affluent families and investors",
  campaignGoal: "LEAD_GENERATION",
  geography: "Jaipur, Rajasthan",
  channels: ["INSTAGRAM", "GOOGLE_SEARCH", "EMAIL"],
  brandContext: "RERA-first luxury developer"
};

async function run() {
  console.log("=== CAMPAIGN ORCHESTRATOR SERVICE — PHASE 2 TESTS ===\n");

  // ---------------------------------------------------------------------------
  // 1. Creation from brief
  // ---------------------------------------------------------------------------
  console.log("--- 1. Campaign creation from business brief ---");
  const campaign = await service.createCampaign({ briefInput: VALID_BRIEF });
  assert.ok(campaign.campaignId.startsWith("gc_"), "campaignId issued");
  assert.strictEqual(campaign.status, CAMPAIGN_STATUS.STRATEGIZED);
  assert.strictEqual(campaign.businessBrief.businessName, "Skyline Residences");
  assert.ok(campaign.growthStrategyRef.strategyId.startsWith("gs_"), "strategy ref bound");
  assert.ok(/^[a-f0-9]{64}$/.test(campaign.growthStrategyRef.strategyHash), "strategy hash anchored");
  console.log("✔ PASS: campaign created in STRATEGIZED state with strategy binding");

  // ---------------------------------------------------------------------------
  // 2. Cross-universe plan structure
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Cross-universe plan contracts ---");
  assert.strictEqual(campaign.brandContext.universe, "U21");
  assert.ok(campaign.brandContext.requiredArtifacts.includes("IDENTITY_LOCK_HASH"));
  assert.ok(campaign.brandContext.identityLockNotice.includes("IdentityLock"));

  assert.strictEqual(campaign.contentPlan.universe, "U20");
  assert.ok(campaign.contentPlan.deliverables.includes("EDITORIAL_CALENDAR_4WEEK"));
  assert.ok(campaign.contentPlan.engineBinding.includes("digitalMarketingOsService"));

  assert.ok(Array.isArray(campaign.creativeBriefs) && campaign.creativeBriefs.length >= 3);
  assert.ok(campaign.creativeBriefs.every((b) => b.universe === "U19"));
  assert.ok(campaign.creativeBriefs.every((b) => b.deliverable === "CREATIVE_BRIEF_AND_STORYBOARD_ONLY"));
  assert.ok(campaign.creativeBriefs.every((b) => b.truthNotice.includes("connected generation provider")));

  assert.strictEqual(campaign.presencePlan.universe, "U22");
  assert.ok(campaign.presencePlan.deliverables.includes("LANDING_PAGE_BLUEPRINT"));

  assert.strictEqual(campaign.communicationPlan.universe, "U07");
  assert.ok(campaign.communicationPlan.governanceNotice.includes("founder approval"));
  assert.ok(campaign.communicationPlan.dispatchContract.includes("NEVER dispatches"));

  assert.strictEqual(campaign.revenueHandoff.universe, "U10");
  assert.ok(campaign.revenueHandoff.revenuePath.includes("VERIFIED REVENUE"));

  assert.ok(Array.isArray(campaign.measurementPlan.trackedEvents));
  assert.ok(campaign.lifecycleLog.length === 1);
  assert.ok(/^[a-f0-9]{64}$/.test(campaign.statusHash));
  console.log("✔ PASS: U21/U20/U19/U22/U07/U10 plans present with governance notices");

  // ---------------------------------------------------------------------------
  // 3. Creation from existing strategyId
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. Campaign creation from existing strategyId ---");
  const strategyId = campaign.growthStrategyRef.strategyId;
  const campaign2 = await service.createCampaign({ strategyId });
  assert.strictEqual(campaign2.growthStrategyRef.strategyId, strategyId);
  assert.notStrictEqual(campaign2.campaignId, campaign.campaignId);
  await assert.rejects(
    () => service.createCampaign({ strategyId: "gs_missing_123" }),
    (err) => err.statusCode === 404
  );
  await assert.rejects(
    () => service.createCampaign({}),
    (err) => err.statusCode === 400
  );
  console.log("✔ PASS: strategy reuse works; missing strategy 404; empty input 400");

  // ---------------------------------------------------------------------------
  // 4. Lifecycle transitions + approval gate
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. Lifecycle & founder approval gate ---");
  // Invalid transition first
  assert.throws(
    () => service.approveCampaign(campaign.campaignId, { approvalToken: "tok" }),
    (err) => err.statusCode === 409 && /Invalid campaign transition/.test(err.message)
  );
  // Legal path: STRATEGIZED -> READY_FOR_APPROVAL
  const rfa = service.markReadyForApproval(campaign.campaignId);
  assert.strictEqual(rfa.status, CAMPAIGN_STATUS.READY_FOR_APPROVAL);

  // Approval without token -> 403
  assert.throws(
    () => service.approveCampaign(campaign.campaignId, {}),
    (err) => err.statusCode === 403 && /approval token is required/.test(err.message)
  );
  // Approval with token -> APPROVED
  const approved = service.approveCampaign(campaign.campaignId, {
    approvalToken: "founder-token-abc",
    approvedBy: "founder",
    note: "Approve Skyline launch"
  });
  assert.strictEqual(approved.status, CAMPAIGN_STATUS.APPROVED);
  assert.strictEqual(approved.approval.approvedBy, "founder");
  assert.ok(/^[a-f0-9]{64}$/.test(approved.approval.approvalTokenRef), "token stored as hash only");
  assert.notStrictEqual(approved.approval.approvalTokenRef, "founder-token-abc");
  assert.strictEqual(approved.lifecycleLog.length, 3);

  // Double approval -> 409
  assert.throws(
    () => service.approveCampaign(campaign.campaignId, { approvalToken: "x" }),
    (err) => err.statusCode === 409
  );
  console.log("✔ PASS: gate enforces transition order, token requirement, hash-only storage");

  // ---------------------------------------------------------------------------
  // 5. Execution staging
  // ---------------------------------------------------------------------------
  console.log("\n--- 5. Execution staging ---");
  const exec = service.markExecutionPending(campaign.campaignId, { requestedBy: "founder" });
  assert.strictEqual(exec.status, CAMPAIGN_STATUS.EXECUTION_PENDING);
  assert.ok(exec.executionContext.notice.includes("No automatic spend or dispatch"));
  assert.throws(
    () => service.markExecutionPending(campaign.campaignId, {}),
    (err) => err.statusCode === 409
  );
  console.log("✔ PASS: EXECUTION_PENDING staging with truthful governance notice");

  // ---------------------------------------------------------------------------
  // 6. Persistence + retrieval
  // ---------------------------------------------------------------------------
  console.log("\n--- 6. Persistence & retrieval ---");
  const fetched = service.getCampaign(campaign.campaignId);
  assert.strictEqual(fetched.status, CAMPAIGN_STATUS.EXECUTION_PENDING);
  const list = service.listCampaigns(10);
  assert.ok(list.length >= 2);
  assert.ok(list[0].createdAt >= list[list.length - 1].createdAt);
  assert.strictEqual(service.getCampaign("gc_missing"), null);
  console.log("✔ PASS: JSONL persistence, newest-first listing, null on missing");

  // ---------------------------------------------------------------------------
  // 7. Flow map integrity
  // ---------------------------------------------------------------------------
  console.log("\n--- 7. Lifecycle flow map ---");
  assert.deepStrictEqual(CAMPAIGN_STATUS_FLOW[CAMPAIGN_STATUS.EXECUTION_PENDING], []);
  assert.ok(CAMPAIGN_STATUS_FLOW[CAMPAIGN_STATUS.DRAFT].includes(CAMPAIGN_STATUS.STRATEGIZED));
  console.log("✔ PASS: terminal state has no outgoing transitions");

  console.log("\n=== ALL CAMPAIGN ORCHESTRATOR TESTS PASSED ===");
}

run().catch((err) => {
  console.error("✘ TEST FAILURE:", err.message);
  process.exit(1);
});
