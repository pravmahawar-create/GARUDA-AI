const assert = require("assert");
const { execute } = require("./executor");

(async () => {
  const [executed] = await execute([{
    step: 1,
    task: "Run tests with execution evidence",
    status: "PENDING",
    testFiles: ["src/services/capabilityRegistryService.test.js"]
  }]);

  assert.strictEqual(executed.route, "test");
  assert.strictEqual(executed.engine, "Test");
  assert.strictEqual(executed.status, "SUCCESS");
  assert.strictEqual(executed.result.output.status, "PASSED");
  assert.strictEqual(executed.result.output.evidence.length, 1);
  assert.strictEqual(executed.result.output.evidence[0].shellUsed, false);
  assert.match(executed.result.output.evidence[0].evidenceId, /^[a-f0-9]{64}$/);

  const [missingTarget] = await execute([{ step: 1, task: "Run tests", status: "PENDING" }]);
  assert.strictEqual(missingTarget.status, "SKIPPED");
  assert.strictEqual(missingTarget.reason, "test_task_requires_explicit_test_files");

  console.log("Mother real Tester Brain execution validation passed.");
})().catch((err) => {
  console.error("Mother real Tester Brain execution validation FAILED:", err);
  process.exitCode = 1;
});