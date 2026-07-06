function execute(plannedTasks) {
  console.log("[Executor] Starting...");

  const executedTasks = plannedTasks.map((task) => ({
    ...task,
    status: "EXECUTED",
    executedAt: new Date().toISOString()
  }));

  console.log("[Executor] Executed Tasks:");
  executedTasks.forEach((task, index) => {
    console.log(`${index + 1}. ${task.task} [${task.status}]`);
  });

  return executedTasks;
}

module.exports = { execute };

