const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const EngineeringBrain = require("./EngineeringBrain");

const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "garuda-engineering-root-"));
const brain = new EngineeringBrain({ rootDir });
const result = brain.build({
  template: "required_fields_validator",
  modulePath: "src/generated/customerValidator.js",
  testPath: "src/generated/customerValidator.test.js",
  requiredFields: ["name", "email"]
});

assert.strictEqual(result.status, "ARTIFACT_READY_FOR_REVIEW");
assert.strictEqual(result.artifacts.length, 2);
assert.strictEqual(result.evidence.length, 3);
assert.ok(result.evidence.every((item) => item.status === "PASSED"));
assert.strictEqual(result.sourceTreeModified, false);
assert.strictEqual(result.requiresFounderApprovalToApply, true);
assert.strictEqual(result.commitPushDeployAllowed, false);
assert.match(result.patch, /new file mode 100644/);
assert.match(result.patch, /src\/generated\/customerValidator\.js/);
assert.match(result.patchSha256, /^[a-f0-9]{64}$/);
assert.strictEqual(fs.existsSync(path.join(rootDir, "src/generated/customerValidator.js")), false);
const patchPath = path.join(rootDir, "engineering-artifact.patch");
fs.writeFileSync(patchPath, result.patch, "utf8");
const patchCheck = spawnSync("git", ["apply", "--check", patchPath], { cwd: rootDir, shell: false, encoding: "utf8" });
assert.strictEqual(patchCheck.status, 0, patchCheck.stderr);

fs.mkdirSync(path.join(rootDir, "src/generated"), { recursive: true });
fs.writeFileSync(path.join(rootDir, "src/generated/existing.js"), "module.exports = {};\n");
assert.throws(() => brain.build({ template: "required_fields_validator", modulePath: "src/generated/existing.js", testPath: "src/generated/existing.test.js", requiredFields: ["id"] }), /existing target/);
assert.throws(() => brain.build({ template: "required_fields_validator", modulePath: "../escape.js", testPath: "src/generated/escape.test.js", requiredFields: ["id"] }), /approved workspace/);
assert.throws(() => brain.build({ template: "arbitrary_code", modulePath: "src/generated/code.js", testPath: "src/generated/code.test.js", requiredFields: ["id"] }), /only supports/);

console.log("Engineering Brain isolated artifact validation passed.");
