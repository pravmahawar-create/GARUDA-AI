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
    nextAction: snapshot.nextAction
  });

  memory.latest = memory.runs[memory.runs.length - 1];

  fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));
  return memory;
}

module.exports = { loadMemory, saveMemorySnapshot };
