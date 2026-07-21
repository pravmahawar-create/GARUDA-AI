const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const LocalBrainWorker = require("./LocalBrainWorker");

const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "garuda-tester-brain-"));
fs.writeFileSync(path.join(rootDir, "module.js"), "module.exports = true;\n");
fs.writeFileSync(path.join(rootDir, "passing.test.js"), "console.log('fixture passed');\n");
fs.writeFileSync(path.join(rootDir, "failing.test.js"), "throw new Error('fixture failed');\n");

const tester = new LocalBrainWorker({ role: "tester", rootDir });
const syntax = tester.runSyntaxChecks(["module.js"]);
const tests = tester.runExistingTests(["passing.test.js", "failing.test.js"]);
const missingTarget = tester.runExistingTests([]);

assert.strictEqual(syntax[0].status, "PASSED");
assert.strictEqual(tests[0].status, "PASSED");
assert.match(tests[0].stdout, /fixture passed/);
assert.strictEqual(tests[1].status, "FAILED");
assert.match(tests[1].stderr, /fixture failed/);
assert.strictEqual(missingTarget[0].status, "FAILED");
assert.strictEqual(missingTarget[0].error.code, "TEST_TARGET_REQUIRED");
assert.ok(tests.every((item) => item.shellUsed === false));

console.log("Real Tester Brain validation passed.");
