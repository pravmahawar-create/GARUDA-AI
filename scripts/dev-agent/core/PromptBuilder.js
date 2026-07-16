const crypto = require("crypto");

const WORKER_CAPABILITY_REGISTRY = Object.freeze({
  local_brain_worker: {
    class: "local",
    capabilities: ["read", "analyze", "plan", "summarize", "run_syntax_checks"]
  },
  aider: {
    class: "external_adapter",
    capabilities: ["read", "analyze", "plan", "patch_small_scope"]
  },
  gemini: {
    class: "external_adapter",
    capabilities: ["read", "analyze", "plan", "summarize"]
  },
  cline: {
    class: "external_adapter",
    capabilities: ["read", "analyze", "plan", "review"]
  },
  copilot: {
    class: "external_adapter",
    capabilities: ["read", "analyze", "plan", "review"]
  }
});

const DEFAULT_WORKER_PRIORITY = Object.freeze([
  "local_brain_worker",
  "aider",
  "gemini",
  "cline",
  "copilot"
]);

function workerRoutingMetadata(payload = {}) {
  const selectedWorkerOrder = Array.isArray(payload.selectedWorkerOrder) && payload.selectedWorkerOrder.length
    ? payload.selectedWorkerOrder
    : DEFAULT_WORKER_PRIORITY;

  return {
    capabilityRegistry: payload.capabilityRegistry || WORKER_CAPABILITY_REGISTRY,
    defaultWorkerPriority: payload.defaultWorkerPriority || DEFAULT_WORKER_PRIORITY,
    selectedWorkerOrder,
    selectedWorkerAlias: payload.selectedWorker || "local_brain_worker",
    localWorkerDefault: selectedWorkerOrder[0] === "local_brain_worker"
  };
}

function fingerprint(prompt) {
  return crypto.createHash("sha1").update(JSON.stringify(prompt)).digest("hex");
}

function baseConstraints() {
  return [
    "Inspect before edit",
    "Reuse before create",
    "Never duplicate completed modules",
    "No paid APIs",
    "No commit",
    "No push",
    "No deploy",
    "Stop before writes unless Founder approval explicitly permits the requested write",
    "Report every proposed or modified file",
    "Never claim validation that was not actually run"
  ];
}

class PromptBuilder {
  buildAdapterPromptEnvelope(promptPayload = {}) {
    const built = this._build(promptPayload.type || "planning", promptPayload);
    return {
      prompt: built.prompt,
      promptFingerprint: built.promptFingerprint,
      safeSummary: built.safeSummary
    };
  }

  _build(type, payload = {}) {
    const mergedBlockedActions = Array.from(new Set(
      (Array.isArray(payload.blockedActions)
        ? payload.blockedActions
        : ["write_source", "code_patch", "commit", "push", "deploy", "paid_api"])
        .concat(["commit", "push", "deploy", "paid_api"])
    ));

    const prompt = {
      type,
      mode: payload.mode || "development_director",
      role: payload.role || "engineering_worker",
      goal: payload.goal || "",
      existingModulesToReuse: Array.isArray(payload.existingModulesToReuse) ? payload.existingModulesToReuse : [],
      filesInScope: Array.isArray(payload.filesInScope) ? payload.filesInScope : [],
      requiredContext: payload.requiredContext || {},
      constraints: baseConstraints().concat(Array.isArray(payload.constraints) ? payload.constraints : []),
      allowedActions: Array.isArray(payload.allowedActions) ? payload.allowedActions : ["read", "analyze", "plan"],
      blockedActions: mergedBlockedActions,
      founderApprovalStatus: payload.founderApprovalStatus || "NOT_APPROVED",
      workerRoutingMetadata: workerRoutingMetadata(payload),
      validationCommands: Array.isArray(payload.validationCommands) ? payload.validationCommands : [],
      expectedResponseFormat: payload.expectedResponseFormat || {
        format: "json",
        sections: ["summary", "changes", "risks", "validation", "nextAction"]
      },
      stopConditions: Array.isArray(payload.stopConditions)
        ? payload.stopConditions
        : ["missing_required_context", "policy_violation_detected", "approval_required_before_write"]
    };

    return {
      prompt,
      promptFingerprint: fingerprint(prompt),
      safeSummary: {
        type,
        role: prompt.role,
        goal: prompt.goal,
        filesInScope: prompt.filesInScope,
        workerPriority: prompt.workerRoutingMetadata.selectedWorkerOrder,
        allowedActions: prompt.allowedActions,
        blockedActions: prompt.blockedActions,
        founderApprovalStatus: prompt.founderApprovalStatus
      }
    };
  }

  buildPlanningPrompt(payload = {}) {
    return this._build("planning", {
      ...payload,
      mode: payload.mode || "development_director",
      allowedActions: ["read", "analyze", "plan", "summarize"],
      constraints: ["Planning prompts must be read-only"].concat(payload.constraints || []),
      founderApprovalStatus: payload.founderApprovalStatus || "NOT_REQUIRED_FOR_READ_ONLY"
    });
  }

  buildImplementationPrompt(payload = {}) {
    return this._build("implementation", payload);
  }

  buildReviewPrompt(payload = {}) {
    return this._build("review", payload);
  }

  buildValidationPrompt(payload = {}) {
    return this._build("validation", payload);
  }

  buildRecoveryPrompt(payload = {}) {
    return this._build("recovery", payload);
  }
}

module.exports = PromptBuilder;
module.exports.PromptBuilder = PromptBuilder;
module.exports.WORKER_CAPABILITY_REGISTRY = WORKER_CAPABILITY_REGISTRY;
module.exports.DEFAULT_WORKER_PRIORITY = DEFAULT_WORKER_PRIORITY;
