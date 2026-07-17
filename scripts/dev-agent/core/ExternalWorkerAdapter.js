const crypto = require("crypto");

const SUPPORTED_WORKERS = Object.freeze([
  "local_brain_worker",
  "aider",
  "gemini",
  "cline",
  "copilot"
]);

const EXECUTION_MODES = Object.freeze({
  LOCAL_EXECUTION: "LOCAL_EXECUTION",
  APPROVAL_GATED: "APPROVAL_GATED",
  PREVIEW_ONLY: "PREVIEW_ONLY"
});

const EXECUTION_MODE = EXECUTION_MODES.LOCAL_EXECUTION;

function fingerprintPrompt(prompt) {
  return crypto
    .createHash("sha1")
    .update(JSON.stringify(prompt || ""))
    .digest("hex");
}

function getFounderApprovalState(context = {}) {
  const environmentApproved =
    process.env.GARUDA_FOUNDER_APPROVED === "true" ||
    Boolean(process.env.GARUDA_FOUNDER_APPROVAL_TOKEN);

  const contextApproval = context.approvalState || {};
  const contextApproved =
    contextApproval.founderApproved === true ||
    contextApproval.approved === true ||
    context.founderApproved === true;

  return environmentApproved || contextApproved;
}

function resolveExecutionMode(worker, context = {}) {
  if (worker === "local_brain_worker") {
    return EXECUTION_MODES.LOCAL_EXECUTION;
  }

  const founderApproved = getFounderApprovalState(context);
  const externalExecutionEnabled =
    process.env.GARUDA_EXTERNAL_WORKER_EXECUTION === "true";

  if (founderApproved && externalExecutionEnabled) {
    return EXECUTION_MODES.APPROVAL_GATED;
  }

  return EXECUTION_MODES.PREVIEW_ONLY;
}

function resolveAdapterStatus(worker, executionMode) {
  if (
    worker === "local_brain_worker" &&
    executionMode === EXECUTION_MODES.LOCAL_EXECUTION
  ) {
    return "LOCAL_EXECUTION_READY";
  }

  if (executionMode === EXECUTION_MODES.APPROVAL_GATED) {
    return "APPROVED_EXTERNAL_EXECUTION_PENDING_ADAPTER";
  }

  return "REQUEST_PREPARED";
}

class ExternalWorkerAdapter {
  buildRequest(worker, goal, context = {}) {
    const selectedWorker = String(worker || "").trim();

    if (!SUPPORTED_WORKERS.includes(selectedWorker)) {
      throw new Error(
        `Unsupported worker: ${selectedWorker || "unknown"}`
      );
    }

    const prompt = context.prompt || "";
    const promptFingerprint =
      context.promptFingerprint || fingerprintPrompt(prompt);
    const executionMode = resolveExecutionMode(
      selectedWorker,
      context
    );
    const adapterStatus = resolveAdapterStatus(
      selectedWorker,
      executionMode
    );

    return {
      worker: selectedWorker,
      goal: goal || "",
      prompt,
      context,
      estimatedCost:
        context.estimatedCost ||
        context.estimatedCostLevel ||
        "local_preferred",
      requiresApproval:
        selectedWorker === "local_brain_worker"
          ? false
          : context.requiresApproval !== false,
      executionMode,
      promptFingerprint,
      adapterStatus,
      executionReady:
        selectedWorker === "local_brain_worker" &&
        executionMode === EXECUTION_MODES.LOCAL_EXECUTION,
      externalExecutionEnabled:
        process.env.GARUDA_EXTERNAL_WORKER_EXECUTION === "true",
      founderApproved: getFounderApprovalState(context)
    };
  }
}

module.exports = ExternalWorkerAdapter;
module.exports.ExternalWorkerAdapter = ExternalWorkerAdapter;
module.exports.SUPPORTED_WORKERS = SUPPORTED_WORKERS;
module.exports.EXECUTION_MODE = EXECUTION_MODE;
module.exports.EXECUTION_MODES = EXECUTION_MODES;
module.exports.resolveExecutionMode = resolveExecutionMode;