const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const EngineeringBrain = require("../dev-agent/core/EngineeringBrain");
const { execute } = require("./executor");

const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "garuda-mother-review-"));
const reviewInput = new EngineeringBrain({ rootDir }).build({
  template: "required_fields_validator",
  modulePath: "src/generated/motherReview.js",
  testPath: "src/generated/motherReview.test.js",
  requiredFields: ["missionId"]
});
const reviewed = execute([{ task: "Review engineering artifact", reviewInput }]);
assert.strictEqual(reviewed[0].route, "review");
assert.strictEqual(reviewed[0].engine, "Reviewer");
assert.strictEqual(reviewed[0].status, "SUCCESS");
assert.strictEqual(reviewed[0].result.output.verdict, "APPROVE");
assert.strictEqual(reviewed[0].result.output.authorizesSourceApply, false);

const skipped = execute([{ task: "Review engineering artifact" }]);
assert.strictEqual(skipped[0].status, "SKIPPED");

console.log("Mother Reviewer Brain execution validation passed.");
