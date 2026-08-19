const assert = require("assert");
const { execute } = require("./executor");

(async () => {
  const result = await execute([{
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

  const skipped = await execute([{ task: "Run correction loop" }]);
  assert.strictEqual(skipped[0].status, "SKIPPED");

  console.log("Mother governed Engineering Loop execution validation passed.");
})().catch((err) => {
  console.error("Mother governed Engineering Loop execution validation FAILED:", err);
  process.exitCode = 1;
});