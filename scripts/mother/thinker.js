function think(context = {}) {
  console.log("[Thinker] Starting...");

  const decisions = [];

  if (context.projectClean === false) {
    decisions.push("Run Scanner");
  }

  if (context.buildRequired === true) {
    decisions.push("Run Builder");
  }

  if (context.validateRequired === true) {
    decisions.push("Run Validator");
  }

  if (decisions.length === 0) {
    decisions.push("No action required");
  }

  console.log("[Thinker] Decision:");
  decisions.forEach((d, i) => console.log(`${i + 1}. ${d}`));

  return decisions;
}

module.exports = { think };