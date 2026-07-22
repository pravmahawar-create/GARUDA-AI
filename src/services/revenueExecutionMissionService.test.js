const assert = require("assert");
const path = require("path");
const { buildMissionPreview, validateApprovedCandidate } = require("./revenueExecutionMissionService");
const { hash } = require("./revenueWorkIntakeService");
const { classifySourceTruth } = require("./revenueSourceTruthService");

const rootDir = path.resolve(__dirname, "../..");
function candidate(overrides = {}) {
  const base = {
    _id: "507f1f77bcf86cd799439011",
    missionId: "507f191e810c19729de860ea",
    status: "approved",
    title: "Build a governed Node API integration",
    company: "Example",
    description: "Request for proposal with a fixed price, scope of work, project milestone, delivery deadline, and acceptance criteria.",
    source: "verified_client_portal",
    sourceAttribution: "Verified client portal",
    externalId: "opportunity-1",
    category: "contract_project",
    location: "Remote",
    url: "https://client.example/opportunity/1",
    tags: ["Node", "API", "Testing"],
    score: 88,
    opportunityChannel: "garuda_deliverable",
    capabilityAssessment: {
      selfEarningEligible: true,
      humanIdentityRequired: false,
      matches: [{ capabilityId: "engineering.software-implementation", universe: "engineering", name: "Governed software implementation", score: 80 }]
    },
    decision: { actor: "founder", decidedAt: new Date("2026-07-21T12:00:00.000Z") }
  };
  const merged = { ...base, ...overrides };
  return overrides.verification
    ? merged
    : { ...merged, verification: { ...classifySourceTruth(merged), prohibitedContentClear: true, scamSignalsClear: true } };
}

const workIntake = {
  id: "507f1f77bcf86cd799439012",
  candidateId: "507f1f77bcf86cd799439011",
  incomeGoalId: "507f191e810c19729de860ea",
  status: "work_confirmed",
  truthHash: "",
  lastAuditHash: "e".repeat(64),
  listing: { classification: "public_listing_not_contract" },
  engagement: { verified: true, reference: "award-verified-001", evidenceKind: "platform_award", verifiedAt: "2026-07-21T13:00:00.000Z", workAuthorizationConfirmed: true, termsAcceptedByClient: true },
  brief: { title: "Verified API delivery", deliverableType: "Node API integration", scopeSummary: "Implement the client-confirmed integration.", requiredInputs: ["API specification"], price: { amount: 75000, currency: "INR" }, deadline: "2026-08-21T13:00:00.000Z", acceptanceCriteria: ["All agreed API acceptance checks pass"] }
};
workIntake.truthHash = hash({ candidateId: workIntake.candidateId, incomeGoalId: workIntake.incomeGoalId, listing: workIntake.listing, engagement: workIntake.engagement, brief: workIntake.brief, attestation: { productionData: true, noPlaceholderData: true } });

const preview = buildMissionPreview(candidate(), { rootDir, workIntake });
assert.strictEqual(preview.status, "awaiting_bounded_scope");
assert.strictEqual(preview.capability.id, "engineering.software-implementation");
assert.strictEqual(preview.architecturePlan.status, "PLAN_READY_FOR_REVIEW");
assert.strictEqual(preview.architecturePlan.engineeringHandoff, null);
assert.deepStrictEqual(preview.executionPath, ["architect", "engineering", "tester", "reviewer", "founder"]);
assert.strictEqual(preview.governance.automaticOutreachAllowed, false);
assert.strictEqual(preview.governance.automaticContractAcceptanceAllowed, false);
assert.strictEqual(preview.governance.commitPushDeployAllowed, false);
assert.strictEqual(preview.governance.listingAloneNeverCreatesMission, true);
assert.strictEqual(preview.opportunity.listingClassification, "public_listing_not_contract");
assert.strictEqual(preview.realWorkIntake.truthHash, workIntake.truthHash);
assert.match(preview.missionHash, /^[a-f0-9]{64}$/);
assert.strictEqual(buildMissionPreview(candidate(), { rootDir, workIntake }).missionHash, preview.missionHash);
assert.throws(() => buildMissionPreview(candidate(), { rootDir }), /real-work intake/);

assert.throws(() => validateApprovedCandidate(candidate({ status: "ranked" }), { rootDir }), /Founder-approved/);
assert.throws(() => validateApprovedCandidate(candidate({ opportunityChannel: "human_opportunity_only" }), { rootDir }), /GARUDA-deliverable/);
assert.throws(() => validateApprovedCandidate(candidate({ capabilityAssessment: { selfEarningEligible: true, humanIdentityRequired: true, matches: [] } }), { rootDir }), /not eligible/);
assert.throws(() => validateApprovedCandidate(candidate({ verification: { sourceVerified: false } }), { rootDir }), /verification gates/);
assert.throws(() => validateApprovedCandidate(candidate({ decision: { actor: "", decidedAt: null } }), { rootDir }), /approval evidence/);
assert.throws(() => validateApprovedCandidate(candidate({ decision: { actor: "operator", decidedAt: new Date() } }), { rootDir }), /Founder approval evidence/);

console.log("Revenue execution mission bridge validation passed.");
