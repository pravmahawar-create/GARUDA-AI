function toAction(item) {
  if (typeof item === "string") return item;
  if (item && typeof item.recommendation === "string") return item.recommendation;
  return "Review unknown decision";
}

function decide(context = {}, decisions = []) {
  console.log("[Decision] Starting...");

  const plan = [];

  if (!context.clean) {
    plan.push("Commit pending changes");
  }

  decisions.forEach((item) => {
    const action = toAction(item);

    if (!plan.includes(action)) {
      plan.push(action);
    }
  });

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
