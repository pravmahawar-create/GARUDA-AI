function toPriority(severity = "medium") {
  if (severity === "critical" || severity === "high") return "P1";
  if (severity === "medium") return "P2";
  return "P3";
}

function uniquePlanItems(items = []) {
  return [...new Set(items.filter(Boolean))];
}

function toPriorityTaskFromFinding(finding = {}, index = 1) {
  const recommendation = typeof finding.recommendation === "string"
    ? finding.recommendation.trim()
    : "Review runtime finding";

  return {
    id: "GARUDA-PLAN-DYN-" + String(index).padStart(3, "0"),
    title: recommendation,
    priority: toPriority(finding.severity),
    type: finding.category || "context_improvement"
  };
}

function createPlan(agentReport) {
  const tasks = agentReport.taskQueue || [];
  const validator = agentReport.validator || { status: "unknown", failedChecks: 0 };
  const thinkerFindings = Array.isArray(agentReport.thinkerFindings) ? agentReport.thinkerFindings : [];
  const goal = agentReport.goal || { intent: "unknown", domain: "general" };
  const goalTasks = Array.isArray(agentReport.goalTasks) ? agentReport.goalTasks : [];
  const summary = agentReport.scanner && agentReport.scanner.summary ? agentReport.scanner.summary : { findings: 0 };

  if (validator.status === "failed") {
    return {
      engine: "GARUDA Planner Engine v2",
      status: "blocked_by_validation",
      priorityTask: {
        id: "GARUDA-PLAN-VALIDATION",
        title: `Repair validator failures (${validator.failedChecks || 0} checks failed)`,
        priority: "P1",
        type: "validation_repair"
      },
      plan: uniquePlanItems([
        "Inspect failed Validator Engine checks.",
        "Repair syntax or module integrity issues.",
        "Re-run validator pipeline before execution."
      ])
    };
  }

  if (tasks.length > 0) {
    return {
      engine: "GARUDA Planner Engine v2",
      status: "tasks_detected",
      priorityTask: tasks[0],
      plan: uniquePlanItems([
        tasks[0].title,
        `Resolve scanner findings (${summary.findings || tasks.length} open).`,
        "Re-run Mother Core Agent for updated planning context.",
        "Validate repository health."
      ])
    };
  }

  const rankedFindings = thinkerFindings
    .slice()
    .sort((a, b) => {
      const order = { critical: 4, high: 3, medium: 2, low: 1 };
      return (order[b.severity] || 0) - (order[a.severity] || 0);
    });

  const topFinding = rankedFindings[0];
  const priorityTask = topFinding
    ? toPriorityTaskFromFinding(topFinding)
    : {
        id: "GARUDA-PLAN-DYN-000",
        title: `Advance ${goal.domain || "system"} goal: ${goal.intent || "stabilize_runtime"}`,
        priority: "P2",
        type: "goal_progress"
      };

  const planFromFindings = rankedFindings.slice(0, 3).map((finding) => finding.recommendation);
  const planFromGoal = goalTasks.slice(0, 2);

  return {
    engine: "GARUDA Planner Engine v2",
    status: rankedFindings.length ? "context_driven_ready" : "goal_driven_ready",
    priorityTask,
    plan: uniquePlanItems([
      priorityTask.title,
      ...planFromFindings,
      ...planFromGoal,
      "Run validation before any risky action."
    ])
  };
}

module.exports = { createPlan };
