const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { scanRepository } = require("../src/motherCore/scanner/scannerEngine");
const { createTaskQueue } = require("../src/motherCore/tasks/taskQueueEngine");
const { validateProject } = require("../src/motherCore/testing/validatorEngine");
const { createPlan } = require("../src/motherCore/agents/plannerAgent");
const { createBuildIntent } = require("../src/motherCore/agents/builderAgent");
const { saveMemorySnapshot } = require("../src/motherCore/memory/projectMemory");

const root = process.cwd();

function run(cmd) {
  try {
    return { ok: true, output: execSync(cmd, { encoding: "utf8" }).trim() };
  } catch (error) {
    return { ok: false, output: String(error.stdout || error.stderr || error.message).trim() };
  }
}

const branch = run("git branch --show-current");
const commit = run("git rev-parse --short HEAD");
const status = run("git status --short");

const scanReport = scanRepository(root);
const taskQueue = createTaskQueue(scanReport);
const validator = validateProject(scanReport);

const planningBase = {
  engine: "GARUDA Mother Core Agent v6",
  branch: branch.output || "unknown",
  commit: commit.output || "unknown",
  generatedAt: new Date().toISOString(),
  gitClean: !status.output,
  scanner: scanReport,
  taskQueue,
  validator
};

const planner = createPlan(planningBase);
const builder = createBuildIntent({ ...planningBase, planner });

const report = {
  ...planningBase,
  planner,
  builder,
  decision: validator.status === "failed"
    ? "Validation failed. Fix syntax errors before next build."
    : planner.priorityTask.title,
  nextAction: builder.safeActions[0] ? builder.safeActions[0].action : planner.plan[0]
};

const memory = saveMemorySnapshot(report);
report.memory = {
  engine: memory.engine,
  totalRuns: memory.runs.length,
  latest: memory.latest
};

fs.mkdirSync(path.join(root, "reports"), { recursive: true });
fs.writeFileSync(path.join(root, "reports", "mother-core-agent-report.json"), JSON.stringify(report, null, 2));

console.log("GARUDA MOTHER CORE AGENT v6");
console.log("===========================");
console.log("Branch:", report.branch);
console.log("Commit:", report.commit);
console.log("Git Clean:", report.gitClean ? "YES" : "NO");
console.log("");
console.log("Scanner:", scanReport.summary.findings, "findings");
console.log("Validator:", validator.status, "| Failed:", validator.failedChecks);
console.log("Planner:", planner.priorityTask.title);
console.log("Builder:", builder.status, "| Safe Actions:", builder.safeActions.length);
console.log("Memory Runs:", report.memory.totalRuns);
console.log("");
console.log("Decision:", report.decision);
console.log("Next Action:", report.nextAction);
console.log("Report saved: reports/mother-core-agent-report.json");
