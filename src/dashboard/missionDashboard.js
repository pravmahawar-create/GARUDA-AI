/**
 * 🦅 GARUDA MISSION INTELLIGENCE DASHBOARD
 * 
 * Production module for real-time tracking, agent workforce coordination,
 * task state telemetry, result aggregation, and terminal visualization.
 * 
 * Required Functionality:
 * 1. Mission creation and tracking
 * 2. Agent registration and role assignment
 * 3. Task dependency tracking
 * 4. Live execution status
 * 5. Completed and failed task tracking
 * 6. Mission result aggregation
 * 7. Execution history and persistence
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

class MissionDashboard {
  constructor(options = {}) {
    this.storageDir = options.storageDir || path.resolve(process.cwd(), ".garuda", "missions");
    this.missions = new Map();
    this._ensureStorage();
    this._loadExisting();
  }

  _ensureStorage() {
    try {
      if (!fs.existsSync(this.storageDir)) {
        fs.mkdirSync(this.storageDir, { recursive: true });
      }
    } catch (_) {}
  }

  _loadExisting() {
    try {
      if (fs.existsSync(this.storageDir)) {
        const files = fs.readdirSync(this.storageDir).filter(f => f.endsWith(".json"));
        for (const file of files) {
          try {
            const raw = fs.readFileSync(path.join(this.storageDir, file), "utf8");
            const data = JSON.parse(raw);
            if (data.missionId) {
              this.missions.set(data.missionId, data);
            }
          } catch (_) {}
        }
      }
    } catch (_) {}
  }

  createMission(spec = {}) {
    const missionId = spec.missionId || `MISSION-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const mission = {
      missionId,
      objective: spec.objective || "Untitled Mission",
      status: "INITIALIZED", // INITIALIZED, RUNNING, COMPLETED, FAILED, RECOVERED
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      teamSize: spec.teamSize || 5,
      agents: [],
      tasks: [],
      events: [],
      metrics: {
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        recoveredTasks: 0,
        durationMs: 0
      },
      deliverable: null,
      metadata: spec.metadata || {}
    };

    this.missions.set(missionId, mission);
    this._saveMission(missionId);
    return mission;
  }

  registerAgent(missionId, agentSpec) {
    const mission = this.missions.get(missionId);
    if (!mission) throw new Error(`Mission '${missionId}' not found.`);

    const agent = {
      agentId: agentSpec.agentId || `agent_${agentSpec.role || "worker"}_${crypto.randomBytes(2).toString("hex")}`,
      name: agentSpec.name || `${agentSpec.role || "Worker"}_Agent`,
      role: agentSpec.role || "ENGINEER",
      model: agentSpec.model || "gemini-2.5-flash",
      status: "IDLE", // IDLE, BUSY, COMPLETED, FAILED
      registeredAt: new Date().toISOString()
    };

    mission.agents.push(agent);
    mission.updatedAt = new Date().toISOString();
    this._saveMission(missionId);
    return agent;
  }

  assignTask(missionId, taskSpec) {
    const mission = this.missions.get(missionId);
    if (!mission) throw new Error(`Mission '${missionId}' not found.`);

    const task = {
      taskId: taskSpec.taskId || `TASK-${String(mission.tasks.length + 1).padStart(3, "0")}`,
      title: taskSpec.title || "Untitled Step",
      role: taskSpec.role || "ENGINEER",
      assignedAgentId: taskSpec.assignedAgentId || null,
      dependencies: Array.isArray(taskSpec.dependencies) ? taskSpec.dependencies : [],
      status: "PENDING", // PENDING, RUNNING, COMPLETED, FAILED, RECOVERED
      input: taskSpec.input || {},
      output: null,
      error: null,
      targetFiles: Array.isArray(taskSpec.targetFiles) ? taskSpec.targetFiles : [],
      durationMs: 0,
      createdAt: new Date().toISOString(),
      completedAt: null
    };

    mission.tasks.push(task);
    mission.metrics.totalTasks = mission.tasks.length;
    mission.updatedAt = new Date().toISOString();
    this._saveMission(missionId);
    return task;
  }

  updateTaskStatus(missionId, taskId, status, details = {}) {
    const mission = this.missions.get(missionId);
    if (!mission) throw new Error(`Mission '${missionId}' not found.`);

    const task = mission.tasks.find(t => t.taskId === taskId);
    if (!task) throw new Error(`Task '${taskId}' not found in mission '${missionId}'.`);

    task.status = status;
    task.updatedAt = new Date().toISOString();

    if (details.output !== undefined) task.output = details.output;
    if (details.error !== undefined) task.error = details.error;
    if (details.durationMs !== undefined) task.durationMs = details.durationMs;

    if (status === "COMPLETED") {
      task.completedAt = new Date().toISOString();
      mission.metrics.completedTasks = mission.tasks.filter(t => t.status === "COMPLETED").length;
    } else if (status === "FAILED") {
      mission.metrics.failedTasks = mission.tasks.filter(t => t.status === "FAILED").length;
    } else if (status === "RECOVERED") {
      mission.metrics.recoveredTasks = (mission.metrics.recoveredTasks || 0) + 1;
      mission.metrics.completedTasks = mission.tasks.filter(t => t.status === "COMPLETED" || t.status === "RECOVERED").length;
    }

    // Auto-update mission status
    if (mission.tasks.every(t => t.status === "COMPLETED" || t.status === "RECOVERED")) {
      mission.status = "COMPLETED";
    } else if (mission.tasks.some(t => t.status === "FAILED")) {
      mission.status = "FAILED";
    } else if (mission.tasks.some(t => t.status === "RUNNING")) {
      mission.status = "RUNNING";
    }

    mission.updatedAt = new Date().toISOString();
    this._saveMission(missionId);
    return task;
  }

  getMissionStatus(missionId) {
    const mission = this.missions.get(missionId);
    if (!mission) return null;

    const completed = mission.tasks.filter(t => t.status === "COMPLETED" || t.status === "RECOVERED").length;
    const failed = mission.tasks.filter(t => t.status === "FAILED").length;
    const running = mission.tasks.filter(t => t.status === "RUNNING").length;
    const pending = mission.tasks.filter(t => t.status === "PENDING").length;

    return {
      missionId: mission.missionId,
      objective: mission.objective,
      status: mission.status,
      agentsCount: mission.agents.length,
      tasksTotal: mission.tasks.length,
      tasksCompleted: completed,
      tasksFailed: failed,
      tasksRunning: running,
      tasksPending: pending,
      percentComplete: mission.tasks.length > 0 ? Math.round((completed / mission.tasks.length) * 100) : 0,
      createdAt: mission.createdAt,
      updatedAt: mission.updatedAt
    };
  }

  aggregateResults(missionId) {
    const mission = this.missions.get(missionId);
    if (!mission) throw new Error(`Mission '${missionId}' not found.`);

    const outputs = {};
    for (const task of mission.tasks) {
      if (task.output) {
        outputs[task.taskId] = {
          role: task.role,
          output: task.output,
          durationMs: task.durationMs
        };
      }
    }

    const summary = {
      missionId: mission.missionId,
      objective: mission.objective,
      status: mission.status,
      totalDurationMs: mission.tasks.reduce((acc, t) => acc + (t.durationMs || 0), 0),
      agentsInvolved: mission.agents.map(a => `${a.role} (${a.model})`),
      deliverables: outputs,
      verified: mission.status === "COMPLETED"
    };

    mission.deliverable = summary;
    this._saveMission(missionId);
    return summary;
  }

  getExecutionHistory(limit = 10) {
    const list = Array.from(this.missions.values());
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list.slice(0, limit).map(m => this.getMissionStatus(m.missionId));
  }

  renderAsciiDashboard(missionId) {
    const mission = this.missions.get(missionId);
    if (!mission) return "Mission not found.";

    const status = this.getMissionStatus(missionId);
    const barWidth = 30;
    const filled = Math.round((status.percentComplete / 100) * barWidth);
    const progressBar = "█".repeat(filled) + "░".repeat(barWidth - filled);

    const lines = [
      `┌────────────────────────────────────────────────────────────────────────┐`,
      `│ 🦅 GARUDA MISSION INTELLIGENCE DASHBOARD                               │`,
      `├────────────────────────────────────────────────────────────────────────┤`,
      `│ Mission ID:  ${status.missionId.padEnd(58)}│`,
      `│ Objective:   ${(status.objective.length > 56 ? status.objective.slice(0, 53) + "..." : status.objective).padEnd(58)}│`,
      `│ Status:      ${(status.status === "COMPLETED" ? "🟢 COMPLETED" : status.status === "FAILED" ? "🔴 FAILED" : "🟡 " + status.status).padEnd(58)}│`,
      `│ Progress:    [${progressBar}] ${String(status.percentComplete).padStart(3)}%       │`,
      `├────────────────────────────────────────────────────────────────────────┤`,
      `│ WORKFORCE (${String(status.agentsCount).padStart(2)} Active Agents):                                       │`
    ];

    const agentsList = Array.isArray(mission.agents) ? mission.agents : Object.values(mission.agents || {});
    for (const ag of agentsList) {
      const role = String(ag.role || "").padEnd(14);
      const name = String(ag.name || "").padEnd(20);
      const model = String(ag.model || ag.preferredModel || "").padEnd(16);
      const line = `│  • ${role} | ${name} | ${model}│`;
      lines.push(line);
    }

    lines.push(`├────────────────────────────────────────────────────────────────────────┤`);
    lines.push(`│ TASK DEPENDENCY GRAPH (${String(status.tasksTotal).padStart(2)} Tasks):                                     │`);

    const tasksList = Array.isArray(mission.tasks) ? mission.tasks : Object.values(mission.tasks || {});
    for (const t of tasksList) {
      const icon = t.status === "COMPLETED" ? "✔" : t.status === "FAILED" ? "✖" : t.status === "RUNNING" ? "▶" : "⏳";
      const taskId = String(t.taskId || t.id || "TASK").padEnd(12);
      const role = String(t.role || t.assignedRole || "ENGINEER").padEnd(10);
      const rawTitle = String(t.title || "Untitled");
      const title = (rawTitle.length > 25 ? rawTitle.slice(0, 22) + "..." : rawTitle).padEnd(25);
      const deps = Array.isArray(t.dependencies) ? t.dependencies : [];
      const dep = (deps.length > 0 ? ` (deps: ${deps.join(",")})` : " [root]").padEnd(14);
      const tLine = `│  ${icon} ${taskId} [${role}] ${title} ${dep}│`;
      lines.push(tLine);
    }

    lines.push(`└────────────────────────────────────────────────────────────────────────┘`);
    return lines.join("\n");
  }

  _saveMission(missionId) {
    const mission = this.missions.get(missionId);
    if (!mission) return;
    this._ensureStorage();
    const filePath = path.join(this.storageDir, `${missionId}.json`);
    const tmpPath = path.join(this.storageDir, `${missionId}.${Date.now()}.tmp`);
    try {
      fs.writeFileSync(tmpPath, JSON.stringify(mission, null, 2), "utf8");
      fs.renameSync(tmpPath, filePath);
    } catch (_) {
      try { if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); } catch (_) {}
    }
  }
}

module.exports = {
  MissionDashboard
};
