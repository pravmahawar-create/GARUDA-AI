const fs = require("fs");
const path = require("path");

function summarizeStatuses(executedTasks = []) {
  const summary = {
    SUCCESS: 0,
    SKIPPED: 0,
    FAILED: 0,
    BLOCKED_BY_APPROVAL: 0
  };

  executedTasks.forEach((task) => {
    if (summary[task.status] !== undefined) {
      summary[task.status] += 1;
    }
  });

  return summary;
}

function report(cycle = {}) {
  console.log("[Reporter] GARUDA Mother Report");

  const scanResult = cycle.scanResult || { clean: true, summary: {} };
  const executedTasks = cycle.executedTasks || [];
  const validation = cycle.validation || { passed: true };
  const statusSummary = summarizeStatuses(executedTasks);

  console.log("Scanner :", scanResult.clean ? "CLEAN" : "CHANGES_DETECTED");
  console.log("Validation :", validation.passed ? "PASSED" : "FAILED");
  console.log("Governance :", cycle.governance && cycle.governance.status ? cycle.governance.status : "unknown");
  console.log("Executed Tasks :", executedTasks.length);
  console.log("Status Summary :", JSON.stringify(statusSummary));

  if (executedTasks.length) {
    console.log("[Executed]");
    executedTasks.forEach((task, index) => {
      console.log(`${index + 1}. [${task.engine || "General"}] ${task.task} -> ${task.status} (${task.reason || "n/a"})`);
    });
  }

  const artifact = {
    engine: "GARUDA Mother Reporter v1",
    generatedAt: new Date().toISOString(),
    scan: {
      clean: scanResult.clean,
      summary: scanResult.summary || {}
    },
    validation,
    governance: cycle.governance || { status: "unknown" },
    nextAction: cycle.nextAction || "none",
    statusSummary,
    executedTasks
  };

  const reportsDir = path.join(process.cwd(), "reports");
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(
    path.join(reportsDir, "mother-cycle-report.json"),
    JSON.stringify(artifact, null, 2)
  );

  console.log("Mother Cycle Completed");
}

module.exports = { report };
