const fs = require("fs");
const path = require("path");
const { areDependenciesMet, getNextSteps, isGoalComplete, isGoalFailed } = require("./goalSchema");

const MAX_STEPS = 50;
const MAX_RETRIES = 1;

function executeGoal(goal, handlers = {}) {
  const log = [];
  let stepsExecuted = 0;

  while (!isGoalComplete(goal) && !isGoalFailed(goal) && stepsExecuted < MAX_STEPS) {
    const nextSteps = getNextSteps(goal);
    if (nextSteps.length === 0) break;

    for (const step of nextSteps) {
      if (stepsExecuted >= MAX_STEPS) break;
      executeStep(goal, step, handlers, log);
      stepsExecuted++;
    }
  }

  if (isGoalComplete(goal)) {
    goal.status = "completed";
    goal.completedAt = new Date().toISOString();
  } else if (isGoalFailed(goal)) {
    goal.status = "failed";
  } else if (stepsExecuted >= MAX_STEPS) {
    goal.status = "failed";
    goal.evidence.push({ type: "error", message: `Execution limit reached (${MAX_STEPS} steps)` });
  }

  return { goal, log, stepsExecuted };
}

function executeStep(goal, step, handlers, log) {
  step.status = "running";
  step.startedAt = new Date().toISOString();

  const handler = handlers[step.type] || defaultHandler;

  try {
    const result = handler(goal, step);
    step.status = "completed";
    step.result = result;
    step.completedAt = new Date().toISOString();
    step.evidence.push({ type: "completion", message: `Step completed: ${step.description}`, timestamp: new Date().toISOString() });
    log.push({ stepId: step.id, type: step.type, status: "completed", timestamp: new Date().toISOString() });
  } catch (err) {
    step.status = "failed";
    step.error = err.message;
    step.completedAt = new Date().toISOString();
    step.evidence.push({ type: "error", message: err.message, timestamp: new Date().toISOString() });
    log.push({ stepId: step.id, type: step.type, status: "failed", error: err.message, timestamp: new Date().toISOString() });
    goal.evidence.push({ type: "step_failed", stepId: step.id, error: err.message });
  }
}

function defaultHandler(goal, step) {
  return { message: `Default handler executed for: ${step.description}`, skipped: true };
}

function createAnalysisHandler(repoIntelService) {
  return function analyzeHandler(goal, step) {
    if (!repoIntelService) return { message: "Repo intelligence not available", skipped: true };
    try {
      const graph = repoIntelService.buildFullGraph();
      return {
        fileCount: graph.fileGraph.totalFiles || 0,
        routeCount: graph.routeMapper.totalRoutes || 0,
        testCount: graph.testMapper.totalTests || 0,
        message: `Analyzed: ${graph.fileGraph.totalFiles} files, ${graph.routeMapper.totalRoutes} routes`
      };
    } catch (err) {
      return { message: `Analysis failed: ${err.message}`, error: true };
    }
  };
}

function createModifyHandler(safeModService) {
  return function modifyHandler(goal, step) {
    if (!step.filePath) return { message: "No file path specified", skipped: true };
    if (!safeModService) return { message: "Safe modification service not available", skipped: true };
    return { message: `Modification prepared for: ${step.filePath}`, ready: true };
  };
}

function createTestHandler(testDiscoveryService) {
  return function testHandler(goal, step) {
    if (!testDiscoveryService) return { message: "Test discovery not available", skipped: true };
    try {
      const discovered = testDiscoveryService.discoverTests();
      return { testFiles: discovered.testFiles.length, message: `Found ${discovered.testFiles.length} test files` };
    } catch (err) {
      return { message: `Test discovery failed: ${err.message}`, error: true };
    }
  };
}

function createReviewHandler(codeReviewService) {
  return function reviewHandler(goal, step) {
    if (!step.filePath) return { message: "No file to review", skipped: true };
    if (!codeReviewService) return { message: "Code review service not available", skipped: true };
    return { message: `Review prepared for: ${step.filePath}`, ready: true };
  };
}

function generateReport(goal) {
  const completedSteps = goal.steps.filter((s) => s.status === "completed");
  const failedSteps = goal.steps.filter((s) => s.status === "failed");
  const skippedSteps = goal.steps.filter((s) => s.status === "skipped");
  return {
    goalId: goal.id,
    goalType: goal.type,
    title: goal.title,
    status: goal.status,
    summary: `${completedSteps.length}/${goal.steps.length} steps completed`,
    completedSteps: completedSteps.map((s) => ({ id: s.id, type: s.type, description: s.description })),
    failedSteps: failedSteps.map((s) => ({ id: s.id, type: s.type, description: s.description, error: s.error })),
    skippedSteps: skippedSteps.map((s) => ({ id: s.id, type: s.type, description: s.description })),
    evidence: goal.evidence,
    createdAt: goal.createdAt,
    completedAt: goal.completedAt,
    duration: goal.completedAt ? new Date(goal.completedAt) - new Date(goal.createdAt) : null
  };
}

module.exports = {
  executeGoal, executeStep, generateReport,
  createAnalysisHandler, createModifyHandler, createTestHandler, createReviewHandler,
  MAX_STEPS
};
