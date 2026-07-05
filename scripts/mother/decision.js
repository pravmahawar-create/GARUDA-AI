function decide(context = {}, decisions = []) {
  console.log("[Decision] Starting...");

  const plan = [];

  if (!context.clean) {
    plan.push("Commit pending changes");
  }

  plan.push(...decisions);

  if (plan.length === 0) {
    plan.push("System Idle");
  }

  console.log("[Decision] Final Plan:");

  plan.forEach((step, index) => {
    console.log(`${index + 1}. ${step}`);
  });

  return plan;
}

module.exports = { decide };