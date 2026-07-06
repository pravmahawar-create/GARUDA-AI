function think(state = {}) {
  console.log("[Thinker] Starting...");

  const decisions = [];

  const summary = state.summary || {
    modified: 0,
    untracked: 0,
    deleted: 0,
    renamed: 0
  };

  if (!state.projectClean) {
    decisions.push("Commit pending changes");
  }

  if (summary.untracked > 0) {
    decisions.push("Review new files before commit");
  }

  if (summary.deleted > 0) {
    decisions.push("Verify deleted files");
  }

  if (summary.modified > 5) {
    decisions.push("Large change set detected");
  }

  if (summary.renamed > 0) {
    decisions.push("Verify renamed files");
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

  const unique = [...new Set(decisions)];

  console.log("[Thinker] Decision:");
  unique.forEach((item, index) => {
    console.log(`${index + 1}. ${item}`);
  });

  return unique;
}

module.exports = { think };