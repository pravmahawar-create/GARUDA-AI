function decompose(goal) {
  const tasks = [];
  const selectedTarget = goal && goal.target ? goal.target : null;
  const capabilityLabel = selectedTarget && selectedTarget.capabilityId
    ? selectedTarget.capabilityId
    : goal && goal.capabilityTarget && goal.capabilityTarget.id
      ? goal.capabilityTarget.id
    : null;
  const targetLabel = capabilityLabel || goal.targetName || "requested artifact";

  if (goal.intent === "self_development_meta") {
    tasks.push("Inspect current body capability snapshot and evidence");
    tasks.push("Generate self-development candidates from body evidence");
    tasks.push("Select highest-value eligible capability target");
    return tasks;
  }

  if (goal.actionType === "creation" || goal.intent === "create_code_artifact") {
    tasks.push(`Analyze project structure and target location for ${targetLabel}`);
    tasks.push(`Implement required module ${targetLabel}`);
    tasks.push(`Review implementation of ${targetLabel}`);
    tasks.push(`Run unit tests for ${targetLabel}`);
    return tasks;
  }

  if (goal.intent === "self_development_improvement") {
    tasks.push(`Inspect capability implementation surface for ${targetLabel}`);
    tasks.push(`Diagnose root cause for ${targetLabel} degradation`);
    tasks.push(`Modify or connect ${targetLabel} within bounded capability scope`);
    tasks.push(`Inspect diff attribution for ${targetLabel}`);
    tasks.push(`Discover and execute verification for ${targetLabel}`);
    tasks.push(`Review actual ${targetLabel} change`);
    tasks.push(`Refresh capability state for ${targetLabel}`);
    return tasks;
  }

  if (goal.actionType === "modification" || goal.intent === "modify_code_artifact") {
    tasks.push(`Inspect target code and issue for ${targetLabel}`);
    tasks.push(`Implement modification for ${targetLabel}`);
    tasks.push(`Review patch for ${targetLabel}`);
    tasks.push(`Run unit tests for ${targetLabel}`);
    return tasks;
  }

  if (goal.intent === "read_only_audit") {
    const querySubject = goal.rawGoal || targetLabel;
    tasks.push(`Perform read-only repository inspection for ${querySubject}`);
    return tasks;
  }

  if (goal.actionType === "verification" || goal.intent === "verify_code_artifact") {
    tasks.push(`Inspect test surface for ${targetLabel}`);
    tasks.push(`Run unit test verification for ${targetLabel}`);
    return tasks;
  }

  switch (goal.intent) {
    case "develop_revenue_model":
      tasks.push("Analyze existing Revenue Engine");
      tasks.push("Plan Revenue Engine integration with Mother Brain");
      tasks.push("Validate Revenue Engine integration");
      break;

    case "improve_autonomy":
      tasks.push("Analyze current Mother architecture");
      tasks.push("Find missing brain modules");
      tasks.push("Generate implementation plan");
      tasks.push("Run validation");
      break;

    case "improve_visible_experience":
      tasks.push("Analyze frontend");
      tasks.push("Create UI improvement plan");
      break;

    case "improve_system_intelligence":
      tasks.push("Analyze backend");
      tasks.push("Improve RAG");
      break;

    default:
      tasks.push("Analyze project");
  }

  return tasks;
}

module.exports = { decompose };
