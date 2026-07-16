const fs = require("fs");
const path = require("path");

const MEMORY_FILE = path.join(process.cwd(), "reports", "mother-core-memory.json");

function loadMemory() {
  if (!fs.existsSync(MEMORY_FILE)) {
    return {
      engine: "GARUDA Project Memory v1",
      createdAt: new Date().toISOString(),
      runs: []
    };
  }

  return JSON.parse(fs.readFileSync(MEMORY_FILE, "utf8"));
}

function saveMemorySnapshot(snapshot) {
  fs.mkdirSync(path.dirname(MEMORY_FILE), { recursive: true });

  const memory = loadMemory();
  memory.updatedAt = new Date().toISOString();

  const executionStatusSummary = {
    SUCCESS: 0,
    SKIPPED: 0,
    FAILED: 0,
    BLOCKED_BY_APPROVAL: 0
  };

  const executed = snapshot.executor && Array.isArray(snapshot.executor.executed)
    ? snapshot.executor.executed
    : [];

  executed.forEach((item) => {
    const status = item && item.status;
    if (executionStatusSummary[status] !== undefined) {
      executionStatusSummary[status] += 1;
    }
  });

  memory.runs.push({
    timestamp: new Date().toISOString(),
    branch: snapshot.branch,
    commit: snapshot.commit,
    gitClean: snapshot.gitClean,
    filesScanned: snapshot.scanner.summary.totalFiles,
    findings: snapshot.scanner.summary.findings,
    validationStatus: snapshot.validator.status,
    failedChecks: snapshot.validator.failedChecks,
    plannerStatus: snapshot.planner.status,
    decision: snapshot.decision,
    nextAction: snapshot.nextAction,
    phase: snapshot.runtimeContext && snapshot.runtimeContext.phase ? snapshot.runtimeContext.phase : null,
    module: snapshot.runtimeContext && snapshot.runtimeContext.module ? snapshot.runtimeContext.module : null,
    moduleId: snapshot.runtimeContext && snapshot.runtimeContext.moduleId ? snapshot.runtimeContext.moduleId : null,
    governanceStatus: snapshot.runtimeContext && snapshot.runtimeContext.governanceEnabled
      ? "enabled"
      : "disabled",
    executionStatusSummary
  });

  memory.latest = memory.runs[memory.runs.length - 1];

  fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));
  return memory;
}

module.exports = { loadMemory, saveMemorySnapshot };
