function understandGoal(goal = "") {
  const text = String(goal).toLowerCase();

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

  return result;
}

module.exports = { understandGoal };