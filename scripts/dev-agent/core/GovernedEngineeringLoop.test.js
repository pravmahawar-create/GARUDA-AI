const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const GovernedEngineeringLoop = require("./GovernedEngineeringLoop");
const EngineeringRevisionProvider = require("./EngineeringRevisionProvider");

function request() {
  return {
    goalId: "bounded-loop",
    goal: "Create a bounded loop validator",
    engineeringSpec: {
      template: "required_fields_validator",
      modulePath: "src/generated/loopValidator.js",
      testPath: "src/generated/loopValidator.test.js",
      requiredFields: ["id"]
    }
  };
}

const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "garuda-loop-root-"));
const approved = new GovernedEngineeringLoop({ rootDir }).run(request());
assert.strictEqual(approved.status, "READY_FOR_FOUNDER_REVIEW");
assert.strictEqual(approved.attempts.length, 1);
assert.strictEqual(approved.finalReview.verdict, "APPROVE");
assert.strictEqual(approved.authorizesSourceApply, false);
assert.strictEqual(approved.authorizesCommitPushDeploy, false);
assert.strictEqual(fs.existsSync(path.join(rootDir, "src/generated/loopValidator.js")), false);

class FixtureRevisionProvider extends EngineeringRevisionProvider {
  constructor() { super({ id: "fixture-revision" }); this.calls = 0; }
  revise(context) {
    this.calls += 1;
    return {
      schemaVersion: "1.0",
      intentId: `${context.goalId}-revision-${context.attempt}`,
      summary: "Bounded structured correction",
      artifactSpec: { ...context.previousSpec, requiredFields: [...context.previousSpec.requiredFields, `revision_${this.calls}`] }
    };
  }
}
const revisionProvider = new FixtureRevisionProvider();
let reviewCount = 0;
const requestChangesThenApprove = {
  review(engineering) {
    reviewCount += 1;
    if (reviewCount === 1) return { verdict: "REQUEST_CHANGES", reviewId: "review-one", requestedChanges: ["add_revision_field"], rejectReasons: [] };
    const ReviewerBrain = require("./ReviewerBrain");
    return new ReviewerBrain().review(engineering);
  }
};
const revised = new GovernedEngineeringLoop({ rootDir, reviewerBrain: requestChangesThenApprove, revisionProvider, maxAttempts: 3 }).run(request());
assert.strictEqual(revised.status, "READY_FOR_FOUNDER_REVIEW");
assert.strictEqual(revised.attempts.length, 2);
assert.strictEqual(revisionProvider.calls, 1);
assert.deepStrictEqual(revised.attempts[1].specification.requiredFields, ["id", "revision_1"]);

const rejected = new GovernedEngineeringLoop({
  rootDir,
  revisionProvider,
  reviewerBrain: { review: () => ({ verdict: "REJECT", reviewId: "reject", requestedChanges: [], rejectReasons: ["integrity_failure"] }) }
}).run(request());
assert.strictEqual(rejected.status, "REJECTED");
assert.strictEqual(rejected.attempts.length, 1);

const changesRequired = new GovernedEngineeringLoop({
  rootDir,
  reviewerBrain: { review: () => ({ verdict: "REQUEST_CHANGES", reviewId: "changes", requestedChanges: ["needs_revision"], rejectReasons: [] }) }
}).run(request());
assert.strictEqual(changesRequired.status, "CHANGES_REQUIRED");
assert.strictEqual(changesRequired.attempts.length, 1);

const alwaysChanges = { review: () => ({ verdict: "REQUEST_CHANGES", reviewId: "again", requestedChanges: ["revise"], rejectReasons: [] }) };
const cappedProvider = new FixtureRevisionProvider();
const capped = new GovernedEngineeringLoop({ rootDir, reviewerBrain: alwaysChanges, revisionProvider: cappedProvider, maxAttempts: 99 }).run(request());
assert.strictEqual(capped.maxAttempts, 3);
assert.strictEqual(capped.attempts.length, 3);
assert.strictEqual(capped.status, "CHANGES_REQUIRED");

const unsafeAuthorityProvider = {
  getMetadata: () => ({ id: "unsafe", directWriteAllowed: true, commandExecutionAllowed: false, gitActionsAllowed: false }),
  revise: () => ({})
};
assert.throws(
  () => new GovernedEngineeringLoop({ rootDir, reviewerBrain: alwaysChanges, revisionProvider: unsafeAuthorityProvider }).run(request()),
  /violates capability isolation/
);

class RawCodeRevisionProvider extends EngineeringRevisionProvider {
  constructor() { super({ id: "raw-code-revision" }); }
  revise(context) {
    return { schemaVersion: "1.0", intentId: `${context.goalId}-raw`, artifactSpec: { template: "raw_code", content: "untrusted" } };
  }
}
assert.throws(
  () => new GovernedEngineeringLoop({ rootDir, reviewerBrain: alwaysChanges, revisionProvider: new RawCodeRevisionProvider() }).run(request()),
  /not allow-listed/
);

console.log("Governed Engineering correction loop validation passed.");
