const assert = require("assert");
const { execute } = require("./executor");

(async () => {
  const result = await execute([{
    task: "Create architect plan for revenue workflow",
    architectureRequest: {
      goalId: "mother-architecture-test",
      goal: "Plan a bounded validator artifact",
      engineeringSpec: {
        template: "required_fields_validator",
        modulePath: "src/generated/architectExecution.js",
        testPath: "src/generated/architectExecution.test.js",
        requiredFields: ["id"]
      }
    }
  }]);
  assert.strictEqual(result[0].route, "architect");
  assert.strictEqual(result[0].engine, "Architect");
  assert.strictEqual(result[0].status, "SUCCESS");
  assert.strictEqual(result[0].result.output.governance.sourceWriteAllowed, false);
  assert.ok(result[0].result.output.engineeringHandoff);

  const skipped = await execute([{ task: "Create architecture plan" }]);
  assert.strictEqual(skipped[0].status, "SKIPPED");

  console.log("Mother Architect Brain execution validation passed.");
})().catch((err) => {
  console.error("Mother Architect Brain execution validation FAILED:", err);
  process.exitCode = 1;
});