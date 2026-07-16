const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

class ProjectMemoryEngine {
  constructor({ memoryFilePath } = {}) {
    this.memoryFilePath = memoryFilePath || path.join(process.cwd(), "data", "dev-agent", "project-memory.json");
  }

  _ensureMemoryFile() {
    const dir = path.dirname(this.memoryFilePath);
    fs.mkdirSync(dir, { recursive: true });

    if (!fs.existsSync(this.memoryFilePath)) {
      const initial = {
        engine: "GARUDA Project Memory Engine v1",
        createdAt: new Date().toISOString(),
        records: []
      };
      fs.writeFileSync(this.memoryFilePath, JSON.stringify(initial, null, 2));
    }
  }

  _normalizeGoal(goal) {
    return String(goal || "").trim().toLowerCase();
  }

  _planFingerprint(goal, taskPlan = {}, selectedBrains = []) {
    const fingerprintInput = {
      goal: this._normalizeGoal(goal),
      selectedBrains: Array.isArray(selectedBrains) ? selectedBrains.slice().sort() : [],
      dependencyOrder: Array.isArray(taskPlan.dependencyOrder) ? taskPlan.dependencyOrder : [],
      tasks: Array.isArray(taskPlan.tasks)
        ? taskPlan.tasks.map((task) => ({
            id: task.id,
            title: task.title,
            workerType: task.workerType,
            dependencies: task.dependencies || []
          }))
        : []
    };

    return crypto
      .createHash("sha1")
      .update(JSON.stringify(fingerprintInput))
      .digest("hex");
  }

  loadMemory() {
    this._ensureMemoryFile();
    const raw = fs.readFileSync(this.memoryFilePath, "utf8");

    try {
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.records)) {
        return { engine: "GARUDA Project Memory Engine v1", records: [] };
      }

      return parsed;
    } catch {
      return { engine: "GARUDA Project Memory Engine v1", records: [] };
    }
  }

  saveRecord(record = {}) {
    const memory = this.loadMemory();
    const normalizedGoal = this._normalizeGoal(record.goal);
    const selectedBrains = Array.isArray(record.selectedBrains) ? record.selectedBrains : [];
    const taskPlan = record.taskPlan || {};
    const planFingerprint = record.planFingerprint || this._planFingerprint(normalizedGoal, taskPlan, selectedBrains);

    const duplicate = memory.records.find((item) => {
      return this._normalizeGoal(item.goal) === normalizedGoal && item.planFingerprint === planFingerprint;
    });

    if (duplicate) {
      return {
        status: "DUPLICATE_SKIPPED",
        record: duplicate,
        planFingerprint
      };
    }

    const nextRecord = {
      goal: record.goal,
      normalizedGoal,
      createdAt: record.createdAt || new Date().toISOString(),
      completedAt: record.completedAt || null,
      selectedBrains,
      taskPlan,
      validationStatus: record.validationStatus || "UNKNOWN",
      workflowStatus: record.workflowStatus || "UNKNOWN",
      approvalStatus: record.approvalStatus || "UNKNOWN",
      filesCreated: Array.isArray(record.filesCreated) ? record.filesCreated : [],
      filesModified: Array.isArray(record.filesModified) ? record.filesModified : [],
      failures: Array.isArray(record.failures) ? record.failures : [],
      nextAction: record.nextAction || "none",
      planFingerprint
    };

    memory.records.push(nextRecord);
    fs.writeFileSync(this.memoryFilePath, JSON.stringify(memory, null, 2));

    return {
      status: "SAVED",
      record: nextRecord,
      planFingerprint
    };
  }

  findSimilarGoal(goal = "") {
    const memory = this.loadMemory();
    const normalizedGoal = this._normalizeGoal(goal);

    const exactMatches = memory.records
      .filter((item) => item.normalizedGoal === normalizedGoal)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const relatedMatches = memory.records
      .filter((item) => item.normalizedGoal !== normalizedGoal && item.normalizedGoal.includes(normalizedGoal))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return {
      goal,
      exactMatches,
      relatedMatches
    };
  }

  getLatestRecord() {
    const memory = this.loadMemory();

    if (!memory.records.length) {
      return null;
    }

    return memory.records
      .slice()
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];
  }

  getIncompleteWork() {
    const memory = this.loadMemory();

    return memory.records
      .filter((item) => {
        const workflowDone = item.workflowStatus === "Completed (3/3)";
        return !workflowDone || !item.completedAt;
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  buildMemorySummary() {
    const memory = this.loadMemory();
    const total = memory.records.length;
    const completed = memory.records.filter((item) => item.workflowStatus === "Completed (3/3)").length;
    const incomplete = total - completed;

    return {
      engine: memory.engine || "GARUDA Project Memory Engine v1",
      memoryFilePath: this.memoryFilePath,
      totalRecords: total,
      completedRecords: completed,
      incompleteRecords: incomplete,
      latestRecord: this.getLatestRecord(),
      incompleteWork: this.getIncompleteWork()
    };
  }
}

module.exports = ProjectMemoryEngine;
module.exports.ProjectMemoryEngine = ProjectMemoryEngine;