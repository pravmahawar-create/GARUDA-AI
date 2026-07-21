const assert = require("assert");
const { execute } = require("./executor");

const result = execute([{
  task: "Run governed engineering loop",
  maxAttempts: 2,
  loopRequest: {
    goalId: "mother-loop",
    goal: "Create a governed Mother loop validator",
    engineeringSpec: {
      template: "required_fields_validator",
      modulePath: "src/generated/motherLoop.js",
      testPath: "src/generated/motherLoop.test.js",
      requiredFields: ["missionId"]
    }
  }
}]);
assert.strictEqual(result[0].route, "engineering_loop");
assert.strictEqual(result[0].status, "SUCCESS");
assert.strictEqual(result[0].result.output.status, "READY_FOR_FOUNDER_REVIEW");
assert.strictEqual(result[0].result.output.authorizesSourceApply, false);

const skipped = execute([{ task: "Run correction loop" }]);
assert.strictEqual(skipped[0].status, "SKIPPED");

console.log("Mother governed Engineering Loop execution validation passed.");
