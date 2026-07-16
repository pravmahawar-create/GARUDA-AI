function sanitizeFiles(files = []) {
  return files.filter((filePath) => {
    const value = String(filePath || "").toLowerCase();
    if (!value) return false;
    if (value.includes(".env")) return false;
    if (value.includes("secret")) return false;
    if (value.includes("token")) return false;
    if (value.includes("key")) return false;
    return true;
  });
}

class WorkerContextCompiler {
  compile(input = {}) {
    const allowedFiles = sanitizeFiles(Array.isArray(input.allowedFiles) ? input.allowedFiles : []);

    return {
      goal: input.goal || "",
      adapter: {
        supportedWorkers: Array.isArray(input.supportedWorkers)
          ? input.supportedWorkers
          : ["local_brain_worker", "aider", "gemini", "cline", "copilot"],
        executionMode: input.executionMode || "PREVIEW_ONLY",
        selectedWorker: input.selectedWorker || "local_brain_worker",
        fallbackWorkers: Array.isArray(input.fallbackWorkers) ? input.fallbackWorkers : []
      },
      bible: {
        version: input.bibleVersion || { bibleVersion: "unknown", schemaVersion: "unknown" },
        chapters: Array.isArray(input.loadedBibleChapters) ? input.loadedBibleChapters : [],
        constitutionRules: Array.isArray(input.constitutionRules) ? input.constitutionRules : [],
        architectureRules: Array.isArray(input.architectureRules) ? input.architectureRules : []
      },
      memory: input.latestMemoryCheckpoint || null,
      scanSummary: input.scanSummary || {},
      taskScope: input.taskScope || "read_only_planning",
      allowedFiles,
      allowedActions: Array.isArray(input.allowedActions) ? input.allowedActions : ["read", "analyze", "plan", "summarize"],
      blockedActions: Array.isArray(input.blockedActions)
        ? input.blockedActions
        : ["write_source", "code_patch", "commit", "push", "deploy", "paid_api"],
      riskLevel: input.riskLevel || "low",
      costLimit: input.costLimit || "zero_external_cost",
      approvalState: input.approvalState || { founderApproved: false },
      validationRequirements: Array.isArray(input.validationRequirements) ? input.validationRequirements : ["syntax", "policy", "approval_gate"],
      expectedOutputFormat: input.expectedOutputFormat || {
        type: "json",
        keys: ["summary", "proposedChanges", "risks", "validationPlan", "nextAction"]
      }
    };
  }
}

module.exports = WorkerContextCompiler;
module.exports.WorkerContextCompiler = WorkerContextCompiler;
