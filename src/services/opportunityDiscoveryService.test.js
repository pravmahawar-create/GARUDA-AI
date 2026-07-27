const assert = require("assert");
const { inspectCandidate, normalizeRemotiveJob, scoreCandidate, splitCandidateForDecisionPreservation, validateCandidateDecision } = require("./opportunityDiscoveryService");

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
assert.strictEqual(candidate.opportunityChannel, "human_opportunity_only");
assert.strictEqual(candidate.capabilityAssessment.selfEarningEligible, false);
assert.strictEqual(candidate.capabilityAssessment.humanIdentityRequired, true);

const remotiveSoftwareRole = normalizeRemotiveJob({
  id: 8,
  title: "Build a Node API automation",
  description: "Implement and test a backend software integration",
  company_name: "Example",
  url: "https://remotive.com/job/8",
  category: "contract_project",
  tags: ["Node", "API", "Testing"]
}, "507f1f77bcf86cd799439011");
assert.strictEqual(remotiveSoftwareRole.opportunityChannel, "human_opportunity_only");
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
assert.strictEqual(humanOpportunity.opportunityChannel, "human_opportunity_only");
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
assert.strictEqual(talentNetwork.opportunityChannel, "human_opportunity_only");
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
assert.strictEqual(safeUpdate.refreshable.opportunityChannel, "human_opportunity_only");

const { getProactiveBusinessBriefing } = require("./opportunityDiscoveryService");
getProactiveBusinessBriefing().then((briefing) => {
  assert.ok(briefing.greeting.includes("Good Morning"));
  assert.ok(Array.isArray(briefing.highestRevenuePotential));
  assert.ok(briefing.marketSummary.newOpportunitiesDiscoveredToday >= 0);
  console.log("Proactive Business Development Briefing test PASSED cleanly.");
  console.log("Opportunity discovery validation test passed.");
}).catch((err) => {
  console.error("Proactive briefing test failed:", err);
  process.exit(1);
});
