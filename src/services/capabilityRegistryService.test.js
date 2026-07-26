const assert = require("assert");
const path = require("path");
const registry = require("./capabilityRegistryService");
const orchestrator = require("./revenueOrchestratorService");

const rootDir = path.resolve(__dirname, "../..");
const capabilities = registry.listCapabilities({}, { rootDir });
const summary = registry.getRegistrySummary({ rootDir });

assert.strictEqual(capabilities.length, 14);
assert.strictEqual(summary.verified, 14);
assert.strictEqual(summary.partial, 0);
assert.strictEqual(summary.eligibleForMatching, 14);
assert.ok(capabilities.every((item) => item.evidence.length > 0));
assert.ok(capabilities.every((item) => ["verified", "partial", "planned"].includes(item.readiness)));

const softwareMatch = orchestrator.matchDemand({
  title: "Build a Node API automation",
  description: "Implement and test a backend software integration",
  tags: ["node", "api", "testing"]
}, { rootDir, minimumScore: 20 });

assert.strictEqual(softwareMatch.selfEarningEligible, true);
assert.strictEqual(softwareMatch.humanIdentityRequired, false);
assert.strictEqual(softwareMatch.matches[0].universe, "engineering");
assert.strictEqual(softwareMatch.automaticApplicationAllowed, false);

const humanJob = orchestrator.matchDemand({
  title: "Full-time software employee",
  description: "Send CV and attend an interview"
}, { rootDir, minimumScore: 20 });

assert.strictEqual(humanJob.selfEarningEligible, false);
assert.strictEqual(humanJob.humanIdentityRequired, true);
assert.strictEqual(humanJob.decision, "human_opportunity_channel_only");

const talentNetwork = orchestrator.matchDemand({
  title: "Senior Independent AI Engineer / Architect",
  description: "Apply to join a vetted talent network using your LinkedIn, portfolio, years of experience, and technical evaluation"
}, { rootDir, minimumScore: 20 });
assert.strictEqual(talentNetwork.selfEarningEligible, false);
assert.strictEqual(talentNetwork.humanIdentityRequired, true);

const unmatched = orchestrator.matchDemand({
  title: "Specialist underwater welding"
}, { rootDir, minimumScore: 50 });

assert.strictEqual(unmatched.selfEarningEligible, false);
assert.strictEqual(unmatched.decision, "no_verified_capability_match");

console.log("Capability registry and revenue orchestrator validation passed.");
