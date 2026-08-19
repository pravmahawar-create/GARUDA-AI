require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { isLLMConfigured, getConfiguredProvider } = require("../../src/rag/llmAdapter");
const { executeGovernedGenericCodeTask } = require("./executor");

const REPO_ROOT = path.join(__dirname, "..", "..");
const MODULE_PATH = "src/generated/garudaLoopLiveProbe.js";
const TEST_PATH = "src/generated/garudaLoopLiveProbe.test.js";

const TASK = `Create a tiny deterministic utility module named garudaLoopLiveProbe.
- module path: src/generated/garudaLoopLiveProbe.js exporting a pure function loopProbe(a, b) that returns a * b.
- test path: src/generated/garudaLoopLiveProbe.test.js that requires the module relatively and asserts loopProbe(3, 4) === 12.
- Use only Node.js built-ins (node:assert in the test). No dependencies, no network, no child_process.`;

function report(label, value) {
  console.log(`[VERIFY] ${label}: ${value}`);
}

function cleanup() {
  for (const rel of [MODULE_PATH, TEST_PATH]) {
    const abs = path.join(REPO_ROOT, rel);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  }
}

(async () => {
  const previousApproval = process.env.GARUDA_FOUNDER_APPROVED;
  cleanup();

  report("configured provider", getConfiguredProvider());
  report("isLLMConfigured", String(isLLMConfigured()));

  if (!isLLMConfigured()) {
    report("RESULT", "BLOCKED_BY_MISSING_PROVIDER");
    process.exit(0);
  }

  // ---- PHASE 1: NO APPROVAL -> BLOCKED_BY_APPROVAL (real LLM) ----
  report("phase", "1_REAL_LLM_LOOP_NO_APPROVAL");
  delete process.env.GARUDA_FOUNDER_APPROVED;
  let blocked;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      blocked = await executeGovernedGenericCodeTask({ task: TASK, intentId: "garuda-loop-live-probe-blocked" });
    } catch (err) {
      blocked = { output: { status: "EXECUTION_FAILED" }, reason: err.message };
    }
    report(`blockedAttempt${attempt}Status`, blocked.output.status);
    report(`blockedAttempt${attempt}Reason`, blocked.reason);
    report(`blockedAttempt${attempt}Generation`, blocked.output.generation ? blocked.output.generation.status : null);
    if (blocked.output.status === "BLOCKED_BY_APPROVAL") break;
  }
  report("blockedFilesWritten", String(fs.existsSync(path.join(REPO_ROOT, MODULE_PATH))));
  const blockedOk = blocked.output.status === "BLOCKED_BY_APPROVAL" && !fs.existsSync(path.join(REPO_ROOT, MODULE_PATH));
  report("BLOCKED_GATE", blockedOk ? "PASS" : "FAIL");

  // ---- PHASE 2: APPROVAL -> COMPLETED_AND_APPLIED (real LLM) ----
  report("phase", "2_REAL_LLM_LOOP_APPROVED");
  process.env.GARUDA_FOUNDER_APPROVED = "true";
  let result;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      result = await executeGovernedGenericCodeTask({ task: TASK, intentId: "garuda-loop-live-probe-approved" });
    } catch (err) {
      result = { output: { status: "EXECUTION_FAILED", reason: err.message }, success: false };
    }
    report(`approvedAttempt${attempt}Status`, result.output.status);
    report(`approvedAttempt${attempt}Reason`, result.reason);
    if (result.output.status === "COMPLETED_AND_APPLIED") break;
  }
  report("provider", result.output.generation ? result.output.generation.provider : "(unknown)");
  report("approvedStatus", result.output.status);
  report("approvedSuccess", String(result.success));
  report("stages", JSON.stringify(result.output.stages));
  report("appliedFiles", JSON.stringify(result.output.appliedFiles));
  report("finalReviewVerdict", result.output.finalReview ? result.output.finalReview.verdict : null);
  let moduleLoad = "FAILED";
  let moduleValue = null;
  if (fs.existsSync(path.join(REPO_ROOT, MODULE_PATH))) {
    try {
      const mod = require(path.join(REPO_ROOT, MODULE_PATH));
      if (mod && typeof mod.loopProbe === "function") {
        moduleLoad = "OK";
        moduleValue = mod.loopProbe(3, 4);
      }
    } catch (e) {
      moduleLoad = `ERROR: ${e.message}`;
    }
  }
  report("moduleLoad", moduleLoad);
  report("loopProbe(3,4)", moduleValue);

  const testRun = spawnSync(process.execPath, [path.join(REPO_ROOT, TEST_PATH)], { encoding: "utf8", timeout: 30000 });
  report("testRunExitCode", testRun.status);

  const e2eProven = blockedOk && result.output.status === "COMPLETED_AND_APPLIED" && result.success && moduleLoad === "OK" && moduleValue === 12 && testRun.status === 0;
  report("REAL_LLM_LOOP_E2E", e2eProven ? "PROVEN" : "NOT_PROVEN");

  // ---- PHASE 3: CLEANUP ----
  report("phase", "3_CLEANUP");
  cleanup();
  report("probeFilesRemaining", String(fs.existsSync(path.join(REPO_ROOT, MODULE_PATH)) || fs.existsSync(path.join(REPO_ROOT, TEST_PATH))));

  if (previousApproval === undefined) delete process.env.GARUDA_FOUNDER_APPROVED;
  else process.env.GARUDA_FOUNDER_APPROVED = previousApproval;

  report("RESULT", e2eProven ? "REAL LLM LOOP E2E PROVEN (no-approval BLOCKED -> approval COMPLETED_AND_APPLIED -> module loads -> test passes)" : "REAL LLM LOOP E2E NOT PROVEN");
})().catch((err) => {
  console.error("[VERIFY] FATAL:", err);
  process.exitCode = 1;
});