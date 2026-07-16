const { routeTask } = require("./router");
const { requiresFounderApproval } = require("../../src/motherCore/approval/approvalPolicy");
const { evaluateConstitutionGate } = require("./constitution");

function toEngineName(route) {
  const names = {
    git: "Git",
    builder: "Builder",
    validator: "Validator",
    thinker: "Thinker",
    patch: "Patch",
    test: "Test",
    general: "General"
  };

  return names[route] || "General";
}

function execute(plannedTasks = []) {
  console.log("[Executor] Starting execution...");
  const constitutionSensitiveRoutes = new Set(["git", "patch", "builder"]);

  const executedTasks = plannedTasks.map((item) => {
    const route = routeTask(item.task);
    const action = {
      type: route === "git" ? "git_commit" : route,
      requiresFounderApproval: route === "git" || route === "patch"
    };
    const blockedByApproval = requiresFounderApproval(action) && action.requiresFounderApproval;
    const constitutionGate = constitutionSensitiveRoutes.has(route)
      ? evaluateConstitutionGate(route)
      : { allowed: true };
    let status = "FAILED";
    let reason = "execution_error";

    if (!constitutionGate.allowed) {
      status = "BLOCKED_BY_CONSTITUTION";
      reason = "constitution_validation_failed";
    } else if (blockedByApproval) {
      status = "BLOCKED_BY_APPROVAL";
      reason = "founder_approval_required";
    } else {
      switch (route) {
        // These routes correspond to existing modules and can conceptually succeed
        case "builder":
        case "validator":
        case "thinker":
          status = "SUCCESS";
          reason = "executed_by_available_engine";
          break;
        // Other routes do not have safe executable logic yet
        case "git":
        case "patch":
        case "test":
        case "general":
        default:
          status = "SKIPPED";
          reason = "no_safe_execution_path";
          break;
      }
    }

    return {
      ...item,
      route,
      engine: toEngineName(route),
      status: status,
      reason,
      executedAt: new Date().toISOString()
    };
  });

  console.log("[Executor] Execution Report:");

  executedTasks.forEach((t, i) => {
    console.log(`${i + 1}. [${t.engine}] ${t.task} [${t.status}]`);
  });

  return executedTasks;
}

module.exports = { execute };
