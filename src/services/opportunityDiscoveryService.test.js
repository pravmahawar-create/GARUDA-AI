const assert = require("assert");
const { inspectCandidate, normalizeRemotiveJob, scoreCandidate, splitCandidateForDecisionPreservation, validateCandidateDecision } = require("./opportunityDiscoveryService");
const { candidatePrioritySortValue } = require("./opportunityDiscoveryService");

assert.strictEqual(inspectCandidate({ title: "Remote developer", url: "https://example.com/job" }).accepted, true);
assert.strictEqual(inspectCandidate({ title: "Online casino promoter", url: "https://example.com/job" }).accepted, false);
assert.strictEqual(inspectCandidate({ title: "Assistant", description: "Pay upfront registration fee", url: "https://example.com/job" }).accepted, false);
assert.strictEqual(inspectCandidate({ title: "Remote writer", url: "http://example.com/job" }).accepted, false);
assert.ok(scoreCandidate({ candidate_required_location: "Worldwide", salary: "$50k", tags: ["a", "b", "c"], publication_date: new Date().toISOString(), job_type: "full_time" }) >= 90);

const candidate = normalizeRemotiveJob({ id: 7, title: "<b>Remote Writer</b>", company_name: "Example", url: "https://remotive.com/job/7", candidate_required_location: "Worldwide", tags: ["Writing"], publication_date: new Date().toISOString() }, "507f1f77bcf86cd799439011");
assert.strictEqual(candidate.title, "Remote Writer");
assert.strictEqual(candidate.sourceAttribution, "Remotive");
assert.strictEqual(candidate.status, "ranked");
assert.strictEqual(candidate.requiresFounderApproval, true);
assert.strictEqual(candidate.opportunityChannel, "founder_garuda");
assert.strictEqual(candidate.earningMode, "PERMISSION_UNKNOWN");
assert.strictEqual(candidate.contractPermission, "UNKNOWN");
assert.strictEqual(candidate.capabilityAssessment.selfEarningEligible, false);
assert.strictEqual(candidate.capabilityAssessment.humanIdentityRequired, true);
assert.strictEqual(candidate.priority, "UNMEASURED");
assert.strictEqual(candidate.valueModel.status, "UNKNOWN");
assert.strictEqual(candidate.valueModel.bandPriority, "UNMEASURED");
assert.ok(Array.isArray(candidate.valueModel.factors) && candidate.valueModel.factors.length === 8);

const remotiveSoftwareRole = normalizeRemotiveJob({
  id: 8,
  title: "Build a Node API automation",
  description: "Implement and test a backend software integration",
  company_name: "Example",
  url: "https://remotive.com/job/8",
  category: "contract_project",
  tags: ["Node", "API", "Testing"]
}, "507f1f77bcf86cd799439011");
assert.strictEqual(remotiveSoftwareRole.opportunityChannel, "founder_garuda");
assert.strictEqual(remotiveSoftwareRole.earningMode, "PERMISSION_UNKNOWN");
assert.strictEqual(remotiveSoftwareRole.capabilityAssessment.selfEarningEligible, false);
assert.strictEqual(remotiveSoftwareRole.capabilityAssessment.humanIdentityRequired, true);
assert.strictEqual(remotiveSoftwareRole.verification.listingKind, "human_role_listing");
assert.strictEqual(remotiveSoftwareRole.verification.garudaExecutionEligible, false);

const humanOpportunity = normalizeRemotiveJob({
  id: 9,
  title: "Full-time software employee",
  description: "Send CV and attend an interview",
  company_name: "Example",
  url: "https://remotive.com/job/9",
  job_type: "full_time",
  tags: ["Software"]
}, "507f1f77bcf86cd799439011");
assert.strictEqual(humanOpportunity.opportunityChannel, "founder_garuda");
assert.strictEqual(humanOpportunity.earningMode, "PERMISSION_UNKNOWN");
assert.strictEqual(humanOpportunity.capabilityAssessment.humanIdentityRequired, true);
const talentNetwork = normalizeRemotiveJob({
  id: 10,
  title: "Senior Independent AI Engineer / Architect",
  description: "Apply to join our vetted talent network with your LinkedIn, portfolio, years of experience, and a technical evaluation.",
  company_name: "A.Team",
  url: "https://remotive.com/remote-jobs/software-dev/ateam-ai",
  job_type: "contract",
  tags: ["AI", "Architecture"]
}, "507f1f77bcf86cd799439011");
assert.strictEqual(talentNetwork.opportunityChannel, "founder_garuda");
assert.strictEqual(talentNetwork.earningMode, "PERMISSION_UNKNOWN");
assert.strictEqual(talentNetwork.verification.listingKind, "talent_network_recruitment");
assert.ok(talentNetwork.verification.rejectionReasons.includes("talent_network_recruitment_not_client_mission"));
assert.strictEqual(validateCandidateDecision("approved", "true"), "approved");
assert.strictEqual(validateCandidateDecision("dismissed", true), "dismissed");
assert.throws(() => validateCandidateDecision("approved", false), /Founder approval/);
assert.throws(() => validateCandidateDecision("executed", true), /approved or dismissed/);
const safeUpdate = splitCandidateForDecisionPreservation(candidate);
assert.strictEqual(safeUpdate.refreshable.status, undefined);
assert.strictEqual(safeUpdate.insertOnly.status, "ranked");
assert.strictEqual(safeUpdate.insertOnly.requiresFounderApproval, true);
assert.strictEqual(safeUpdate.refreshable.opportunityChannel, "founder_garuda");
assert.strictEqual(safeUpdate.refreshable.earningMode, "PERMISSION_UNKNOWN");

