const { routeTask } = require("./router");
const { requiresFounderApproval } = require("../../src/motherCore/approval/approvalPolicy");
const { evaluateConstitutionGate } = require("./constitution");
const { think } = require("./thinker");
const { validate } = require("./validator");
const { build } = require("./builder");
const { executeRevenueTask } = require("./revenueEngine");
const LocalBrainWorker = require("../dev-agent/workers/LocalBrainWorker");

function toEngineName(route) {
  const names = {
    git: "Git",
    builder: "Builder",
    validator: "Validator",
    thinker: "Thinker",
    patch: "Patch",
    test: "Test",
    revenue: "Revenue",
    general: "Local Brain"
  };

  return names[route] || "Local Brain";
}

function getFounderApprovalState() {
  const founderApprovalToken = process.env.GARUDA_FOUNDER_APPROVAL_TOKEN || "";
  const founderApproved =
    process.env.GARUDA_FOUNDER_APPROVED === "true" ||
    Boolean(founderApprovalToken);

  return {
    founderApproved,
    founderApprovalToken: Boolean(founderApprovalToken)
  };
}

function executeThinkerTask(item) {
  const result = think({
    projectClean: true,
    summary: {},
    buildRequired: false,
    validateRequired: false,
    tasks: [item.task]
  });

  return {
    success: true,
    output: result
  };
}

function executeValidatorTask(item) {
  const result = validate([item]);

  return {
    success: Boolean(result && result.passed),
    output: result
  };
}

function executeTestTask(item) {
  const worker = new LocalBrainWorker({ role: "tester", rootDir: process.cwd() });
  const testFiles = Array.isArray(item.testFiles) ? item.testFiles : Array.isArray(item.files) ? item.files.filter((file) => /\.test\.(c?js|mjs)$/i.test(file)) : [];
  if (!testFiles.length) {
    return { success: false, skipped: true, reason: "test_task_requires_explicit_test_files", output: { status: "NOT_EXECUTED", evidence: [] } };
  }
  const evidence = worker.runExistingTests(testFiles);
  return { success: evidence.every((item) => item.status === "PASSED"), output: { status: evidence.every((item) => item.status === "PASSED") ? "PASSED" : "FAILED", evidence } };
}

function executeBuilderTask() {
  const result = build();

  return {
    success: true,
    output: result || { status: "BUILD_COMPLETED" }
  };
}

function executeLocalBrainTask(item) {
  const worker = new LocalBrainWorker({
    role: "executor",
    rootDir: process.cwd()
  });

  const taskText = String(item.task || "").toLowerCase();
  let output;

  if (taskText.includes("architecture")) {
    output = {
      taskType: "architecture_analysis",
      projectStructure: worker.readProjectStructure(3),
      fileSample: worker.scanFiles([]).slice(0, 50)
    };
  } else if (
    taskText.includes("missing") &&
    (taskText.includes("brain") || taskText.includes("module"))
  ) {
    const projectStructure = worker.readProjectStructure(4);
    const fileSample = worker.scanFiles([]).slice(0, 100);

    output = {
      taskType: "missing_module_analysis",
      projectStructure,
      inspectedFiles: fileSample,
      report: worker.prepareReports({
        summary: "Local Brain inspected the current project for missing brain or module coverage."
      })
    };
  } else if (
    taskText.includes("implementation plan") ||
    taskText.includes("generate plan") ||
    taskText.includes("implementation")
  ) {
    output = {
      taskType: "implementation_plan",
      report: worker.prepareReports({
        summary: `Implementation planning completed for task: ${item.task}`
      }),
      projectStructure: worker.readProjectStructure(2)
    };
  } else {
    output = {
      taskType: "general_read_only_execution",
      report: worker.prepareReports({
        summary: `Local Brain completed safe read-only execution for task: ${item.task}`
      }),
      projectStructure: worker.readProjectStructure(2),
      fileSample: worker.scanFiles([]).slice(0, 30)
    };
  }

  return {
    success: true,
    output
  };
}

function executeAvailableEngine(route, item) {
  switch (route) {
    case "thinker":
      return executeThinkerTask(item);
    case "validator":
      return executeValidatorTask(item);
    case "test":
      return executeTestTask(item);
    case "builder":
      return executeBuilderTask();
    case "revenue":
      return executeRevenueTask(item.task, { rootDir: process.cwd() });
    case "general":
      return executeLocalBrainTask(item);
    case "git":
      return {
        success: false,
        skipped: true,
        reason: "git_execution_requires_dedicated_safe_adapter"
      };
    case "patch":
      return {
        success: false,
        skipped: true,
        reason: "patch_execution_requires_dedicated_safe_adapter"
      };
    default:
      return executeLocalBrainTask(item);
  }
}

function execute(plannedTasks = []) {
  console.log("[Executor] Starting execution...");

  const constitutionSensitiveRoutes = new Set(["git", "patch", "builder"]);
  const approvalState = getFounderApprovalState();

  const executedTasks = plannedTasks.map((item) => {
    const route = routeTask(item.task);
    const action = {
      type: route === "git" ? "git_commit" : route,
      requiresFounderApproval: route === "git" || route === "patch"
    };

    const approvalRequired =
      requiresFounderApproval(action) &&
      action.requiresFounderApproval;

    const blockedByApproval =
      approvalRequired &&
      !approvalState.founderApproved;

    const constitutionGate = constitutionSensitiveRoutes.has(route)
      ? evaluateConstitutionGate(route)
      : { allowed: true };

    let status = "FAILED";
    let reason = "execution_error";
    let result = null;

    if (!constitutionGate.allowed) {
      status = "BLOCKED_BY_CONSTITUTION";
      reason = "constitution_validation_failed";
    } else if (blockedByApproval) {
      status = "BLOCKED_BY_APPROVAL";
      reason = "founder_approval_required";
    } else {
      try {
        result = executeAvailableEngine(route, item);

        if (result && result.skipped) {
          status = "SKIPPED";
          reason = result.reason || "no_safe_execution_path";
        } else if (result && result.success) {
          status = "SUCCESS";
          reason = "executed_by_available_engine";
        } else {
          status = "FAILED";
          reason =
            (result && result.reason) ||
            "engine_execution_failed";
        }
      } catch (error) {
        status = "FAILED";
        reason = "engine_execution_error";
        result = {
          success: false,
          error: error.message
        };
      }
    }

    return {
      ...item,
      route,
      engine: toEngineName(route),
      status,
      reason,
      result,
      approvalState: {
        required: approvalRequired,
        approved: approvalState.founderApproved
      },
      executedAt: new Date().toISOString()
    };
  });

  console.log("[Executor] Execution Report:");

  executedTasks.forEach((task, index) => {
    console.log(
      `${index + 1}. [${task.engine}] ${task.task} [${task.status}]`
    );
  });

  return executedTasks;
}

module.exports = { execute };
