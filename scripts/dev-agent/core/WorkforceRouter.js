const WorkerDispatcher = require("./WorkerDispatcher");

const WORKER_CAPABILITY_REGISTRY = Object.freeze({
  local_brain_worker: {
    class: "local",
    capabilities: [
      "read",
      "analyze",
      "plan",
      "summarize",
      "run_syntax_checks"
    ],
    supportsWrite: false,
    costClass: "zero_external_cost"
  },

  aider: {
    class: "external_adapter",
    capabilities: [
      "read",
      "analyze",
      "plan",
      "patch_small_scope",
      "patch_multi_file",
      "run_tests"
    ],
    supportsWrite: true,
    costClass: "free_or_credit_sensitive"
  },

  gemini: {
    class: "external_adapter",
    capabilities: [
      "read",
      "analyze",
      "plan",
      "summarize",
      "generate_code",
      "review"
    ],
    supportsWrite: false,
    costClass: "free_or_credit_sensitive"
  },

  cline: {
    class: "external_adapter",
    capabilities: [
      "read",
      "analyze",
      "plan",
      "review",
      "patch_multi_file",
      "run_commands",
      "run_tests"
    ],
    supportsWrite: true,
    costClass: "free_or_credit_sensitive"
  },

  copilot: {
    class: "external_adapter",
    capabilities: [
      "read",
      "analyze",
      "plan",
      "review",
      "generate_code"
    ],
    supportsWrite: false,
    costClass: "subscription_or_external"
  }
});

const DEFAULT_WORKER_PRIORITY = Object.freeze([
  "local_brain_worker",
  "aider",
  "gemini",
  "cline",
  "copilot"
]);

const FREE_EXTERNAL_COST_CLASSES = new Set([
  "zero_external_cost",
  "free_external_allowed",
  "free_external_execution"
]);

const BLOCKED_EXTERNAL_COST_CLASSES = new Set([
  "paid_blocked",
  "credit_sensitive"
]);

function normalizeBoolean(value) {
  return (
    value === true ||
    String(value || "").trim().toLowerCase() === "true"
  );
}

function hasFounderApproval(options = {}) {
  return (
    normalizeBoolean(options.founderApproved) ||
    normalizeBoolean(
      options.approval &&
      options.approval.founderApproved
    ) ||
    normalizeBoolean(process.env.GARUDA_FOUNDER_APPROVED) ||
    Boolean(process.env.GARUDA_FOUNDER_APPROVAL_TOKEN)
  );
}

function externalExecutionEnabled(options = {}) {
  return (
    normalizeBoolean(options.externalExecutionEnabled) ||
    normalizeBoolean(
      process.env.GARUDA_EXTERNAL_WORKER_EXECUTION
    )
  );
}

function normalizeCostClassification(cost = {}) {
  const classification = String(
    cost.classification || "zero_external_cost"
  )
    .trim()
    .toLowerCase();

  return classification || "zero_external_cost";
}

