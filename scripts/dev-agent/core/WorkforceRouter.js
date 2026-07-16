const WorkerDispatcher = require("./WorkerDispatcher");

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

class WorkforceRouter {
  constructor({ brainRegistry, dispatcher = new WorkerDispatcher() } = {}) {
    this.brainRegistry = brainRegistry;
    this.dispatcher = dispatcher;
  }

  route(task = {}, options = {}) {
    const complexity = Number(task.complexity || 0);
    const fileCount = Array.isArray(task.files) ? task.files.length : Number(task.fileCount || 0);
    const risk = String(task.risk || "low").toLowerCase();
    const cost = options.cost || { classification: "zero_external_cost", externalAllowed: false };

    let selectedWorker = "local_brain_worker";
    let fallbackWorkers = ["aider", "gemini", "cline", "copilot"];
    let reason = "Deterministic/local path is sufficient and cheapest.";
    let confidence = "high";
    let externalAIRequired = false;

    if (task.type === "architecture" || complexity >= 3 || risk === "high") {
      selectedWorker = "local_brain_worker";
      fallbackWorkers = ["aider", "gemini", "cline", "copilot"];
      reason = "Architecture/high-complexity work prefers LocalBrainWorker first.";
      confidence = risk === "high" ? "medium" : "high";
    }

    if (cost.classification === "free_external_allowed" && (complexity >= 4 || fileCount > 6)) {
      selectedWorker = "local_brain_worker";
      fallbackWorkers = ["aider", "gemini", "cline", "copilot"];
      reason = "LocalBrainWorker remains first; external fallback is recommendation-only and not auto-invoked.";
      externalAIRequired = true;
      confidence = "medium";
    }

    if (cost.classification === "credit_sensitive") {
      externalAIRequired = false;
      reason = "Credit-sensitive mode forces local-first routing without external invocation.";
      fallbackWorkers = ["local_brain_worker"];
    }

    if (cost.classification === "paid_blocked") {
      fallbackWorkers = ["local_brain_worker"];
      externalAIRequired = false;
      reason = "Paid workers are blocked by policy; only local/free paths remain.";
    }

    const baseline = this.dispatcher.dispatch({
      type: task.type || "feature",
      risk: task.risk || "low",
      files: Array.isArray(task.files) ? task.files : [],
      budget: task.budget || { mode: "safe" }
    });

    const allowedActions = Array.from(new Set([...(baseline.allowedActions || []), "read", "analyze", "plan"]));
    const blockedActions = Array.from(new Set([...(baseline.blockedActions || []), "commit", "push", "deploy", "paid_api"]));

    const selectedWorkerOrder = DEFAULT_WORKER_PRIORITY.filter((worker) => {
      const config = WORKER_CAPABILITY_REGISTRY[worker];
      if (!config) {
        return false;
      }

      if (cost.classification === "paid_blocked" || cost.classification === "credit_sensitive") {
        return config.class === "local";
      }

      return true;
    });

    const workerRoutingMetadata = {
      capabilityRegistry: WORKER_CAPABILITY_REGISTRY,
      defaultWorkerPriority: DEFAULT_WORKER_PRIORITY,
      selectedWorkerOrder,
      selectedWorkerAlias: selectedWorker,
      localWorkerDefault: selectedWorkerOrder[0] === "local_brain_worker"
    };

    return {
      selectedWorker,
      fallbackWorkers,
      reason,
      confidence,
      externalAIRequired,
      autoInvokeExternal: false,
      estimatedCostLevel: cost.classification,
      approvalRequired: true,
      allowedActions,
      blockedActions,
      workerRoutingMetadata
    };
  }
}

module.exports = WorkforceRouter;
module.exports.WorkforceRouter = WorkforceRouter;
module.exports.WORKER_CAPABILITY_REGISTRY = WORKER_CAPABILITY_REGISTRY;
module.exports.DEFAULT_WORKER_PRIORITY = DEFAULT_WORKER_PRIORITY;
