const assert = require("assert");
const path = require("path");
const { buildMissionPreview, validateApprovedCandidate } = require("./revenueExecutionMissionService");

const rootDir = path.resolve(__dirname, "../..");
function candidate(overrides = {}) {
  return {
    _id: "507f1f77bcf86cd799439011",
    missionId: "507f191e810c19729de860ea",
    status: "approved",
    title: "Build a governed Node API integration",
    company: "Example",
    source: "verified-source",
    url: "https://example.com/opportunity/1",
    score: 88,
    opportunityChannel: "garuda_deliverable",
    verification: { sourceVerified: true, originalLinkPresent: true, prohibitedContentClear: true, scamSignalsClear: true },
    capabilityAssessment: {
      selfEarningEligible: true,
      humanIdentityRequired: false,
      matches: [{ capabilityId: "engineering.software-implementation", universe: "engineering", name: "Governed software implementation", score: 80 }]
    },
    decision: { actor: "founder", decidedAt: new Date("2026-07-21T12:00:00.000Z") },
    ...overrides
  };
}

const preview = buildMissionPreview(candidate(), { rootDir });
assert.strictEqual(preview.status, "awaiting_bounded_scope");
assert.strictEqual(preview.capability.id, "engineering.software-implementation");
assert.strictEqual(preview.architecturePlan.status, "PLAN_READY_FOR_REVIEW");
assert.strictEqual(preview.architecturePlan.engineeringHandoff, null);
assert.deepStrictEqual(preview.executionPath, ["architect", "engineering", "tester", "reviewer", "founder"]);
assert.strictEqual(preview.governance.automaticOutreachAllowed, false);
assert.strictEqual(preview.governance.automaticContractAcceptanceAllowed, false);
assert.strictEqual(preview.governance.commitPushDeployAllowed, false);
assert.match(preview.missionHash, /^[a-f0-9]{64}$/);
assert.strictEqual(buildMissionPreview(candidate(), { rootDir }).missionHash, preview.missionHash);

assert.throws(() => validateApprovedCandidate(candidate({ status: "ranked" }), { rootDir }), /Founder-approved/);
assert.throws(() => validateApprovedCandidate(candidate({ opportunityChannel: "human_opportunity_only" }), { rootDir }), /GARUDA-deliverable/);
assert.throws(() => validateApprovedCandidate(candidate({ capabilityAssessment: { selfEarningEligible: true, humanIdentityRequired: true, matches: [] } }), { rootDir }), /not eligible/);
assert.throws(() => validateApprovedCandidate(candidate({ verification: { sourceVerified: false } }), { rootDir }), /verification gates/);
assert.throws(() => validateApprovedCandidate(candidate({ decision: { actor: "", decidedAt: null } }), { rootDir }), /approval evidence/);
assert.throws(() => validateApprovedCandidate(candidate({ decision: { actor: "operator", decidedAt: new Date() } }), { rootDir }), /Founder approval evidence/);

console.log("Revenue execution mission bridge validation passed.");
