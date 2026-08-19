const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  generateGenericCodeTask,
  parseStructuredOutput,
  stripCodeFences
} = require("./GenericCodeTaskEngine");

function rootDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "garuda-generic-code-"));
}

const VALID_TASK = "Create a greeter module that returns a greeting string and a passing test.";
const VALID_LLM_OUTPUT = {
  task: VALID_TASK,
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

function mockLlmReturning(raw) {
  return async () => ({ answer: JSON.stringify(raw), provider: "mock" });
}

(async () => {
  // ------------------------------------------------------------
  // 1. stripCodeFences / parseStructuredOutput helpers
  // ------------------------------------------------------------
  assert.strictEqual(stripCodeFences("```json\n{\"a\":1}\n```"), '{"a":1}');
  assert.deepStrictEqual(parseStructuredOutput("prefix\n```json\n{\"a\":1}\n```\nsuffix"), { a: 1 });
  assert.strictEqual(parseStructuredOutput("not json at all"), null);
  assert.strictEqual(parseStructuredOutput(""), null);
  console.log("✔ 1. parseStructuredOutput / stripCodeFences behave correctly.");

  // ------------------------------------------------------------
  // 2. Valid structured LLM output → ARTIFACT_READY_FOR_REVIEW
  // ------------------------------------------------------------
  const dir1 = rootDir();
  const result = await generateGenericCodeTask({ task: VALID_TASK, llm: mockLlmReturning(VALID_LLM_OUTPUT), rootDir: dir1 });
  assert.strictEqual(result.status, "ARTIFACT_READY_FOR_REVIEW");
  assert.strictEqual(result.engine, "GARUDA Engineering Brain v1");
  assert.strictEqual(result.intelligenceUsed, true);
  assert.strictEqual(result.requiresFounderApprovalToApply, true);
  assert.strictEqual(result.commitPushDeployAllowed, false);
  assert.strictEqual(result.sourceTreeModified, false);
  assert.strictEqual(result.provider, "mock");
  assert.ok(result.patch.includes("new file mode 100644"));
  assert.ok(result.patch.includes("src/generated/greeter.js"));
  assert.ok(result.evidence.every((e) => e.status === "PASSED"));
  assert.ok(result.proposedChanges.some((p) => p.path === "src/generated/greeter.js"));
  assert.ok(result.proposedChanges.some((p) => p.path === "src/generated/greeter.test.js"));
  assert.strictEqual(result.verification.tests.length, 1);
  assert.strictEqual(fs.existsSync(path.join(dir1, "src/generated/greeter.js")), false);
  console.log("✔ 2. Valid LLM output produced ARTIFACT_READY_FOR_REVIEW (no workspace write).");

  // ------------------------------------------------------------
  // 3. Malformed LLM output → rejected (not applied)
  // ------------------------------------------------------------
  await assert.rejects(
    () => generateGenericCodeTask({ task: VALID_TASK, llm: mockLlmReturning("this is not json"), rootDir: rootDir() }),
    /GENERIC_CODE_TASK_MALFORMED_OUTPUT/
  );
  await assert.rejects(
    () => generateGenericCodeTask({ task: VALID_TASK, llm: async () => ({ answer: "" }), rootDir: rootDir() }),
    /GENERIC_CODE_TASK_EMPTY_LLM_OUTPUT/
  );
  await assert.rejects(
    () => generateGenericCodeTask({ task: VALID_TASK, llm: mockLlmReturning({ ...VALID_LLM_OUTPUT, targetFiles: ["src/generated/greeter.js"] }), rootDir: rootDir() }),
    /not declared in targetFiles/
  );
  console.log("✔ 3. Malformed / empty / invalid LLM output rejected.");

  // ------------------------------------------------------------
  // 4. Unsafe output rejected (path escape, non-allow-listed template)
  // ------------------------------------------------------------
  const escaped = JSON.parse(JSON.stringify(VALID_LLM_OUTPUT));
  escaped.targetFiles = ["../escape.js", "src/generated/escape.test.js"];
  escaped.proposedChanges[0].path = "../escape.js";
  escaped.proposedChanges[1].path = "src/generated/escape.test.js";
  escaped.verification.tests = ["src/generated/escape.test.js"];
  await assert.rejects(
    () => generateGenericCodeTask({ task: VALID_TASK, llm: mockLlmReturning(escaped), rootDir: rootDir() }),
    /approved workspace/
  );

  const rawCode = JSON.parse(JSON.stringify(VALID_LLM_OUTPUT));
  rawCode.targetFiles = ["src/generated/raw.js", "src/generated/raw.test.js"];
  rawCode.proposedChanges = [
    { path: "src/generated/raw.js", content: "module.exports = {};\n" },
    { path: "src/generated/raw.test.js", content: "const assert=require('assert');\nconst x=require('./raw');\nassert.ok(x);\nconsole.log('ok');\n" }
  ];
  rawCode.verification.tests = ["src/generated/raw.test.js"];
  const forced = await generateGenericCodeTask({
    task: VALID_TASK,
    llm: async () => ({ answer: JSON.stringify({ template: "raw_code", ...rawCode }), provider: "mock" }),
    rootDir: rootDir()
  });
  assert.strictEqual(forced.policy.allowedTemplate, "generic_code_task");
  assert.strictEqual(forced.status, "ARTIFACT_READY_FOR_REVIEW");
  console.log("✔ 4. Unsafe paths rejected; LLM cannot override allow-listed template (forced to generic_code_task).");
  console.log("✔ 4. Unsafe paths and non-allow-listed templates rejected.");

  // ------------------------------------------------------------
  // 5. Missing task rejected
  // ------------------------------------------------------------
  await assert.rejects(() => generateGenericCodeTask({ task: "", llm: mockLlmReturning(VALID_LLM_OUTPUT) }), /GENERIC_CODE_TASK_REQUIRED/);
  console.log("✔ 5. Missing task rejected.");

  console.log("\nGeneric Code Task Engine validation passed.");
  process.exitCode = 0;
})().catch((err) => {
  console.error("❌ Generic Code Task Engine test FAILED:", err.message);
  process.exitCode = 1;
});