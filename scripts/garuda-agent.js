const fs = require("fs");
const path = require("path");
const { scanRepository } = require("../src/motherCore/scanner/scannerEngine");
const { createTaskQueue } = require("../src/motherCore/tasks/taskQueueEngine");
const { validateProject } = require("../src/motherCore/testing/validatorEngine");
const { createPlan } = require("../src/motherCore/agents/plannerAgent");
const { createBuildIntent } = require("../src/motherCore/agents/builderAgent");
const { executeSafeActions } = require("../src/motherCore/executor/safeExecutor");
const { saveMemorySnapshot } = require("../src/motherCore/memory/projectMemory");

const root = process.cwd();

const scanReport = scanRepository(root);
const taskQueue = createTaskQueue(scanReport);
const validator = validateProject(scanReport);

const baseReport = {
  engine: "GARUDA Mother Core Agent v7",
  generatedAt: new Date().toISOString(),
  scanner: scanReport,
  taskQueue,
  validator
};

const planner = createPlan(baseReport);
const builder = createBuildIntent({ ...baseReport, planner });
const executor = validator.status === "passed"
  ? executeSafeActions(planner)
  : { engine: "GARUDA Safe Executor v1", executed: [], changedFiles: 0, blocked: "validation_failed" };

const report = {
  ...baseReport,
  planner,
  builder,
  executor,
  decision: executor.changedFiles > 0
    ? "Safe Mother Core files auto-created."
    : planner.priorityTask.title,
  nextAction: executor.changedFiles > 0
    ? "Re-run npm run garuda:agent for validation."
    : "Continue next safe build action."
};

const memory = saveMemorySnapshot({
  ...report,
  branch: "phase-2.4-retrieval-intelligence",
  commit: "local",
  gitClean: false
});

report.memory = {
  totalRuns: memory.runs.length,
  latest: memory.latest
};

fs.mkdirSync(path.join(root, "reports"), { recursive: true });
fs.writeFileSync(path.join(root, "reports", "mother-core-agent-report.json"), JSON.stringify(report, null, 2));

console.log("GARUDA MOTHER CORE AGENT v7");
console.log("===========================");
console.log("Scanner:", scanReport.summary.findings, "findings");
console.log("Validator:", validator.status, "| Failed:", validator.failedChecks);
console.log("Planner:", planner.priorityTask.title);
console.log("Builder:", builder.status);
console.log("Safe Executor changed files:", executor.changedFiles);
console.log("Decision:", report.decision);
console.log("Next Action:", report.nextAction);
console.log("Report saved: reports/mother-core-agent-report.json");
