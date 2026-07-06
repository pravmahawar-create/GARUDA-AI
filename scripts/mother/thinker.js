function createFinding(severity, category, reason, recommendation) {
  return { severity, category, reason, recommendation };
}

function think(state = {}) {
  console.log("[Thinker] Starting...");

  const findings = [];

  const summary = state.summary || {
    modified: 0,
    untracked: 0,
    deleted: 0,
    renamed: 0
  };

  if (!state.projectClean) {
    findings.push(createFinding(
      "high",
      "git",
      "Working tree has pending changes.",
      "Review and commit pending changes after validation."
    ));
  }

  if (summary.untracked > 0) {
    findings.push(createFinding(
      "medium",
      "git",
      "New untracked files detected.",
      "Review new files before commit."
    ));
  }

  if (summary.deleted > 0) {
    findings.push(createFinding(
      "high",
      "safety",
      "Deleted files detected.",
      "Verify deleted files before continuing."
    ));
  }

  if (summary.modified > 5) {
    findings.push(createFinding(
      "medium",
      "risk",
      "Large change set detected.",
      "Split changes into smaller validated commits."
    ));
  }

  if (summary.renamed > 0) {
    findings.push(createFinding(
      "medium",
      "git",
      "Renamed files detected.",
      "Verify renamed files before commit."
    ));
  }

  if (state.tasks && state.tasks.length) {
    state.tasks.forEach((task) => {
      findings.push(createFinding(
        "medium",
        "goal",
        `Goal task identified: ${task}`,
        task
      ));
    });
  }

  if (state.constitution && state.constitution.laws) {
    findings.push(createFinding(
      "critical",
      "governance",
      `${state.constitution.laws.length} constitution laws loaded.`,
      "Apply constitution checks before autonomous code changes."
    ));
  }

  if (findings.length === 0) {
    findings.push(createFinding(
      "low",
      "idle",
      "No major issues detected.",
      "System Idle"
    ));
  }

  console.log("[Thinker] Findings:");
  findings.forEach((item, index) => {
    console.log(`${index + 1}. [${item.severity}] ${item.recommendation}`);
  });

  return findings;
}

module.exports = { think };
