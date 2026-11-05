/**
 * 🦅 GARUDA MOTHER BRAIN — SHARED MISSION STATE & BLACKBOARD
 * 
 * Manages centralized mission intelligence:
 * - Mission lifecycle states (PLANNING, EXECUTING, VERIFYING, COMPLETED, FAILED, RECOVERED)
 * - Agent workforce registry
 * - Task DAG with dependencies
 * - Shared Blackboard (structured context sharing between agents)
 * - File lock conflict detection (prevent concurrent write collisions)
 * - Execution log and atomic disk persistence
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DEFAULT_MISSIONS_DIR = path.resolve(__dirname, "..", "..", "..", ".garuda", "missions");

class MissionState {
  constructor(data = {}) {
    this.missionsDir = data.missionsDir || DEFAULT_MISSIONS_DIR;
    this._ensureDir();

    this.missionId = data.missionId || `MISSION-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    this.objective = data.objective || "Untitled Autonomous Mission";
    this.status = data.status || "PLANNING"; // PLANNING, EXECUTING, VERIFYING, COMPLETED, FAILED, RECOVERED
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = new Date().toISOString();

    // Registered Workforce (agentId -> metadata)
    this.agents = new Map();
    if (data.agents) {
      if (Array.isArray(data.agents)) {
        data.agents.forEach(a => this.agents.set(a.id, a));
      } else if (typeof data.agents === "object") {
        Object.entries(data.agents).forEach(([k, v]) => this.agents.set(k, v));
      }
    }

    // Task DAG (taskId -> taskObject)
    this.tasks = new Map();
    if (data.tasks) {
      if (Array.isArray(data.tasks)) {
        data.tasks.forEach(t => this.tasks.set(t.id, t));
      } else if (typeof data.tasks === "object") {
        Object.entries(data.tasks).forEach(([k, v]) => this.tasks.set(k, v));
      }
    }

    // Shared Blackboard (key-value store for agent-to-agent structured data handoffs)
    this.blackboard = new Map();
    if (data.blackboard) {
      Object.entries(data.blackboard).forEach(([k, v]) => this.blackboard.set(k, v));
    }

    // Active File Locks for collision prevention
    this.fileLocks = new Map(); // filePath -> { agentId, taskId, lockedAt }

    // Execution trace and chronological event log
    this.events = Array.isArray(data.events) ? data.events : [];
    this.deliverables = Array.isArray(data.deliverables) ? data.deliverables : [];
    this.summary = data.summary || null;
  }

  _ensureDir() {
    try {
      if (!fs.existsSync(this.missionsDir)) {
        fs.mkdirSync(this.missionsDir, { recursive: true });
      }
    } catch (_) {}
  }

  logEvent(type, details = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      type,
      ...details
    };
    this.events.push(entry);
    this.updatedAt = entry.timestamp;
    return entry;
  }

  // --- Workforce Registry ---
  registerAgent(agent) {
    const info = {
      id: agent.id,
      name: agent.name,
      role: agent.role,
      title: agent.title,
      model: agent.model,
      status: "IDLE",
      registeredAt: new Date().toISOString()
    };
    this.agents.set(agent.id, info);
    this.logEvent("AGENT_REGISTERED", { agentId: agent.id, role: agent.role });
    return info;
  }

  updateAgentStatus(agentId, status, currentTask = null) {
    const ag = this.agents.get(agentId);
    if (ag) {
      ag.status = status;
      ag.currentTask = currentTask;
      ag.updatedAt = new Date().toISOString();
      this.logEvent("AGENT_STATUS_CHANGED", { agentId, status, currentTask });
    }
  }

  // --- Task DAG ---
  addTask(taskSpec) {
    const task = {
      id: taskSpec.id || `TASK-${String(this.tasks.size + 1).padStart(3, "0")}`,
      title: taskSpec.title || "Untitled Step",
      assignedRole: taskSpec.assignedRole || "ENGINEER",
      assignedAgentId: taskSpec.assignedAgentId || null,
      dependencies: Array.isArray(taskSpec.dependencies) ? taskSpec.dependencies : [],
      status: taskSpec.status || "PENDING", // PENDING, RUNNING, COMPLETED, FAILED, RECOVERING, BLOCKED
      input: taskSpec.input || {},
      output: null,
      error: null,
      targetFiles: Array.isArray(taskSpec.targetFiles) ? taskSpec.targetFiles : [],
      toolCalls: [],
      createdAt: new Date().toISOString(),
      completedAt: null,
      retryCount: 0
    };
    this.tasks.set(task.id, task);
    this.logEvent("TASK_ADDED", { taskId: task.id, title: task.title, role: task.assignedRole });
    return task;
  }

  getTask(taskId) {
    return this.tasks.get(taskId) || null;
  }

  getEligibleTasks() {
    const completedIds = new Set(
      Array.from(this.tasks.values())
        .filter(t => t.status === "COMPLETED")
        .map(t => t.id)
    );

    const eligible = [];
    for (const task of this.tasks.values()) {
      if (task.status === "PENDING") {
        const satisfied = task.dependencies.every(d => completedIds.has(d));
        if (satisfied) {
          eligible.push(task);
        }
      }
    }
    return eligible;
  }

  updateTaskStatus(taskId, status, result = {}) {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    task.status = status;
    task.updatedAt = new Date().toISOString();

    if (status === "COMPLETED") {
      task.completedAt = task.updatedAt;
      task.output = result.output || null;
      task.toolCalls = result.toolCalls || [];
      this.releaseFileLocks(taskId);
    } else if (status === "FAILED") {
      task.error = result.error || "Unknown task error";
      this.releaseFileLocks(taskId);
    }

    this.logEvent("TASK_STATUS_CHANGED", { taskId, status, error: task.error });
    return task;
  }

  // --- File Lock Collision Prevention ---
  acquireFileLocks(taskId, agentId, filePaths = []) {
    for (const f of filePaths) {
      const normalized = path.normalize(f);
      if (this.fileLocks.has(normalized)) {
        const lock = this.fileLocks.get(normalized);
        if (lock.taskId !== taskId) {
          return {
            acquired: false,
            blockedBy: lock,
            filePath: normalized
          };
        }
      }
    }

    // Acquire all locks
    const now = new Date().toISOString();
    for (const f of filePaths) {
      const normalized = path.normalize(f);
      this.fileLocks.set(normalized, { taskId, agentId, lockedAt: now });
    }
    return { acquired: true };
  }

  releaseFileLocks(taskId) {
    for (const [f, lock] of this.fileLocks.entries()) {
      if (lock.taskId === taskId) {
        this.fileLocks.delete(f);
      }
    }
  }

  // --- Shared Blackboard ---
  setBlackboard(key, value, sourceAgentId = "SYSTEM") {
    this.blackboard.set(key, {
      value,
      sourceAgentId,
      updatedAt: new Date().toISOString()
    });
    this.logEvent("BLACKBOARD_UPDATED", { key, sourceAgentId });
  }

  getBlackboard(key) {
    const entry = this.blackboard.get(key);
    return entry ? entry.value : null;
  }

  getAllBlackboard() {
    const obj = {};
    for (const [k, v] of this.blackboard.entries()) {
      obj[k] = v.value;
    }
    return obj;
  }

  // --- Serialization & Disk Persistence ---
  toJSON() {
    return {
      missionId: this.missionId,
      objective: this.objective,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      agents: Array.from(this.agents.values()),
      tasks: Array.from(this.tasks.values()),
      blackboard: this.getAllBlackboard(),
      events: this.events,
      deliverables: this.deliverables,
      summary: this.summary
    };
  }

  save() {
    this._ensureDir();
    const filePath = path.join(this.missionsDir, `${this.missionId}.json`);
    const tempPath = path.join(this.missionsDir, `${this.missionId}.${Date.now()}.tmp`);
    try {
      fs.writeFileSync(tempPath, JSON.stringify(this.toJSON(), null, 2), "utf8");
      fs.renameSync(tempPath, filePath);
      return true;
    } catch (err) {
      try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch (_) {}
      return false;
    }
  }

  static load(missionId, missionsDir = DEFAULT_MISSIONS_DIR) {
    const cleanId = String(missionId).replace(/[^a-zA-Z0-9_\-]/g, "");
    const filePath = path.join(missionsDir, `${cleanId}.json`);
    if (!fs.existsSync(filePath)) return null;
    try {
      const raw = fs.readFileSync(filePath, "utf8");
      return new MissionState(JSON.parse(raw));
    } catch (_) {
      return null;
    }
  }
}

module.exports = {
  MissionState,
  DEFAULT_MISSIONS_DIR
};
