const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const EngineeringBrain = require("./EngineeringBrain");
const ReviewerBrain = require("./ReviewerBrain");
const { evidenceHash } = require("./ReviewerBrain");

function artifact() {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "garuda-review-root-"));
  return new EngineeringBrain({ rootDir }).build({
    template: "required_fields_validator",
    modulePath: "src/generated/reviewValidator.js",
    testPath: "src/generated/reviewValidator.test.js",
    requiredFields: ["id"]
  });
}

const reviewer = new ReviewerBrain();
const approved = reviewer.review(artifact());
assert.strictEqual(approved.verdict, "APPROVE");
assert.strictEqual(approved.authorizesSourceApply, false);
assert.strictEqual(approved.authorizesCommitPushDeploy, false);
assert.strictEqual(approved.founderApprovalStillRequired, true);
assert.match(approved.reviewId, /^[a-f0-9]{64}$/);

const failed = artifact();
failed.evidence[0].status = "FAILED";
failed.evidence[0].exitCode = 1;
failed.evidence[0].evidenceId = evidenceHash(failed.evidence[0]);
assert.strictEqual(reviewer.review(failed).verdict, "REQUEST_CHANGES");

const tampered = artifact();
tampered.patch += "tampered";
assert.strictEqual(reviewer.review(tampered).verdict, "REJECT");

const authorityLeak = artifact();
authorityLeak.commitPushDeployAllowed = true;
assert.strictEqual(reviewer.review(authorityLeak).verdict, "REJECT");

console.log("Reviewer Brain independent evidence validation passed.");
