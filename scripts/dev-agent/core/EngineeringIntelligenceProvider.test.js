const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const EngineeringBrain = require("./EngineeringBrain");
const EngineeringIntelligenceProvider = require("./EngineeringIntelligenceProvider");

class SafeFixtureProvider extends EngineeringIntelligenceProvider {
  constructor() { super({ id: "fixture-provider", mode: "local" }); }
  propose(request) {
    return {
      schemaVersion: "1.0",
      intentId: request.intentId,
      summary: "Generate a bounded formatter with a real test.",
      confidence: 0.82,
      artifactSpec: {
        template: "required_fields_validator",
        modulePath: "src/generated/providerValidator.js",
        testPath: "src/generated/providerValidator.test.js",
        requiredFields: ["name", "email"]
      }
    };
  }
}

const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "garuda-intelligence-root-"));
const result = new EngineeringBrain({ rootDir, intelligenceProvider: new SafeFixtureProvider() }).buildFromIntelligence({ intentId: "intent-001", goal: "Create label formatter" });
assert.strictEqual(result.status, "ARTIFACT_READY_FOR_REVIEW");
assert.strictEqual(result.intelligenceUsed, true);
assert.strictEqual(result.provider.id, "fixture-provider");
assert.ok(result.evidence.every((item) => item.status === "PASSED"));
assert.strictEqual(result.sourceTreeModified, false);
assert.strictEqual(result.requiresFounderApprovalToApply, true);
assert.strictEqual(result.commitPushDeployAllowed, false);
assert.strictEqual(result.proposalPolicy.rawCodeAccepted, false);
assert.strictEqual(result.proposalConfidence, 0.82);
assert.strictEqual(fs.existsSync(path.join(rootDir, "src/generated/providerValidator.js")), false);

class UnsafeFixtureProvider extends SafeFixtureProvider {
  propose() {
    const proposal = super.propose({ intentId: "unsafe" });
    proposal.artifactSpec = { template: "raw_code", content: "untrusted code" };
    return proposal;
  }
}
assert.throws(() => new EngineeringBrain({ rootDir, intelligenceProvider: new UnsafeFixtureProvider() }).buildFromIntelligence({ intentId: "unsafe" }), /not allow-listed/);
assert.throws(() => new EngineeringBrain({ rootDir }).buildFromIntelligence({ intentId: "missing" }), /not configured/);

console.log("Engineering intelligence provider isolation validation passed.");
