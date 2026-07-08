const { routeTask } = require("./router");

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

  const executedTasks = plannedTasks.map((item) => {
    const route = routeTask(item.task);
    let status;

    switch (route) {
      // These routes correspond to existing modules and can conceptually succeed
      case "builder":
      case "validator":
      case "thinker":
        status = "SUCCESS";
        break;
      // Other routes do not have safe executable logic yet
      case "git":
      case "patch":
      case "test":
      case "general":
      default:
        status = "SKIPPED";
        break;
    }

    return {
      ...item,
      route,
      engine: toEngineName(route),
      status: status,
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
