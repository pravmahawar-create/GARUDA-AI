const fs = require("fs");

function createFinding(severity, category, reason, recommendation) {
  return { severity, category, reason, recommendation };
}

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function detectArchitectureWeaknesses(findings) {
  const reporter = readFileSafe("scripts/mother/reporter.js");
  const patchEngine = readFileSafe("scripts/mother/patchEngine.js");
  const router = readFileSafe("scripts/mother/router.js");
  const executor = readFileSafe("scripts/mother/executor.js");

  if (
    reporter.includes("Scanner : OK") &&
    reporter.includes("Validator : OK")
  ) {
    findings.push(
      createFinding(
        "high",
        "reporting",
        "Reporter only prints static OK messages.",
        "Upgrade Reporter to consume real cycle results."
      )
    );
  }

  if (
    patchEngine.includes("original.replace") &&
    !patchEngine.includes("backup")
  ) {
    findings.push(
      createFinding(
        "critical",
        "patch-engine",
        "Patch Engine can write files without backup or rollback.",
        "Add backup and rollback support to Patch Engine."
      )
    );
  }

  const routerClassifiesTasks =
    router.includes("function routeTask") &&
    router.includes('return "general"');

  const executorImportsRouter =
    executor.includes('require("./router")') &&
    executor.includes("routeTask(item.task)");

  const executorRunsRoutedEngines =
    executor.includes("function executeAvailableEngine") &&
    executor.includes("executeAvailableEngine(route, item)");

  const executorHasStructuredStates =
    executor.includes('status = "SUCCESS"') &&
    executor.includes('status = "FAILED"') &&
    executor.includes('status = "SKIPPED"') &&
    executor.includes('status = "BLOCKED_BY_APPROVAL"');

  const executorReturnsStructuredTaskResult =
    executor.includes("route,") &&
    executor.includes("engine: toEngineName(route)") &&
    executor.includes("status,") &&
    executor.includes("reason,") &&
    executor.includes("result,");

  if (
    routerClassifiesTasks &&
    (
      !executorImportsRouter ||
      !executorRunsRoutedEngines ||
      !executorHasStructuredStates ||
      !executorReturnsStructuredTaskResult
    )
  ) {
    findings.push(
      createFinding(
        "high",
        "execution-router",
        "Task routing is not fully connected to structured engine execution.",
        "Connect Router classifications to Executor engine execution with structured results."
      )
    );
  }

  if (
    executor.includes('status = "EXECUTED"') &&
    !executor.includes('status = "FAILED"')
  ) {
    findings.push(
      createFinding(
        "high",
        "executor",
        "Executor marks tasks executed without real success/failure handling.",
        "Add SUCCESS/FAILED/SKIPPED result states."
      )
    );
  }
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
    findings.push(
      createFinding(
        "high",
        "git",
        "Working tree has pending changes.",
        "Review and commit pending changes after validation."
      )
    );
  }

  if (summary.untracked > 0) {
    findings.push(
      createFinding(
        "medium",
        "git",
        "New untracked files detected.",
        "Review new files before commit."
      )
    );
  }

  detectArchitectureWeaknesses(findings);

  if (state.constitution && state.constitution.laws) {
    findings.push(
      createFinding(
        "critical",
        "governance",
        `${state.constitution.laws.length} constitution laws loaded.`,
        "Apply constitution checks before autonomous code changes."
      )
    );
  }

  if (state.tasks && state.tasks.length) {
    state.tasks.forEach((task) => {
      findings.push(
        createFinding(
          "medium",
          "goal",
          `Goal task identified: ${task}`,
          task
        )
      );
    });
  }

  console.log("[Thinker] Findings:");
  findings.forEach((item, index) => {
    console.log(
      `${index + 1}. [${item.severity}] ${item.recommendation}`
    );
  });

  return findings;
}

module.exports = { think };