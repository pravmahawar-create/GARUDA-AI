const assert = require("assert");
const path = require("path");
const { executeRevenueTask } = require("../../scripts/mother/revenueEngine");
const { buildProposal } = require("./revenueAcquisitionService");
const { buildHandoffPreview } = require("./revenueWorkIntakeService");
const { classifySourceTruth } = require("./revenueSourceTruthService");

async function testSprint2VerticalSlice() {
  const rootDir = path.resolve(__dirname, "../..");
  const now = new Date("2026-07-24T10:00:00.000Z");

  const candidateBase = {
    _id: "507f1f77bcf86cd799439011",
    missionId: "507f191e810c19729de860ea",
    status: "approved",
    title: "Build Node.js Microservice & REST API Backend",
    company: "Enterprise Partner",
    description: "Request for proposal with a fixed price, scope of work, project milestone, delivery deadline, and acceptance criteria for a tested Node API.",
    source: "verified_client_portal",
    sourceAttribution: "Verified client portal",
    externalId: "sprint2-opp-01",
    category: "contract_project",
    location: "Remote",
    url: "https://client.example/opportunity/1",
    tags: ["Node", "API", "Testing"],
    score: 95,
    opportunityChannel: "garuda_deliverable",
    capabilityAssessment: { selfEarningEligible: true, humanIdentityRequired: false, matches: [{ capabilityId: "engineering.software-implementation", name: "Governed software implementation", universe: "Engineering", score: 95 }] },
    decision: { actor: "founder", decidedAt: now.toISOString() }
  };

  const candidate = {
    ...candidateBase,
    verification: {
      ...classifySourceTruth(candidateBase, now),
      prohibitedContentClear: true,
      scamSignalsClear: true
    }
  };

  const proposal = buildProposal(candidate, { proposalType: "application" }, now, { rootDir });
  assert.strictEqual(proposal.status, "proposal_drafted");
  assert.strictEqual(proposal.proposal.proposalType, "application");
  assert.ok(proposal.proposal.proposalHash);
  assert.ok(proposal.proposal.deliverables.length > 0);

  const handoff = buildHandoffPreview(
    candidate,
    {
      handoffType: "application",
      destination: "https://client-portal.example/intake",
      summary: "Sprint 2 quotation handoff package",
      founderAuthorized: true,
      attestation: { productionData: true, noPlaceholderData: true }
    },
    now,
    { rootDir }
  );
  assert.strictEqual(handoff.status, "handoff_ready");
  assert.ok(handoff.handoff.packageHash);

  const motherExecution = executeRevenueTask("Generate technical proposal and CRM work intake package", { rootDir });
  assert.strictEqual(motherExecution.success, true);
  assert.strictEqual(motherExecution.output.taskType, "revenue_proposal_and_crm_intake");
  assert.strictEqual(motherExecution.output.proposalAndCrm.status, "PROPOSAL_AND_INTAKE_READY");
  assert.strictEqual(motherExecution.output.proposalAndCrm.crmState, "proposal_drafted");
  assert.ok(motherExecution.output.proposalAndCrm.proposalDraft.proposalHash);
  assert.ok(motherExecution.output.proposalAndCrm.handoffPackage.packageHash);
  assert.strictEqual(motherExecution.output.proposalAndCrm.governance.founderApprovalRequiredBeforeSubmission, true);

  console.log("Sprint 2 Proposal Generation & Work Intake CRM vertical slice validation passed.");
}

testSprint2VerticalSlice().catch((err) => {
  console.error("Sprint 2 vertical slice test failed:", err);
  process.exit(1);
});
