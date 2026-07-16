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

function summarizeBrains(tasks = []) {
  const summary = {};

  tasks.forEach((task) => {
    const worker = task.workerType || task.worker || task.selectedBrain || "unknown";
    summary[worker] = (summary[worker] || 0) + 1;
  });

  return summary;
}

function report(cycle = {}) {
  console.log("[Reporter] GARUDA Mother Report");

  const scanResult = cycle.scanResult || { clean: true, summary: {} };
  const executedTasks = cycle.executedTasks || [];
  const validation = cycle.validation || { passed: true };
  const statusSummary = summarizeStatuses(executedTasks);
  const multiBrain = cycle.multiBrain || null;
  const memory = cycle.memory || null;
  const bible = cycle.bible || null;
  const workforce = cycle.workforce || null;

  console.log("Scanner :", scanResult.clean ? "CLEAN" : "CHANGES_DETECTED");
  console.log("Validation :", validation.passed ? "PASSED" : "FAILED");
  console.log("Governance :", cycle.governance && cycle.governance.status ? cycle.governance.status : "unknown");
  console.log("Executed Tasks :", executedTasks.length);
  console.log("Status Summary :", JSON.stringify(statusSummary));

  if (multiBrain) {
    console.log("Founder Approval Required :", multiBrain.founderApprovalRequired ? "YES" : "NO");
    console.log("Selected Brains :", JSON.stringify(multiBrain.selectedBrains || []));
    console.log("Dependency Order :", JSON.stringify(multiBrain.dependencyOrder || []));
    console.log("Multi-Brain Validation :", multiBrain.validation ? multiBrain.validation.status : "unknown");
    console.log("Multi-Brain Task Count :", Array.isArray(multiBrain.tasks) ? multiBrain.tasks.length : 0);
    console.log("Task Brain Summary :", JSON.stringify(summarizeBrains(multiBrain.tasks || [])));
  }

  if (memory) {
    console.log("Memory Status :", memory.status || "unknown");
    console.log("Memory Fingerprint :", memory.recordFingerprint || "none");
  }

  if (bible) {
    console.log("Bible Validation Status :", bible.validationStatus || "unknown");
    console.log("Bible Version :", JSON.stringify(bible.version || {}));
    console.log("Bible Loaded Chapters :", JSON.stringify(bible.loadedChapters || []));
  }

  if (multiBrain && multiBrain.validation) {
    console.log("Approval Status :", multiBrain.validation.approvalStatus || "unknown");
  }

  if (multiBrain && multiBrain.workflow) {
    console.log("Workflow Status :", multiBrain.workflow.status || "unknown");
  }

  if (workforce) {
    console.log("Selected Worker :", workforce.selectedWorker || "unknown");
    console.log("Fallback Workers :", JSON.stringify(workforce.fallbackWorkers || []));
    console.log("Adapter Status :", workforce.adapterStatus || "unknown");
    console.log("Execution Mode :", workforce.executionMode || "unknown");
    console.log("Routing Reason :", workforce.routingReason || workforce.selectionReason || "unknown");
    console.log("Selection Reason :", workforce.selectionReason || workforce.routingReason || "unknown");
    console.log("External AI Required :", workforce.externalAIRequired ? "YES" : "NO");
    console.log("Estimated Cost :", workforce.estimatedCost || workforce.estimatedCostLevel || "unknown");
    console.log("Estimated Cost Level :", workforce.estimatedCostLevel || "unknown");
    console.log("Prompt Type :", workforce.promptType || "unknown");
    console.log("Prompt Fingerprint :", workforce.promptFingerprint || "none");
    console.log("Write Stopped :", workforce.writeStopped ? "YES" : "NO");
    console.log("Workforce Validation Status :", workforce.validationStatus || "unknown");
  }

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
    bible,
    multiBrain,
    workforce,
    memory,
    workerDispatch: cycle.workerDispatch || null,
    workerAdapter: cycle.workerAdapter || null,
    promptSummary: cycle.promptSummary || null,
    contextSummary: cycle.contextSummary || null,
    executedTasks
  };

  if (cycle.persistReport !== false) {
    const reportsDir = path.join(process.cwd(), "reports");
    fs.mkdirSync(reportsDir, { recursive: true });
    fs.writeFileSync(
      path.join(reportsDir, "mother-cycle-report.json"),
      JSON.stringify(artifact, null, 2)
    );
  }

  console.log("Mother Cycle Completed");

  return artifact;
}

module.exports = { report };
