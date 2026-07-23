function createBuildIntent(agentReport) {
  const planner = agentReport.planner || {};
  const priorityTask = planner.priorityTask || {};
  const safeActions = [];

  if (priorityTask.type === "mother_core_expansion") {
    safeActions.push({
      id: "GARUDA-BUILD-001",
      action: "prepare_builder_execution_engine",
      status: "approval_required",
      risk: "low",
      requiresFounderApproval: true,
      description: "Builder Execution Engine evidence-backed build intent prepare kar sakta hai; source changes Founder approval ke bina execute nahi honge."
    });
  }

  return {
    engine: "GARUDA Builder Execution Engine v1",
    status: safeActions.length ? "ready" : "idle",
    safeActions,
    blockedActions: [],
    note: "Builder risky changes direct execute nahi karega; pehle safe build intent generate karega."
  };
}

module.exports = { createBuildIntent };
