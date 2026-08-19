const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execute, executeGenericCodeTask } = require("./executor");
const EngineeringBrain = require("../dev-agent/core/EngineeringBrain");

const VALID_LLM_OUTPUT = {
  task: "Create a greeter module that returns a greeting string and a passing test.",
  confidence: 0.9,
  targetFiles: ["src/generated/greeter.js", "src/generated/greeter.test.js"],
  implementationPlan: {
    summary: "Add a bounded greeter module with a real test.",
    steps: ["Create greeter.js", "Create greeter.test.js"]
  },
  proposedChanges: [
    {
      path: "src/generated/greeter.js",
      content: "function greet(name = \"world\") {\n  return `Hello, ${name}!`;\n}\nmodule.exports = { greet };\n"
    },
    {
      path: "src/generated/greeter.test.js",
      content: "const assert = require(\"assert\");\nconst { greet } = require(\"./greeter\");\nassert.strictEqual(greet(\"GARUDA\"), \"Hello, GARUDA!\");\nconsole.log(\"greeter test passed.\");\n"
    }
  ],
  verification: { tests: ["src/generated/greeter.test.js"] }
};

function mockLlm(raw) {
  return async () => ({ answer: JSON.stringify(raw), provider: "mock" });
}

(async () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "garuda-generic-e2e-"));
  const previousCwd = process.cwd();
  const previousEnv = process.env.GARUDA_FOUNDER_APPROVED;
  process.chdir(rootDir);

  try {
    // ------------------------------------------------------------
    // 1. End-to-end: task → generation → approval → apply → verify
    // ------------------------------------------------------------
    process.env.GARUDA_FOUNDER_APPROVED = "true";
    const report = await executeGenericCodeTask({
      task: "Create a greeter module",
      rootDir,
      llm: mockLlm(VALID_LLM_OUTPUT)
    });

    assert.strictEqual(report.generationStatus, "ARTIFACT_READY_FOR_REVIEW");
    assert.strictEqual(report.executionStatus, "SUCCESS");
    assert.strictEqual(report.report.executionStatus, "SUCCESS");
    assert.strictEqual(report.execution.route, "patch");
    assert.strictEqual(report.execution.approved, true);
    assert.deepStrictEqual(report.report.generatedFiles.sort(), ["src/generated/greeter.js", "src/generated/greeter.test.js"].sort());
    assert.strictEqual(report.report.approvalGate.requiresFounderApproval, true);
    assert.strictEqual(report.report.approvalGate.commitPushDeployAllowed, false);

    assert.strictEqual(fs.existsSync(path.join(rootDir, "src/generated/greeter.js")), true);
    assert.strictEqual(fs.existsSync(path.join(rootDir, "src/generated/greeter.test.js")), true);
    const appliedModule = require(path.join(rootDir, "src/generated/greeter.js"));
    assert.strictEqual(appliedModule.greet("GARUDA"), "Hello, GARUDA!");
    const testRun = require("child_process").spawnSync(process.execPath, [path.join(rootDir, "src/generated/greeter.test.js")], { encoding: "utf8" });
    assert.strictEqual(testRun.status, 0, testRun.stderr);
    console.log("✔ 1. E2E task → generation → approval → apply → verify SUCCESS; module loads, test passes.");

    // ------------------------------------------------------------
    // 2. Approval gate enforcement (no founder approval → BLOCKED)
    // ------------------------------------------------------------
    delete process.env.GARUDA_FOUNDER_APPROVED;
    const secondOutput = JSON.parse(JSON.stringify(VALID_LLM_OUTPUT));
    secondOutput.task = "Create a different greeter module.";
    secondOutput.targetFiles = ["src/generated/blocked.js", "src/generated/blocked.test.js"];
    secondOutput.proposedChanges[0].path = "src/generated/blocked.js";
    secondOutput.proposedChanges[0].content = "function greet(name = \"world\") {\n  return `Hi, ${name}!`;\n}\nmodule.exports = { greet };\n";
    secondOutput.proposedChanges[1].path = "src/generated/blocked.test.js";
    secondOutput.proposedChanges[1].content = "const assert = require(\"assert\");\nconst { greet } = require(\"./blocked\");\nassert.strictEqual(greet(\"GARUDA\"), \"Hi, GARUDA!\");\nconsole.log(\"blocked test passed.\");\n";
    secondOutput.verification.tests = ["src/generated/blocked.test.js"];
    const blocked = await executeGenericCodeTask({
      task: "Create another greeter",
      rootDir,
      llm: mockLlm(secondOutput)
    });
    assert.strictEqual(blocked.generationStatus, "ARTIFACT_READY_FOR_REVIEW");
    assert.strictEqual(blocked.executionStatus, "BLOCKED_BY_APPROVAL");
    assert.strictEqual(blocked.report.executionStatus, "BLOCKED_BY_APPROVAL");
    assert.strictEqual(blocked.execution.approved, false);
    assert.strictEqual(fs.existsSync(path.join(rootDir, "src/generated/blocked.js")), false);
    console.log("✔ 2. Without founder approval the patch route is BLOCKED_BY_APPROVAL (no write).");

    // ------------------------------------------------------------
    // 3. Rollback after failed verification (real apply → verify fails → rollback)
    // ------------------------------------------------------------
    process.env.GARUDA_FOUNDER_APPROVED = "true";
    const brain = new EngineeringBrain({ rootDir });
    const validSpec = {
      template: "generic_code_task",
      task: "Create a validator whose post-apply verification is tampered to fail.",
      targetFiles: ["src/generated/rollback.js", "src/generated/rollback.test.js"],
      implementationPlan: { summary: "rollback", steps: ["create", "test"] },
      proposedChanges: [
        { path: "src/generated/rollback.js", kind: "module", content: "module.exports = { value: 1 };\n" },
        {
          path: "src/generated/rollback.test.js",
          kind: "test",
          content: "const assert = require('assert');\nconst m = require('./rollback');\nassert.strictEqual(m.value, 1);\nconsole.log('rollback test passed.');\n"
        }
      ],
      verification: { tests: ["src/generated/rollback.test.js"] }
    };
    const validBuild = brain.build(validSpec);
    assert.strictEqual(validBuild.status, "ARTIFACT_READY_FOR_REVIEW");
    // Tamper the test artifact so fingerprint passes but real-workspace test fails.
    const tampered = JSON.parse(JSON.stringify(validBuild.artifacts));
    tampered[1].content = "const assert = require('assert');\nconst m = require('./rollback');\nassert.strictEqual(m.value, 999);\nconsole.log('fail');\n";
    const crypto = require("crypto");
    tampered[1].sha256 = crypto.createHash("sha256").update(tampered[1].content).digest("hex");
    const tamperedBuild = { ...validBuild, artifacts: tampered };
    const [rollbackTask] = await execute([{ task: "Apply patch: tampered artifact rollback", buildResult: tamperedBuild }]);
    assert.strictEqual(rollbackTask.status, "FAILED");
    assert.strictEqual(fs.existsSync(path.join(rootDir, "src/generated/rollback.js")), false);
    assert.strictEqual(fs.existsSync(path.join(rootDir, "src/generated/rollback.test.js")), false);
    console.log("✔ 3. Post-apply verification failure rolls back — no files left in workspace.");

    // ------------------------------------------------------------
    // 4. Existing-target protection (new-file-only policy)
    // ------------------------------------------------------------
    fs.mkdirSync(path.join(rootDir, "src/generated"), { recursive: true });
    fs.writeFileSync(path.join(rootDir, "src/generated/existing.js"), "module.exports = {};\n");
    const existingSpec = {
      template: "generic_code_task",
      task: "Create a duplicate existing module.",
      targetFiles: ["src/generated/existing.js", "src/generated/existing.test.js"],
      implementationPlan: { summary: "dup", steps: ["create"] },
      proposedChanges: [
        { path: "src/generated/existing.js", kind: "module", content: "module.exports = {};\n" },
        { path: "src/generated/existing.test.js", kind: "test", content: "const assert=require('assert');\nconst x=require('./existing');\nassert.ok(x);\nconsole.log('ok');\n" }
      ],
      verification: { tests: ["src/generated/existing.test.js"] }
    };
    assert.throws(() => brain.build(existingSpec), /New-file-only policy rejected existing target/);
    console.log("✔ 4. Existing-target protection enforced (new-file-only).");

    console.log("\nGeneric Code Task end-to-end execution validation passed.");
  } finally {
    process.chdir(previousCwd);
    if (previousEnv === undefined) delete process.env.GARUDA_FOUNDER_APPROVED;
    else process.env.GARUDA_FOUNDER_APPROVED = previousEnv;
  }
})().catch((err) => {
  console.error("❌ Generic Code Task E2E FAILED:", err);
  process.exitCode = 1;
});