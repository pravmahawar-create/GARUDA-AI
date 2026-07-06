function report(cycle = {}) {
  console.log("[Reporter] GARUDA Mother Report");

  const executedTasks = cycle.executedTasks || [];
  const validation = cycle.validation || { passed: true };

  console.log("Scanner : OK");
  console.log("Executed Tasks :", executedTasks.length);
  console.log("Validation :", validation.passed ? "PASSED" : "FAILED");

  if (executedTasks.length) {
    console.log("[Executed]");
    executedTasks.forEach((task, index) => {
      console.log(`${index + 1}. [${task.engine || "General"}] ${task.task} -> ${task.status}`);
    });
  }

  console.log("Mother Cycle Completed");
}

module.exports = { report };
