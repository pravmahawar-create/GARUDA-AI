const assert = require("assert");
const path = require("path");
const { normalizeRemotiveJob } = require("./opportunityDiscoveryService");
const { validateApprovedCandidate } = require("./revenueExecutionMissionService");
const { classifySourceTruth } = require("./revenueSourceTruthService");
const { DiscoveryCandidate, resolveContractPermission, resolveEarningMode } = require("../models/DiscoveryCandidate");

const rootDir = path.resolve(__dirname, "../..");
const missionId = "507f1f77bcf86cd799439011";
const VALID_ID = "507f1f77bcf86cd799439011";

const softwareRoleInput = {
  id: 20,
  title: "Build a Node API automation",
  description: "Implement and test a backend software integration",
  company_name: "Example",
  url: "https://remotive.com/job/20",
  category: "contract_project",
  tags: ["Node", "API", "Testing"]
};

const roleRecord = { source: "remotive", externalId: "role-1", title: "Full-time Senior Node.js Developer Position", company: "Acme Corp", description: "Seeking a senior Node.js backend developer for project execution and technical deliverables.", category: "full_time_job", url: "https://remotive.com/job/role-1", sourceAttribution: "Remotive" };
const humanRoleTruth = { ...classifySourceTruth(roleRecord), verifiedAt: "2026-07-22T09:00:00.000Z", prohibitedContentClear: true, scamSignalsClear: true };

function founderCandidate(overrides = {}) {
  return {
    ...roleRecord,
    _id: VALID_ID,
    missionId,
    status: "approved",
    opportunityChannel: "founder_garuda",
    score: 88,
    capabilityAssessment: { selfEarningEligible: false, humanIdentityRequired: true, matches: [{ capabilityId: "engineering.software-implementation", universe: "engineering", name: "Governed software implementation", score: 82 }] },
    verification: humanRoleTruth,
    decision: { actor: "founder", decidedAt: "2026-07-22T10:00:00.000Z" },
    ...overrides
  };
}

function directClientCandidate(overrides = {}) {
  const record = { source: "verified_client_portal", externalId: "rfp-42", title: "Build and test a bounded Node API", company: "Verified Client", description: "Request for proposal with a fixed price, scope of work, project milestone, delivery deadline, and acceptance criteria.", category: "contract_project", url: "https://client.example/work/rfp-42", sourceAttribution: "Verified client portal", tags: ["Node", "API", "Testing"] };
  return {
    ...record,
    _id: VALID_ID,
    missionId,
    status: "approved",
    opportunityChannel: "garuda_deliverable",
    score: 92,
    capabilityAssessment: { selfEarningEligible: true, humanIdentityRequired: false, matches: [{ capabilityId: "engineering.software-implementation", universe: "engineering", name: "Governed software implementation", score: 92 }] },
    verification: { ...classifySourceTruth(record), verifiedAt: "2026-07-22T09:00:00.000Z", prohibitedContentClear: true, scamSignalsClear: true },
    decision: { actor: "founder", decidedAt: "2026-07-22T10:00:00.000Z" },
    ...overrides
  };
}

// A. Capability != engagement permission: a human-role listing with a verified
//    capability match is classified founder_garuda + PERMISSION_UNKNOWN. It is
//    NOT auto-rejected, but it never auto-executes.
const roleCandidate = normalizeRemotiveJob(softwareRoleInput, missionId);
assert.strictEqual(roleCandidate.opportunityChannel, "founder_garuda");
assert.strictEqual(roleCandidate.earningMode, "PERMISSION_UNKNOWN");
assert.strictEqual(roleCandidate.contractPermission, "UNKNOWN");
assert.strictEqual(roleCandidate.status, "ranked", "capability-matched human role must not be auto-rejected");
assert.strictEqual(roleCandidate.capabilityAssessment.selfEarningEligible, false, "selfEarningEligible false != ineligible");
assert.strictEqual(roleCandidate.capabilityAssessment.humanIdentityRequired, true);
assert.strictEqual(roleCandidate.requiresFounderApproval, true);
assert.throws(() => validateApprovedCandidate(founderCandidate({ earningMode: "PERMISSION_UNKNOWN", contractPermission: "UNKNOWN" }), { rootDir, now: new Date("2026-07-22T11:00:00.000Z") }), /PERMISSION_UNKNOWN|permission not established/, "PERMISSION_UNKNOWN must never execute");

// B. Direct client work (no human identity, specific client work) -> DIRECT_GARUDA.
const direct = directClientCandidate();
assert.strictEqual(resolveEarningMode(direct), "DIRECT_GARUDA");
assert.strictEqual(resolveContractPermission(direct), "UNKNOWN");
assert.doesNotThrow(() => validateApprovedCandidate(direct, { rootDir, now: new Date("2026-07-22T11:00:00.000Z") }));

