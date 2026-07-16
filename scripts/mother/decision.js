function toAction(item) {
  if (typeof item === "string") return item;
  if (item && typeof item.recommendation === "string") return item.recommendation;
  return "Review unknown decision";
}

function decide(context = {}, decisions = []) {
  console.log("[Decision] Starting...");

  const plan = [];
  const forbiddenPattern = /\b(commit|push|deploy)\b/i;

  // Governance rule: never recommend commit/push/deploy from autonomous planning.

  decisions.forEach((item) => {
    const action = toAction(item);

    if (!forbiddenPattern.test(action) && !plan.includes(action)) {
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