const { getProactiveBusinessBriefing } = require("./opportunityDiscoveryService");
getProactiveBusinessBriefing().then((briefing) => {
  assert.ok(briefing.greeting.includes("Good Morning"));
  assert.ok(Array.isArray(briefing.highestRevenuePotential));
  assert.ok(briefing.marketSummary.newOpportunitiesDiscoveredToday >= 0);
  console.log("Proactive Business Development Briefing test PASSED cleanly.");
  return runListCandidatesTest();
}).then(() => {
  console.log("Opportunity discovery validation test passed.");
}).catch((err) => {
  console.error("Proactive briefing test failed:", err);
  process.exit(1);
});

// -- priority-aware candidate sorting (Fix 4) --
const nowIso = new Date().toISOString();
const wellVerifiedBuyer = {
  status: "ranked",
  opportunityChannel: "garuda_deliverable",
  priority: "NORMAL",
  verification: { sourceVerified: true, directClientWorkEvidence: true, garudaExecutionEligible: true },
  valueModel: { status: "ESTIMATED", estimatedINR: 15000, rank: 70 },
  score: 80,
  publishedAt: nowIso
};
const weakEvidenceHighValue = {
  status: "ranked",
  opportunityChannel: "no_verified_capability_match",
  priority: "STRATEGIC",
  verification: { sourceVerified: false },
  valueModel: { status: "ESTIMATED", estimatedINR: 200000, rank: 40 },
  score: 95,
  publishedAt: nowIso
};
assert.ok(candidatePrioritySortValue(wellVerifiedBuyer) > candidatePrioritySortValue(weakEvidenceHighValue),
  "a well-verified low-band buyer must outrank a weak-evidence high-value listing");

const approvedCandidate = { ...wellVerifiedBuyer, status: "approved" };
assert.ok(candidatePrioritySortValue(approvedCandidate) > candidatePrioritySortValue(wellVerifiedBuyer),
  "founder-approved/actionable state must sort first");

const unmeasuredCandidate = {
  status: "ranked",
  opportunityChannel: "human_opportunity_only",
  priority: "UNMEASURED",
  valueModel: { status: "UNKNOWN", estimatedINR: null },
  score: 99,
  publishedAt: nowIso
};
assert.ok(candidatePrioritySortValue(wellVerifiedBuyer) > candidatePrioritySortValue(unmeasuredCandidate),
  "UNMEASURED/UNKNOWN must stay below measured candidates regardless of raw score");
assert.strictEqual(candidatePrioritySortValue({ ...unmeasuredCandidate, priority: "UNKNOWN" }) >= 0, true);

async function runListCandidatesTest() {
  const { DiscoveryCandidate } = require("../models/DiscoveryCandidate");
  const { listCandidates } = require("./opportunityDiscoveryService");
  const originalFind = DiscoveryCandidate.find;
  DiscoveryCandidate.find = async () => [
    { status: "ranked", opportunityChannel: "no_verified_capability_match", priority: "STRATEGIC", score: 95, publishedAt: nowIso, valueModel: { status: "ESTIMATED", estimatedINR: 200000, rank: 40 }, verification: {}, toJSON() { return this; } },
    { status: "ranked", opportunityChannel: "garuda_deliverable", priority: "NORMAL", score: 80, publishedAt: nowIso, valueModel: { status: "ESTIMATED", estimatedINR: 15000, rank: 70 }, verification: { sourceVerified: true }, toJSON() { return this; } },
    { status: "ranked", opportunityChannel: "human_opportunity_only", priority: "UNMEASURED", score: 99, publishedAt: nowIso, valueModel: { status: "UNKNOWN", estimatedINR: null }, verification: {}, toJSON() { return this; } }
  ];
  try {
    const items = await listCandidates({});
    assert.strictEqual(items.length, 3);
    assert.strictEqual(items[0].opportunityChannel, "garuda_deliverable", "verified buyer sorts first");
    assert.strictEqual(items[0].priority, "NORMAL");
    const verifiedIdx = items.findIndex((i) => i.opportunityChannel === "garuda_deliverable");
    const unmeasuredIdx = items.findIndex((i) => i.priority === "UNMEASURED");
    assert.ok(unmeasuredIdx > verifiedIdx, "UNMEASURED must not outrank the well-verified buyer");
  } finally {
    DiscoveryCandidate.find = originalFind;
  }
}
