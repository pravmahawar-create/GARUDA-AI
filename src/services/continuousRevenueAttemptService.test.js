const assert = require("assert");
const path = require("path");
const { classifySourceTruth } = require("./revenueSourceTruthService");
const { assessCandidateForAttempt, emptySummary } = require("./continuousRevenueAttemptService");

const now = new Date("2026-07-22T10:00:00.000Z");
const rootDir = path.resolve(__dirname, "../..");
const base = {
  _id: "507f1f77bcf86cd799439011",
  missionId: "507f191e810c19729de860ea",
  status: "approved",
  decision: { actor: "founder", decidedAt: now.toISOString() },
  title: "Build and test a bounded Node API",
  company: "Verified Client",
  description: "Request for proposal with a fixed price, scope of work, project milestone, delivery deadline, and acceptance criteria.",
  source: "verified_client_portal",
  sourceAttribution: "Verified client portal",
  externalId: "rfp-42",
  category: "contract_project",
  location: "Remote",
  url: "https://client.example/work/rfp-42",
  tags: ["Node", "API", "Testing"],
  score: 92,
  opportunityChannel: "garuda_deliverable",
  capabilityAssessment: { selfEarningEligible: true, humanIdentityRequired: false, matches: [{ capabilityId: "engineering.software-implementation", name: "Governed software implementation", universe: "engineering", score: 92 }] }
};
const direct = { ...base, verification: { ...classifySourceTruth(base, now), prohibitedContentClear: true, scamSignalsClear: true } };
assert.deepStrictEqual(assessCandidateForAttempt(direct, { rootDir, now }), { draftable: true, reason: "current_specific_client_work_verified" });

const recruitmentBase = { ...base, source: "remotive", externalId: "network-1", company: "A.Team", title: "Senior Independent AI Engineer / Architect", description: "Apply to join our vetted talent network with your LinkedIn, portfolio, and years of experience." };
const recruitment = { ...recruitmentBase, opportunityChannel: "human_opportunity_only", capabilityAssessment: { ...base.capabilityAssessment, selfEarningEligible: false, humanIdentityRequired: true }, verification: { ...classifySourceTruth(recruitmentBase, now), prohibitedContentClear: true, scamSignalsClear: true } };
const blocked = assessCandidateForAttempt(recruitment, { rootDir, now });
assert.strictEqual(blocked.draftable, false);
assert.match(blocked.reason, /GARUDA-deliverable|self-execution|Source truth gate/);

const summary = emptySummary(now, 180000);
assert.strictEqual(summary.externalSubmissionsPerformed, 0);
assert.strictEqual(summary.nextCycleAt, "2026-07-22T10:03:00.000Z");

console.log("Continuous revenue attempt eligibility and no-external-side-effect summary validation passed.");
