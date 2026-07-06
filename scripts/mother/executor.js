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
  console.log("[Executor] Starting...");

  const executedTasks = plannedTasks.map((item) => {
    const route = routeTask(item.task);

    return {
      ...item,
      route,
      engine: toEngineName(route),
      status: "EXECUTED",
      executedAt: new Date().toISOString()
    };
  });

  console.log("[Executor] Executed Tasks:");

  executedTasks.forEach((t, i) => {
    console.log(`${i + 1}. [${t.engine}] ${t.task} [${t.status}]`);
  });

  return executedTasks;
}

module.exports = { execute };
