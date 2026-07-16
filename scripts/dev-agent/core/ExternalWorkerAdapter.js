const crypto = require("crypto");

const SUPPORTED_WORKERS = Object.freeze([
  "local_brain_worker",
  "aider",
  "gemini",
  "cline",
  "copilot"
]);

const EXECUTION_MODE = "PREVIEW_ONLY";

function fingerprintPrompt(prompt) {
  return crypto.createHash("sha1").update(JSON.stringify(prompt || "")).digest("hex");
}

class ExternalWorkerAdapter {
  buildRequest(worker, goal, context = {}) {
    const selectedWorker = String(worker || "").trim();

    if (!SUPPORTED_WORKERS.includes(selectedWorker)) {
      throw new Error(`Unsupported worker: ${selectedWorker || "unknown"}`);
    }

    const prompt = context.prompt || "";
    const promptFingerprint = context.promptFingerprint || fingerprintPrompt(prompt);

    return {
      worker: selectedWorker,
      goal: goal || "",
      prompt,
      context,
      estimatedCost: context.estimatedCost || context.estimatedCostLevel || "local_preferred",
      requiresApproval: context.requiresApproval !== false,
      executionMode: EXECUTION_MODE,
      promptFingerprint,
      adapterStatus: "REQUEST_PREPARED"
    };
  }
}

module.exports = ExternalWorkerAdapter;
module.exports.ExternalWorkerAdapter = ExternalWorkerAdapter;
module.exports.SUPPORTED_WORKERS = SUPPORTED_WORKERS;
module.exports.EXECUTION_MODE = EXECUTION_MODE;
