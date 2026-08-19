require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { isLLMConfigured, getConfiguredProvider } = require("../../src/rag/llmAdapter");
const { execute } = require("./executor");

const REPO_ROOT = path.join(__dirname, "..", "..");
const MODULE_PATH = "src/generated/garudaLiveGenerationProbe.js";
const TEST_PATH = "src/generated/garudaLiveGenerationProbe.test.js";

const TASK = `Create a tiny deterministic utility module named garudaLiveGenerationProbe.
- module path: src/generated/garudaLiveGenerationProbe.js exporting a pure function probeSum(a, b) that returns a + b.
- test path: src/generated/garudaLiveGenerationProbe.test.js that requires the module relatively and asserts probeSum(2, 3) === 5.
- Use only Node.js built-ins (node:assert in the test). No dependencies, no network, no child_process.`;

function report(label, value) {
  console.log(`[VERIFY] ${label}: ${value}`);
}

(async () => {
  const provider = getConfiguredProvider();
  report("configured provider", provider);
  report("isLLMConfigured", String(isLLMConfigured()));
  report("apiKeyPresence (booleans only)", JSON.stringify({
    GEMINI_API_KEY: Boolean(process.env.GEMINI_API_KEY),
    NVIDIA_API_KEY: Boolean(process.env.NVIDIA_API_KEY),
    OPENAI_API_KEY: Boolean(process.env.OPENAI_API_KEY),
    GARUDA_LLM_API_KEY: Boolean(process.env.GARUDA_LLM_API_KEY)
  }));

  if (!isLLMConfigured()) {
    report("RESULT", "BLOCKED_BY_MISSING_PROVIDER — no real LLM provider configured, stopping. No claims made.");
    process.exit(0);
  }

  const { generateGenericCodeTask } = require("../dev-agent/core/GenericCodeTaskEngine");

  // ---- PHASE 3: REAL LLM GENERATION (no mock) ----
  report("phase", "3_REAL_LLM_GENERATION");
  let generation;
  try {
    generation = await generateGenericCodeTask({ task: TASK, intentId: "garuda-live-generation-probe", rootDir: REPO_ROOT });
  } catch (err) {
    report("generation", "FAILED");
    report("error", err.message);
    report("RESULT", "GENERATION_REJECTED — raw LLM output was not a valid structured proposal. No files written.");
    process.exit(0);
  }

  report("provider", generation.provider || "(unknown)");
  report("generationStatus", generation.status);
  report("intelligenceUsed", String(generation.intelligenceUsed));
  report("targetFiles", JSON.stringify(generation.targetFiles));
  report("verificationTests", JSON.stringify(generation.verification && generation.verification.tests));
  report("proposedFilePaths", JSON.stringify((generation.proposedChanges || []).map((p) => p.path)));

  if (generation.status !== "ARTIFACT_READY_FOR_REVIEW") {
    report("RESULT", "PROPOSAL_VALIDATION_FAILED — LLM produced output but it failed strict validation. No files written.");
    process.exit(0);
  }
  report("proposalValidation", "PASSED (generic_code_task, strict validation)");

  // ---- PHASE 4: CONTROLLED EXECUTION ----
  report("phase", "4_CONTROLLED_EXECUTION");

  report("phase", "4a_NEGATIVE_NO_APPROVAL_FIRST");
  const previousApproval = process.env.GARUDA_FOUNDER_APPROVED;
  delete process.env.GARUDA_FOUNDER_APPROVED;
  const [blockedTask] = await execute([
    { task: "Apply patch: governed code change (garuda-live-generation-probe)", buildResult: generation.buildResult }
  ]);
  report("noApprovalStatus", blockedTask.status);
  report("noApprovalReason", blockedTask.reason);
  report("noApprovalFilesWritten", String(fs.existsSync(path.join(REPO_ROOT, MODULE_PATH))));

  report("phase", "4b_APPROVAL_GRANTED");
  process.env.GARUDA_FOUNDER_APPROVED = "true";
  const [patchTask] = await execute([
    { task: "Apply patch: governed code change (garuda-live-generation-probe)", buildResult: generation.buildResult }
  ]);
  report("applyStatus", patchTask.status);
  report("applyReason", patchTask.reason);
  const applyOutput = patchTask.result && patchTask.result.output ? patchTask.result.output : null;
  report("patchRouteStatus", applyOutput ? applyOutput.status : null);
  report("appliedFiles", JSON.stringify(applyOutput && applyOutput.appliedFiles ? applyOutput.appliedFiles : []));
  report("verificationEvidence", JSON.stringify(applyOutput && applyOutput.evidence ? applyOutput.evidence.map((e) => ({ target: e.targetFile || e.command, status: e.status, targetModified: e.targetModified })) : []));

  const moduleExists = fs.existsSync(path.join(REPO_ROOT, MODULE_PATH));
  const testExists = fs.existsSync(path.join(REPO_ROOT, TEST_PATH));
  report("moduleFileWritten", String(moduleExists));
  report("testFileWritten", String(testExists));

  if (!moduleExists || !testExists) {
    report("RESULT", "APPLY_FAILED — files were not written to workspace. Aborting.");
    process.exit(0);
  }

  // Module load + test run
  let moduleLoad = "FAILED";
  let moduleValue = null;
  try {
    const mod = require(path.join(REPO_ROOT, MODULE_PATH));
    if (mod && typeof mod.probeSum === "function") {
      moduleLoad = "OK";
      moduleValue = mod.probeSum(2, 3);
    }
  } catch (e) {
    moduleLoad = `ERROR: ${e.message}`;
  }
  report("moduleLoad", moduleLoad);
  report("probeSum(2,3)", moduleValue);

  const testRun = spawnSync(process.execPath, [path.join(REPO_ROOT, TEST_PATH)], { encoding: "utf8", timeout: 30000 });
  report("testRunExitCode", testRun.status);
  report("testRunStdout", testRun.stdout ? testRun.stdout.trim().slice(0, 200) : "(none)");

  const e2eProven = patchTask.status === "SUCCESS" && moduleLoad === "OK" && moduleValue === 5 && testRun.status === 0;
  report("REAL_LLM_E2E", e2eProven ? "PROVEN" : "NOT_PROVEN");

  // ---- PHASE 5: NEGATIVE TEST (tampered artifact -> rollback, on the SAME real proposal) ----
  report("phase", "5_NEGATIVE_TAMPERED_ROLLBACK");
  const crypto = require("crypto");
  const tampered = JSON.parse(JSON.stringify(generation.buildResult.artifacts));
  const testArtifact = tampered.find((a) => a.path === TEST_PATH);
  if (testArtifact) {
    testArtifact.content = "const assert = require(\"assert\");\nconst m = require(\"./garudaLiveGenerationProbe\");\nassert.strictEqual(m.probeSum(1, 1), 999);\nconsole.log(\"fail\");\n";
    testArtifact.sha256 = crypto.createHash("sha256").update(testArtifact.content).digest("hex");
    fs.unlinkSync(path.join(REPO_ROOT, MODULE_PATH));
    fs.unlinkSync(path.join(REPO_ROOT, TEST_PATH));
    const tamperedBuild = { ...generation.buildResult, artifacts: tampered };
    const [rollbackTask] = await execute([{ task: "Apply patch: tampered artifact rollback", buildResult: tamperedBuild }]);
    report("tamperedApplyStatus", rollbackTask.status);
    report("tamperedFilesRemainingModule", String(fs.existsSync(path.join(REPO_ROOT, MODULE_PATH))));
    report("tamperedFilesRemainingTest", String(fs.existsSync(path.join(REPO_ROOT, TEST_PATH))));
  } else {
    report("tamperedApplyStatus", "SKIPPED (test artifact not found)");
  }

  // ---- PHASE 6: CLEANUP ----
  report("phase", "6_CLEANUP");
  for (const rel of [MODULE_PATH, TEST_PATH]) {
    const abs = path.join(REPO_ROOT, rel);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  }
  report("probeFilesRemaining", String(fs.existsSync(path.join(REPO_ROOT, MODULE_PATH)) || fs.existsSync(path.join(REPO_ROOT, TEST_PATH))));

  if (previousApproval === undefined) delete process.env.GARUDA_FOUNDER_APPROVED;
  else process.env.GARUDA_FOUNDER_APPROVED = previousApproval;

  report("RESULT", e2eProven ? "REAL LLM E2E PROVEN (proposal -> approval -> apply -> verify -> passing test)" : "REAL LLM E2E NOT PROVEN");
})().catch((err) => {
  console.error("[VERIFY] FATAL:", err);
  process.exitCode = 1;
});