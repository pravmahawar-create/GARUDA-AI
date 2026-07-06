function execute(plannedTasks = []) {
  console.log("[Executor] Starting...");

  const executedTasks = plannedTasks.map((item) => {
    let engine = "General";

    const task = item.task.toLowerCase();

    if (task.includes("build")) engine = "Builder";
    else if (task.includes("valid")) engine = "Validator";
    else if (task.includes("analy")) engine = "Thinker";
    else if (task.includes("commit")) engine = "Git";
    else if (task.includes("patch")) engine = "Patch";
    else if (task.includes("test")) engine = "Test";

    return {
      ...item,
      engine,
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
