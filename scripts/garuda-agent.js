const fs = require("fs");
const path = require("path");
const { scanRepository } = require("../src/motherCore/scanner/scannerEngine");
const { createTaskQueue } = require("../src/motherCore/tasks/taskQueueEngine");
const { validateProject } = require("../src/motherCore/testing/validatorEngine");
const { createPlan } = require("../src/motherCore/agents/plannerAgent");
const { createBuildIntent } = require("../src/motherCore/agents/builderAgent");
const { executeSafeActions } = require("../src/motherCore/executor/safeExecutor");
const { saveMemorySnapshot } = require("../src/motherCore/memory/projectMemory");
const { understandGoal } = require("./mother/goalEngine");
const { decompose } = require("./mother/taskDecomposer");
const { prioritize } = require("./mother/priorityEngine");
const { think } = require("./mother/thinker");

const root = process.cwd();
const manifestPath = path.join(root, "GARUDA_AGENT_MANIFEST.json");

function loadManifest() {
  try {
    return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch {
    return {};
  }
}

const manifest = loadManifest();

function deriveDecisionContext(context) {
  const {
    validator,
    planner,
    builder,
    executor,
    scanReport,
    thinkerFindings
  } = context;

  const blockedByApproval = Array.isArray(builder.blockedActions)
    && builder.blockedActions.some((action) => action && action.requiresFounderApproval === true);
  const criticalFindings = thinkerFindings.filter((item) => item && item.severity === "critical").length;

  if (validator.status !== "passed") {
    return {
      decision: "BLOCKED_BY_VALIDATION",
      category: "validation",
      blockedByApproval
    };
  }

  if (blockedByApproval) {
    return {
      decision: "BLOCKED_BY_APPROVAL",
      category: "governance",
      blockedByApproval
    };
  }

  if (executor.changedFiles > 0) {
    return {
      decision: "CONTINUE_SAFE_AUTONOMY",
      category: "execution",
      blockedByApproval
    };
  }

  if ((scanReport.summary && scanReport.summary.findings > 0) || criticalFindings > 0) {
    return {
      decision: planner.priorityTask.title,
      category: "planning",
      blockedByApproval
    };
  }

  return {
    decision: planner.priorityTask.title,
    category: "stable",
    blockedByApproval
  };
}

function deriveNextAction(context) {
  const { planner, validator, decisionContext } = context;
  const plan = Array.isArray(planner.plan) ? planner.plan : [];

  if (!plan.length) {
    return "Monitor runtime context and wait for new scanner or thinker signals.";
  }

  if (validator.status !== "passed") {
    return plan.find((step) => /repair|fix|inspect|validator/i.test(step)) || plan[0];
  }

  if (decisionContext.blockedByApproval) {
    return plan.find((step) => /approval|review|risky/i.test(step)) || plan[0];
  }

  return plan[0];
}

const scanReport = scanRepository(root);
const taskQueue = createTaskQueue(scanReport);
const validator = validateProject(scanReport);
const goal = understandGoal(manifest.currentModule || manifest.currentPhase || "improve garuda autonomy");
const goalTasks = prioritize(decompose(goal));
const thinkerFindings = think({
  projectClean: scanReport.summary.findings === 0,
  summary: {
    modified: scanReport.summary.findings,
    untracked: 0,
    deleted: 0,
    renamed: 0
  },
  constitution: { laws: manifest.laws || [] },
  tasks: goalTasks
});

const baseReport = {
  engine: "GARUDA Mother Core Agent v7",
  generatedAt: new Date().toISOString(),
  runtimeContext: {
    phase: manifest.currentPhase || "unknown",
    module: manifest.currentModule || "unknown",
    moduleId: manifest.moduleId || "unknown",
    founderApprovalMode: manifest.founderApprovalMode || "required",
    governanceEnabled: !!(manifest.executionGovernance && manifest.executionGovernance.enabled)
  },
  goal,
  goalTasks,
  thinkerFindings,
  scanner: scanReport,
  taskQueue,
  validator
};

const planner = createPlan(baseReport);
const builder = createBuildIntent({ ...baseReport, planner });
const executor = validator.status === "passed"
  ? executeSafeActions(planner)
  : { engine: "GARUDA Safe Executor v1", executed: [], changedFiles: 0, blocked: "validation_failed" };

const decisionContext = deriveDecisionContext({
  validator,
  planner,
  builder,
  executor,
  scanReport,
  thinkerFindings
});

const decision = decisionContext.decision;
const nextAction = deriveNextAction({
  planner,
  validator,
  decisionContext
});

const report = {
  ...baseReport,
  planner,
  builder,
  executor,
  decisionCategory: decisionContext.category,
  decision,
  nextAction
};

const memory = saveMemorySnapshot({
  ...report,
  branch: manifest.currentPhase || "unknown",
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
