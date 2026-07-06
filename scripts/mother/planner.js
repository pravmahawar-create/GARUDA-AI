function plan(executionPlan = []) {
  console.log("[Planner] Starting...");

  if (!Array.isArray(executionPlan) || executionPlan.length === 0) {
    console.log("No execution plan available.");
    return [];
  }

  const finalPlan = executionPlan.map((task, index) => ({
    step: index + 1,
    task,
    status: "PENDING"
  }));

  console.log("[Planner] Execution Plan:");

  finalPlan.forEach((item) => {
    console.log(`${item.step}. ${item.task} [${item.status}]`);
  });

  return finalPlan;
}

module.exports = { plan };