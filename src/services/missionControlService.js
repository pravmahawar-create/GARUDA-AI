const crypto = require("crypto");
const mongoose = require("mongoose");
const MissionRecord = require("../models/MissionRecord");
const { understandGoal } = require("../../scripts/mother/goalEngine");
const { Mother } = require("../../scripts/mother/mother");
const {
  TaskContinuationController,
  ParallelGovernedWorkerQueue,
  ExecutionKnowledgeAdapter,
  ExternalWorkerOrchestrator
} = require("../tools");
const { ApprovalGate } = require("../../scripts/dev-agent/core/DevelopmentApprovalGate");

/**
 * GARUDA Mission Control Service
 * Integrates Mother Brain goal decomposition, Phase 1-8 tools, persistence, and governance into a unified API service.
 */
class MissionControlService {
  constructor(options = {}) {
    this.workspaceRoot = options.workspaceRoot || process.cwd();
    this.knowledgeAdapter = new ExecutionKnowledgeAdapter();
  }

  /**
   * Helper for in-memory fallback when MongoDB connection is unavailable.
   */
  static inMemoryMissions = new Map();

  async saveMission(doc) {
    if (mongoose.connection.readyState === 1) {
      return await doc.save();
    } else {
      const obj = typeof doc.toObject === "function" ? doc.toObject() : doc;
      MissionControlService.inMemoryMissions.set(obj.missionId, obj);
      return obj;
    }
  }

  async findMissionById(missionId) {
    if (mongoose.connection.readyState === 1) {
      return await MissionRecord.findOne({ missionId }).lean();
    } else {
      return MissionControlService.inMemoryMissions.get(missionId) || null;
    }
  }

