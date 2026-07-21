function understandGoal(goal = "") {
  const text = String(goal).toLowerCase();
  const engineeringKeywords = [
    "engineering",
    "engineer",
    "architecture",
    "worker",
    "workforce",
    "execution",
    "execution layer",
    "dispatcher",
    "adapter",
    "prompt builder",
    "bible",
    "memory",
    "routing",
    "guided self-development",
    "guided self development",
    "self development",
    "autonomous engineering",
    "multibrain",
    "planner",
    "validator",
    "reporter"
  ];
  const revenueKeywords = [
    "revenue",
    "income",
    "earning",
    "earnings",
    "settlement",
    "payout"
  ];

  const result = {
    rawGoal: goal,
    domain: "general",
    intent: "unknown",
    priority: "medium",
    requiresFounderApproval: false
  };

  if (text.includes("frontend") || text.includes("ui") || text.includes("kingdom")) {
    result.domain = "frontend";
    result.intent = "improve_visible_experience";
    result.priority = "high";
  }

  if (text.includes("backend") || text.includes("api") || text.includes("rag")) {
    result.domain = "backend";
    result.intent = "improve_system_intelligence";
    result.priority = "high";
  }

  if (text.includes("mother") || text.includes("autonomous") || text.includes("brain")) {
    result.domain = "mother";
    result.intent = "improve_autonomy";
    result.priority = "critical";
  }

  if (engineeringKeywords.some((keyword) => text.includes(keyword))) {
    result.domain = "engineering";
    result.intent = "improve_engineering_system";
    result.priority = "critical";
  }

  // Revenue must win over generic Mother/engineering matches so a goal such as
  // "integrate Revenue Engine with Mother Brain" reaches the revenue workflow.
  if (revenueKeywords.some((keyword) => text.includes(keyword))) {
    result.domain = "revenue";
    result.intent = "develop_revenue_model";
    result.priority = "critical";
  }

  return result;
}

module.exports = { understandGoal };
