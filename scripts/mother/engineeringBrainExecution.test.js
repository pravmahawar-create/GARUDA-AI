const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execute } = require("./executor");

(async () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "garuda-mother-engineering-"));
  const previousCwd = process.cwd();
  process.chdir(rootDir);
  try {
    const [executed] = await execute([{
      step: 1,
      task: "Create engineering artifact scaffold validator",
      status: "PENDING",
      artifactSpec: {
        template: "required_fields_validator",
        modulePath: "src/generated/missionValidator.js",
        testPath: "src/generated/missionValidator.test.js",
        requiredFields: ["title", "targetAmount"]
      }
    }]);
    assert.strictEqual(executed.route, "engineering");
    assert.strictEqual(executed.engine, "Engineering");
    assert.strictEqual(executed.status, "SUCCESS");
    assert.strictEqual(executed.result.output.status, "ARTIFACT_READY_FOR_REVIEW");
    assert.strictEqual(executed.result.output.sourceTreeModified, false);
    assert.ok(executed.result.output.evidence.every((item) => item.status === "PASSED"));

    const [missingSpec] = await execute([{ step: 1, task: "Create engineering artifact", status: "PENDING" }]);
    assert.strictEqual(missingSpec.status, "SKIPPED");
    assert.strictEqual(missingSpec.reason, "engineering_task_requires_artifact_spec");
  } finally {
    process.chdir(previousCwd);
  }

  console.log("Mother Engineering Brain execution validation passed.");
})().catch((err) => {
  console.error("Mother Engineering Brain execution validation FAILED:", err);
  process.exitCode = 1;
});