  async listMissions(limit = 20) {
    if (mongoose.connection.readyState === 1) {
      return await MissionRecord.find().sort({ createdAt: -1 }).limit(limit).lean();
    } else {
      const list = Array.from(MissionControlService.inMemoryMissions.values());
      return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit);
    }
  }

  /**
   * Creates a new Mission from a user/founder goal.
   */
  async createMission(goalText, options = {}) {
    const rawGoal = String(goalText || "").trim();
    if (!rawGoal) {
      throw Object.assign(new Error("Goal is required"), { statusCode: 400 });
    }

    const missionId = `mission_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const founderApproved = options.founderApproved === true || options.founderApproved === "true";
    const priority = options.priority || "P1";

    // 1. Goal Decomposition & RAG Knowledge Context
    const goalParsed = understandGoal(rawGoal);
    const ragEnrichment = await this.knowledgeAdapter.retrieveContext(rawGoal);

    // 2. Mother Brain Task Planning
    const mother = new Mother();
    const plannerTasks = [
      {
        id: `${missionId}_task_1`,
        taskType: goalParsed.intent === "read_only_audit" ? "file_read" : "command_exec",
        targetPath: goalParsed.intent === "read_only_audit" ? "package.json" : null,
        command: goalParsed.intent === "read_only_audit" ? null : "node -v",
        content: "",
        dependencies: []
      }
    ];

    const isWriteGoal = ["creation", "modification"].includes(goalParsed.actionType) || rawGoal.toLowerCase().includes("create") || rawGoal.toLowerCase().includes("modify") || rawGoal.toLowerCase().includes("write");
    const requiresApproval = isWriteGoal && !founderApproved;
    const initialStatus = requiresApproval ? "WAITING_APPROVAL" : "READY";

    const missionData = {
      missionId,
      goal: rawGoal,
      status: initialStatus,
      founderApproved,
      priority,
      tasks: plannerTasks.map((t) => ({
        id: t.id,
        taskType: t.taskType,
        targetPath: t.targetPath,
        command: t.command,
        content: t.content,
        dependencies: t.dependencies,
        status: "PENDING",
        worker: "local_brain_worker"
      })),
      summary: `Mission created with goal intent: ${goalParsed.intent}`,
      evidence: {
        goalParsed,
        ragContext: ragEnrichment
      },
      history: [{ status: initialStatus, timestamp: new Date(), details: { note: "Mission created" } }]
    };

    let missionDoc;
    if (mongoose.connection.readyState === 1) {
      missionDoc = new MissionRecord(missionData);
      await this.saveMission(missionDoc);
    } else {
      missionDoc = missionData;
      await this.saveMission(missionDoc);
    }

    // If approved and ready, trigger execution asynchronously or synchronously
    if (initialStatus === "READY") {
      this.executeMission(missionId, { founderApproved }).catch((err) => {
        console.error(`[MissionControlService] Background execution error for ${missionId}:`, err);
      });
    }

    return typeof missionDoc.toObject === "function" ? missionDoc.toObject() : missionDoc;
  }

  /**
   * Executes a Mission through the Phase 4 TaskContinuationController & Phase 7 Parallel Worker Queue.
   */
  async executeMission(missionId, context = {}) {
    const mission = await this.findMissionById(missionId);
    if (!mission) throw Object.assign(new Error("Mission not found"), { statusCode: 404 });

    const founderApproved = context.founderApproved === true || mission.founderApproved === true;
    const approvalGate = new ApprovalGate({ founderApproved });

    // Update status to RUNNING
    await this.updateMissionStatus(missionId, "RUNNING", { note: "Starting governed execution" });

    // Use TaskContinuationController to run mission
    const continuationController = new TaskContinuationController({
      workspaceRoot: this.workspaceRoot,
      approvalGate,
      maxContinuationDepth: mission.maxContinuationDepth || 5
    });

    const executionResult = await continuationController.runMission(
      mission.tasks.map((t) => ({
        id: t.id,
        taskType: t.taskType,
        targetPath: t.targetPath,
        command: t.command,
        content: t.content,
        dependencies: t.dependencies
      })),
      { founderApproved }
    );

    // Map result status to Mission status
    let finalMissionStatus = "COMPLETED";
    if (executionResult.status === "STOPPED_AT_APPROVAL") {
      finalMissionStatus = "WAITING_APPROVAL";
    } else if (executionResult.status === "STOPPED_AT_FAILURE" || executionResult.status === "RECOVERY_EXHAUSTED") {
      finalMissionStatus = "FAILED";
    } else if (executionResult.status === "DEPTH_LIMIT_REACHED") {
      finalMissionStatus = "BLOCKED";
    }

    // Update Mission DB record
    const updatedTasks = (executionResult.tasks || []).map((t) => ({
      id: t.id,
      taskType: t.taskType,
      targetPath: t.targetPath,
      command: t.command,
      content: t.content,
      dependencies: t.dependencies,
      status: t.status,
      worker: "local_brain_worker",
      updatedAt: new Date()
    }));

    await this.updateMissionStatus(missionId, finalMissionStatus, {
      stopReason: executionResult.stopReason,
      tasks: updatedTasks,
      totalStepsExecuted: executionResult.totalStepsExecuted
    });

    return await this.findMissionById(missionId);
  }

  /**
   * Updates mission status and appends history.
   */
  async updateMissionStatus(missionId, newStatus, details = {}) {
    if (mongoose.connection.readyState === 1) {
      const doc = await MissionRecord.findOne({ missionId });
      if (!doc) return null;
      doc.status = newStatus;
      if (details.tasks) doc.tasks = details.tasks;
      if (details.stopReason) doc.stopReason = details.stopReason;
      doc.history.push({ status: newStatus, timestamp: new Date(), details });
      return await doc.save();
    } else {
      const doc = MissionControlService.inMemoryMissions.get(missionId);
      if (!doc) return null;
      doc.status = newStatus;
      if (details.tasks) doc.tasks = details.tasks;
      if (details.stopReason) doc.stopReason = details.stopReason;
      doc.history.push({ status: newStatus, timestamp: new Date().toISOString(), details });
      MissionControlService.inMemoryMissions.set(missionId, doc);
      return doc;
    }
  }

  /**
   * Governed action handler (approve, reject, retry, cancel).
   */
  async handleAction(missionId, action, payload = {}) {
    const mission = await this.findMissionById(missionId);
    if (!mission) throw Object.assign(new Error("Mission not found"), { statusCode: 404 });

    const cleanAction = String(action || "").toLowerCase();

    if (cleanAction === "approve") {
      await this.updateMissionStatus(missionId, "READY", { note: "Founder approval granted" });
      return await this.executeMission(missionId, { founderApproved: true });
    }

    if (cleanAction === "reject" || cleanAction === "cancel") {
      return await this.updateMissionStatus(missionId, "CANCELLED", { note: `Mission ${cleanAction}ed by founder` });
    }

    if (cleanAction === "retry") {
      await this.updateMissionStatus(missionId, "READY", { note: "Retry requested by founder" });
      return await this.executeMission(missionId, { founderApproved: true });
    }

    throw Object.assign(new Error(`Unsupported mission action: ${action}`), { statusCode: 400 });
  }
}

module.exports = new MissionControlService();
