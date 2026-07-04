function createBuildIntent(agentReport) {
  const planner = agentReport.planner || {};
  const priorityTask = planner.priorityTask || {};
  const safeActions = [];

  if (priorityTask.type === "mother_core_expansion") {
    safeActions.push({
      id: "GARUDA-BUILD-001",
      action: "prepare_builder_execution_engine",
      status: "ready",
      risk: "low",
      requiresFounderApproval: false,
      description: "Builder Execution Engine active hai aur safe build intents create kar sakta hai."
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
