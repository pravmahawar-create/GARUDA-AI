function think(state = {}) {
  console.log("[Thinker] Starting...");

  const decisions = [];

  if (!state.projectClean) {
    decisions.push("Commit pending changes");
  }

  if (state.tasks && state.tasks.length) {
    decisions.push(...state.tasks);
  } else {
    if (state.buildRequired) {
      decisions.push("Run Builder");
    }

    if (state.validateRequired) {
      decisions.push("Run Validator");
    }
  }

  console.log("[Thinker] Decision:");
  decisions.forEach((item, index) => {
    console.log(`${index + 1}. ${item}`);
  });

  return decisions;
}

module.exports = { think };