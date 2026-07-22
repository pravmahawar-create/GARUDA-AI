const assert = require("assert");
const service = require("./revenueSourceTruthService");

const now = new Date("2026-07-22T10:00:00.000Z");
const network = {
  source: "remotive",
  externalId: "ateam-ai",
  title: "Senior Independent AI Engineer / Architect",
  company: "A.Team",
  description: "Apply to join our vetted talent network. Share your LinkedIn, portfolio, years of experience, and attend a technical evaluation.",
  category: "contract",
  url: "https://remotive.com/remote-jobs/software-dev/ateam-ai",
  sourceAttribution: "Remotive"
};
const networkTruth = service.classifySourceTruth(network, now);
assert.strictEqual(networkTruth.listingKind, "talent_network_recruitment");
assert.strictEqual(networkTruth.humanIdentityGateClear, false);
assert.strictEqual(networkTruth.garudaExecutionEligible, false);
assert.ok(networkTruth.rejectionReasons.includes("talent_network_recruitment_not_client_mission"));

const direct = {
  source: "verified_client_portal",
  externalId: "rfp-42",
  title: "Build and test a bounded Node API",
  company: "Verified Client",
  description: "Request for proposal with a fixed price, scope of work, project milestones, delivery deadline, and acceptance criteria.",
  category: "contract_project",
  url: "https://client.example/work/rfp-42",
  sourceAttribution: "Verified client portal",
  tags: ["Node", "API", "Testing"]
};
const directTruth = service.classifySourceTruth(direct, now);
const verifiedDirect = { ...direct, verification: directTruth };
assert.strictEqual(directTruth.listingKind, "specific_client_work");
assert.strictEqual(directTruth.garudaExecutionEligible, true);
assert.doesNotThrow(() => service.assertCurrentSourceTruth(verifiedDirect, new Date("2026-07-22T11:00:00.000Z")));
assert.throws(() => service.assertCurrentSourceTruth({ ...verifiedDirect, title: "Changed title" }, new Date("2026-07-22T11:00:00.000Z")), /listing changed/);
assert.throws(() => service.assertCurrentSourceTruth(verifiedDirect, new Date("2026-07-24T11:00:00.000Z")), /stale/);

console.log("Revenue source truth classification, snapshot binding, and freshness validation passed.");