// C. No capability match -> NOT_ELIGIBLE (not executed; re-evaluable, not permanent).
const unmatched = normalizeRemotiveJob({ id: 21, title: "Certified accountant for tax filing", company_name: "Example", url: "https://remotive.com/job/21", candidate_required_location: "Worldwide" }, missionId);
assert.strictEqual(unmatched.opportunityChannel, "no_verified_capability_match");
assert.strictEqual(unmatched.earningMode, "NOT_ELIGIBLE");
assert.strictEqual(resolveEarningMode(unmatched), "NOT_ELIGIBLE");
assert.throws(() => validateApprovedCandidate(founderCandidate({ opportunityChannel: "no_verified_capability_match", earningMode: "NOT_ELIGIBLE", capabilityAssessment: { selfEarningEligible: false, humanIdentityRequired: false, matches: [] } }), { rootDir }), /GARUDA-deliverable|founder-engaged/);

// D. Safety rejection: scam/prohibited content overrides capability -> NOT_ELIGIBLE.
const scam = normalizeRemotiveJob({ id: 22, title: "Remote developer", description: "Pay upfront registration fee to start", company_name: "Example", url: "https://remotive.com/job/22" }, missionId);
assert.strictEqual(scam.status, "rejected");
assert.strictEqual(scam.earningMode, "NOT_ELIGIBLE");
assert.ok(scam.rejectionReasons.includes("scam_signal_detected"));

// E. PERMISSION_UNKNOWN founder-engaged candidate: mission gate blocks external execution.
assert.throws(() => validateApprovedCandidate(founderCandidate({ earningMode: "PERMISSION_UNKNOWN", contractPermission: "UNKNOWN" }), { rootDir, now: new Date("2026-07-22T11:00:00.000Z") }), /PERMISSION_UNKNOWN/);

// F. FOUNDER_ENGAGED_GARUDA_ASSISTED founder-engaged candidate: mission gate accepts.
assert.doesNotThrow(() => validateApprovedCandidate(founderCandidate({ earningMode: "FOUNDER_ENGAGED_GARUDA_ASSISTED", contractPermission: "UNKNOWN" }), { rootDir, now: new Date("2026-07-22T11:00:00.000Z") }));

// G. PROHIBITED contract permission cannot be overridden by Founder approval.
const { decideCandidate } = require("./opportunityDiscoveryService");
const originalFindById = DiscoveryCandidate.findById;
DiscoveryCandidate.findById = async () => ({
  status: "ranked",
  opportunityChannel: "founder_garuda",
  contractPermission: "PROHIBITED",
  valueModel: { estimatedINR: 50000 },
  verification: { garudaExecutionEligible: false },
  toJSON() { return { ...this }; },
  async save() {}
});
decideCandidate(VALID_ID, { status: "approved" }, { founderApproved: true })
  .then(() => { throw new Error("PROHIBITED approval should have been rejected"); })
  .catch((err) => {
    if (!/prohibits/i.test(String(err.message || ""))) {
      console.error("G FAILED:", err);
      process.exit(1);
    }
    DiscoveryCandidate.findById = originalFindById;
    runLegacyTests();
  });

function runLegacyTests() {
  // H. Legacy records without earningMode resolve deterministically and never
  //    auto-execute unless capability + direct channel evidence say otherwise.
  const legacyDirect = { opportunityChannel: "garuda_deliverable", capabilityAssessment: { selfEarningEligible: true, humanIdentityRequired: false, matches: [{ capabilityId: "engineering.software-implementation" }] } };
  assert.strictEqual(resolveEarningMode(legacyDirect), "DIRECT_GARUDA");
  const legacyFounder = { opportunityChannel: "founder_garuda", capabilityAssessment: { humanIdentityRequired: true, matches: [{ capabilityId: "engineering.software-implementation" }] } };
  assert.strictEqual(resolveEarningMode(legacyFounder), "PERMISSION_UNKNOWN");
  const legacyHumanOnly = { opportunityChannel: "human_opportunity_only", capabilityAssessment: { humanIdentityRequired: true, matches: [{ capabilityId: "engineering.software-implementation" }] } };
  assert.strictEqual(resolveEarningMode(legacyHumanOnly), "PERMISSION_UNKNOWN");
  assert.strictEqual(resolveContractPermission({}), "UNKNOWN");
  assert.throws(() => validateApprovedCandidate(founderCandidate({ earningMode: undefined, contractPermission: undefined }), { rootDir, now: new Date("2026-07-22T11:00:00.000Z") }), /PERMISSION_UNKNOWN/, "legacy founder_garuda must not auto-execute");

  console.log("Earning-mode governance matrix (A-H) validation passed.");
}