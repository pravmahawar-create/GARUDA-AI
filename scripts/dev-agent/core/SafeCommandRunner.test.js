const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const SafeCommandRunner = require("./SafeCommandRunner");

const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "garuda-safe-runner-"));
fs.writeFileSync(path.join(rootDir, "valid.js"), "module.exports = 1;\n");
fs.writeFileSync(path.join(rootDir, "invalid.js"), "module.exports = ;\n");
fs.writeFileSync(path.join(rootDir, "passing.test.js"), "process.exit(0);\n");
fs.writeFileSync(path.join(rootDir, "failing.test.js"), "process.exit(3);\n");
fs.writeFileSync(path.join(rootDir, "slow.test.js"), "setTimeout(() => process.exit(0), 5000);\n");

const runner = new SafeCommandRunner({ rootDir, timeoutMs: 1000 });
const valid = runner.runSyntaxCheck("valid.js");
const invalid = runner.runSyntaxCheck("invalid.js");
const passing = runner.runNodeTest("passing.test.js");
const failing = runner.runNodeTest("failing.test.js");
const slow = runner.runNodeTest("slow.test.js");

assert.strictEqual(valid.status, "PASSED");
assert.strictEqual(valid.exitCode, 0);
assert.strictEqual(valid.shellUsed, false);
assert.strictEqual(valid.targetModified, false);
assert.match(valid.evidenceId, /^[a-f0-9]{64}$/);
assert.strictEqual(invalid.status, "FAILED");
assert.strictEqual(passing.status, "PASSED");
assert.strictEqual(failing.status, "FAILED");
assert.strictEqual(failing.exitCode, 3);
assert.strictEqual(slow.status, "FAILED");
assert.strictEqual(slow.timedOut, true);
assert.throws(() => runner.runNodeTest("valid.js"), /requires a \*\.test\.js target/);
assert.throws(() => runner.runSyntaxCheck("../outside.js"), /does not exist|outside/);

console.log("Safe command runner validation passed.");
