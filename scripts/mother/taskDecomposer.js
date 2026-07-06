function decompose(goal) {
  const tasks = [];

  switch (goal.intent) {
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