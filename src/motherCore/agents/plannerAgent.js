function createPlan(agentReport) {
  const tasks = agentReport.taskQueue || [];
  const validator = agentReport.validator || { status: "unknown" };

  if (validator.status === "failed") {
    return {
      engine: "GARUDA Planner Engine v2",
      status: "blocked_by_validation",
      priorityTask: {
        id: "GARUDA-PLAN-VALIDATION",
        title: "Fix failed validation checks",
        priority: "P1",
        type: "validation_repair"
      },
      plan: [
        "Inspect failed Validator Engine checks.",
        "Fix syntax or broken module issues.",
        "Re-run npm run garuda:agent."
      ]
    };
  }

  if (tasks.length > 0) {
    return {
      engine: "GARUDA Planner Engine v2",
      status: "tasks_detected",
      priorityTask: tasks[0],
      plan: [
        "Resolve highest priority scanner task.",
        "Re-run Mother Core Agent.",
        "Validate repository health."
      ]
    };
  }

  return {
    engine: "GARUDA Planner Engine v2",
    status: "ready",
    priorityTask: {
      id: "GARUDA-PLAN-002",
      title: "Expand Mother Core with Builder Execution Engine",
      priority: "P1",
      type: "mother_core_expansion"
    },
    plan: [
      "Create Builder Execution Engine.",
      "Allow Mother Core to select safe build actions.",
      "Generate structured build reports.",
      "Require founder approval before risky actions."
    ]
  };
}

module.exports = { createPlan };
