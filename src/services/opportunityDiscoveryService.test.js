const assert = require("assert");
const { inspectCandidate, normalizeRemotiveJob, scoreCandidate, validateCandidateDecision } = require("./opportunityDiscoveryService");

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
assert.strictEqual(validateCandidateDecision("approved", "true"), "approved");
assert.strictEqual(validateCandidateDecision("dismissed", true), "dismissed");
assert.throws(() => validateCandidateDecision("approved", false), /Founder approval/);
assert.throws(() => validateCandidateDecision("executed", true), /approved or dismissed/);

console.log("Opportunity discovery validation test passed.");