function taskNeedsWrite(task = {}) {
  const goalText = String(task.rawGoal || task.goal || task.prompt || "").toLowerCase();
  const hasNegativeWriteConstraint =
    /\b(do not|don't|dont|no|without|zero|never|stop)\s+([a-z\s,]+)?\b(modify|modifying|edit|editing|write|writes|writing|change|changes|changing|patch|patching|create|creating|delete|deleting|commit|committing|push|pushing|file|files|anything|code)\b/i.test(goalText) ||
    /\b(read-only|read only|no writes|no write|without changing|without modifying|don't commit|don't push|don't modify|don't write|dont commit|dont push|dont modify|dont write)\b/i.test(goalText);

  if (hasNegativeWriteConstraint || task.intent === "read_only_audit" || task.actionType === "analysis") {
    return false;
  }

  if (normalizeBoolean(task.requiresWrite)) {
    return true;
  }

  const writePattern =
    /\b(implement|write|patch|modify|refactor|create|build|fix|update|develop|upgrade|integrate)\b/i;

  const searchableFields = [
    task.goal,
    task.rawGoal,
    task.intent,
    task.title,
    task.description,
    task.prompt
  ];

  if (
    searchableFields.some((value) =>
      writePattern.test(String(value || ""))
    )
  ) {
    return true;
  }

  return (
    Array.isArray(task.actions) &&
    task.actions.some((action) =>
      writePattern.test(String(action || ""))
    )
  );
}

function chooseExternalWorker(task = {}) {
  const complexity = Number(task.complexity || 0);

  const fileCount = Array.isArray(task.files)
    ? task.files.length
    : Number(task.fileCount || 0);

  const type = String(task.type || "feature")
    .trim()
    .toLowerCase();

  const risk = String(task.risk || "low")
    .trim()
    .toLowerCase();

  const needsWrite = taskNeedsWrite(task);

  if (!needsWrite) {
    return {
      worker: "gemini",
      reason:
        "Read-only analysis and planning prefer Gemini."
    };
  }

  if (
    type === "architecture" ||
    type === "core" ||
    risk === "high" ||
    complexity >= 4 ||
    fileCount > 6
  ) {
    return {
      worker: "cline",
      reason:
        "High-complexity, core, high-risk, or broad multi-file implementation prefers Cline."
    };
  }

  return {
    worker: "aider",
    reason:
      "Small or medium founder-approved code changes prefer Aider."
  };
}

class WorkforceRouter {
  constructor({
    brainRegistry,
    dispatcher = new WorkerDispatcher()
  } = {}) {
    this.brainRegistry = brainRegistry || null;
    this.dispatcher = dispatcher;
  }

  route(task = {}, options = {}) {
    /*
     * Mother may pass a small execution task such as "Analyze project",
     * while the actual founder goal is supplied in options.goal.
     *
     * Merge both inputs before deciding whether code changes are required.
     */
    const effectiveTask = {
      ...task,
      goal:
        options.goal ||
        options.rawGoal ||
        task.rawGoal ||
        task.goal ||
        "",
      rawGoal:
        options.rawGoal ||
        options.goal ||
        task.rawGoal ||
        task.goal ||
        "",
      intent:
        task.intent ||
        options.intent ||
        (options.context && options.context.intent) ||
        "",
      prompt:
        task.prompt ||
        options.prompt ||
        "",
      requiresWrite:
        normalizeBoolean(task.requiresWrite) ||
        normalizeBoolean(options.requiresWrite)
    };

    const complexity = Number(effectiveTask.complexity || 0);

    const fileCount = Array.isArray(effectiveTask.files)
      ? effectiveTask.files.length
      : Number(effectiveTask.fileCount || 0);

    const risk = String(effectiveTask.risk || "low")
      .trim()
      .toLowerCase();

    const cost = options.cost || {
      classification: "zero_external_cost",
      externalAllowed: false
    };

    const costClassification =
      normalizeCostClassification(cost);

    const founderApproved =
      hasFounderApproval(options);

    const executionEnabled =
      externalExecutionEnabled(options);

    const needsWrite =
      taskNeedsWrite(effectiveTask);

    let selectedWorker = "local_brain_worker";
    let fallbackWorkers = [
      "aider",
      "gemini",
      "cline",
      "copilot"
    ];
    let reason =
      "LocalBrainWorker selected for safe local analysis.";
    let confidence = "high";
    let externalAIRequired = false;
    let autoInvokeExternal = false;

    const externalBlocked =
      BLOCKED_EXTERNAL_COST_CLASSES.has(
        costClassification
      );

    const freeExternalAllowed =
      FREE_EXTERNAL_COST_CLASSES.has(
        costClassification
      );

    const externalCandidate =
      chooseExternalWorker(effectiveTask);

    if (freeExternalAllowed && !externalBlocked) {
      externalAIRequired =
        needsWrite && (
          complexity >= 3 ||
          fileCount > 3
        );

      if (
        externalAIRequired &&
        founderApproved &&
        executionEnabled
      ) {
        selectedWorker = externalCandidate.worker;

        fallbackWorkers = [
          "local_brain_worker",
          ...DEFAULT_WORKER_PRIORITY.filter(
            (worker) =>
              worker !== externalCandidate.worker &&
              worker !== "local_brain_worker"
          )
        ];

        reason = externalCandidate.reason;
        confidence =
          risk === "high" ? "medium" : "high";
        autoInvokeExternal = true;
      } else if (
        externalAIRequired &&
        !founderApproved
      ) {
        reason =
          "External worker is suitable but Founder approval is required before execution.";
        confidence = "medium";
      } else if (
        externalAIRequired &&
        !executionEnabled
      ) {
        reason =
          "External worker is suitable and approved, but GARUDA_EXTERNAL_WORKER_EXECUTION is not enabled.";
        confidence = "medium";
      }
    } else if (!externalBlocked) {
      reason =
        `Cost class "${costClassification}" does not permit external worker execution.`;
      confidence = "medium";
    }

    if (externalBlocked) {
      fallbackWorkers = ["local_brain_worker"];
      externalAIRequired = false;
      autoInvokeExternal = false;

      reason =
        costClassification === "paid_blocked"
          ? "Paid workers are blocked by policy; only local execution is allowed."
          : "Credit-sensitive mode forces local-only execution.";
    }

    const baseline = this.dispatcher.dispatch({
      type: effectiveTask.type || "feature",
      risk: effectiveTask.risk || "low",
      files: Array.isArray(effectiveTask.files)
        ? effectiveTask.files
        : [],
      budget:
        effectiveTask.budget || { mode: "safe" }
    });

    const allowedActions = Array.from(
      new Set([
        ...(baseline.allowedActions || []),
        "read",
        "analyze",
        "plan"
      ])
    );

    if (
      selectedWorker !== "local_brain_worker" &&
      needsWrite &&
      founderApproved &&
      executionEnabled
    ) {
      allowedActions.push(
        "write",
        "patch",
        "run_tests"
      );
    }

    const blockedActions = Array.from(
      new Set([
        ...(baseline.blockedActions || []),
        "commit",
        "push",
        "deploy",
        "paid_api"
      ])
    );

    const selectedWorkerOrder =
      DEFAULT_WORKER_PRIORITY.filter((worker) => {
        const config =
          WORKER_CAPABILITY_REGISTRY[worker];

        if (!config) {
          return false;
        }

        if (externalBlocked) {
          return config.class === "local";
        }

        return true;
      });

    const selectedWorkerConfig =
      WORKER_CAPABILITY_REGISTRY[selectedWorker] ||
      WORKER_CAPABILITY_REGISTRY.local_brain_worker;

    return {
      selectedWorker,
      fallbackWorkers,
      reason,
      confidence,
      externalAIRequired,
      autoInvokeExternal,
      estimatedCostLevel: costClassification,
      approvalRequired:
        selectedWorker !== "local_brain_worker",
      founderApproved,
      externalExecutionEnabled: executionEnabled,
      writeRequired: needsWrite,
      allowedActions: Array.from(
        new Set(allowedActions)
      ),
      blockedActions,

      workerRoutingMetadata: {
        capabilityRegistry:
          WORKER_CAPABILITY_REGISTRY,
        defaultWorkerPriority:
          DEFAULT_WORKER_PRIORITY,
        selectedWorkerOrder,
        selectedWorkerAlias: selectedWorker,
        localWorkerDefault:
          selectedWorker === "local_brain_worker",
        selectedWorkerCapabilities:
          selectedWorkerConfig.capabilities,
        selectedWorkerSupportsWrite:
          selectedWorkerConfig.supportsWrite,
        selectedWorkerCostClass:
          selectedWorkerConfig.costClass,
        normalizedCostClassification:
          costClassification,
        freeExternalAllowed,
        externalBlocked,
        effectiveGoal: effectiveTask.goal,
        effectiveIntent: effectiveTask.intent,
        detectedWriteRequirement: needsWrite
      }
    };
  }
}

module.exports = WorkforceRouter;
module.exports.WorkforceRouter = WorkforceRouter;
module.exports.WORKER_CAPABILITY_REGISTRY =
  WORKER_CAPABILITY_REGISTRY;
module.exports.DEFAULT_WORKER_PRIORITY =
  DEFAULT_WORKER_PRIORITY;
module.exports.hasFounderApproval =
  hasFounderApproval;
module.exports.externalExecutionEnabled =
  externalExecutionEnabled;
module.exports.normalizeCostClassification =
  normalizeCostClassification;
module.exports.taskNeedsWrite =
  taskNeedsWrite;
