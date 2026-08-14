const crypto = require("crypto");

const TRANSITIONS = Object.freeze({ planned: ["ready", "blocked"], ready: ["in_progress", "blocked"], in_progress: ["completed", "blocked"], blocked: ["ready"], completed: [] });
function fail(message, statusCode = 400) { throw Object.assign(new Error(message), { statusCode }); }
function cleanText(value, name, max = 1000, required = false) {
  const result = String(value || "").trim();
  if (required && !result) fail(`${name} is required`);
  if (result.length > max) fail(`${name} exceeds ${max} characters`);
  return result;
}
function normalizeEvidence(value) {
  if (!Array.isArray(value)) fail("evidence must be an array");
  if (value.length > 20) fail("evidence exceeds 20 items");
  return value.map((item, index) => {
    const kind = cleanText(item && item.kind, `evidence[${index}].kind`, 40, true);
    if (!["artifact", "test", "review", "reference"].includes(kind)) fail(`evidence[${index}].kind is not allowed`);
    const sha256 = cleanText(item.sha256, `evidence[${index}].sha256`, 64) || null;
    if (sha256 && !/^[a-f0-9]{64}$/i.test(sha256)) fail(`evidence[${index}].sha256 must be a SHA-256 hash`);
    if (kind === "artifact" && !sha256) fail(`evidence[${index}].sha256 is required for artifact evidence`);
    return { kind, label: cleanText(item.label, `evidence[${index}].label`, 160, true), reference: cleanText(item.reference, `evidence[${index}].reference`, 500, true), sha256: sha256 && sha256.toLowerCase() };
  });
}
function assertTransition(task, toStatus) {
  const allowed = TRANSITIONS[task.status] || [];
  if (!allowed.includes(toStatus)) fail(`Task transition ${task.status} -> ${toStatus} is not allowed`, 409);
}
function dependenciesComplete(task, tasks) {
  const dependencies = Array.isArray(task.dependencies) ? task.dependencies : [];
  return dependencies.every((id) => tasks.some((candidate) => candidate.id === id && candidate.status === "completed"));
}
function buildEvent(mission, task, input, previousEventHash = null, now = new Date()) {
  const toStatus = cleanText(input.toStatus, "toStatus", 40, true);
  assertTransition(task, toStatus);
  if ((toStatus === "ready" || toStatus === "in_progress") && !dependenciesComplete(task, mission.workPackages || [])) fail("Task dependencies are not completed", 409);
  const evidence = normalizeEvidence(input.evidence || []);
  if (toStatus === "completed" && evidence.length < 1) fail("Completion requires deliverable evidence");
  const note = cleanText(input.note, "note", 1000, toStatus === "blocked");
  const record = { missionId: String(mission._id || mission.id), taskId: task.id, fromStatus: task.status, toStatus, actor: input.actor === "garuda" ? "garuda" : "founder", note, evidence, previousEventHash, createdAt: now.toISOString() };
  return { ...record, eventHash: crypto.createHash("sha256").update(JSON.stringify(record)).digest("hex") };
}
function applyEventPreview(missionInput, taskId, input, previousEventHash = null, now = new Date()) {
  const mission = missionInput && typeof missionInput.toObject === "function" ? missionInput.toObject() : missionInput || {};
  if (mission.status !== "founder_approved") fail("Deliverable workspace requires a Founder-approved mission", 409);
  const tasks = Array.isArray(mission.workPackages) ? mission.workPackages.map((item) => ({ ...item })) : [];
  const task = tasks.find((item) => item.id === taskId);
  if (!task) fail("Work package not found", 404);
  const event = buildEvent({ ...mission, workPackages: tasks }, task, input, previousEventHash, now);
  Object.assign(task, { status: event.toStatus, statusNote: event.note, evidence: event.evidence, lastEventHash: event.eventHash, updatedAt: event.createdAt });
  const completed = tasks.filter((item) => item.status === "completed").length;
  return { event, workPackages: tasks, deliverableWorkspace: { status: completed === tasks.length && tasks.length ? "complete" : "active", totalTasks: tasks.length, completedTasks: completed, blockedTasks: tasks.filter((item) => item.status === "blocked").length, progressPercent: tasks.length ? Math.round((completed / tasks.length) * 100) : 0, updatedAt: event.createdAt, externalActionsAuthorized: false } };
}
async function transitionTask(missionId, taskId, input = {}, context = {}) {
  const mongoose = require("mongoose");
  const { RevenueExecutionMission } = require("../models/RevenueExecutionMission");
  const { RevenueMissionTaskEvent } = require("../models/RevenueMissionTaskEvent");
  const { founderApprovalGranted } = require("./revenueConversionService");
  if (!founderApprovalGranted(context.founderApproved)) fail("Founder approval is required to update deliverable task state", 403);
  if (!mongoose.Types.ObjectId.isValid(String(missionId || ""))) fail("Invalid execution mission id");
  const mission = await RevenueExecutionMission.findById(missionId);
  if (!mission) fail("Execution mission not found", 404);
  const previous = await RevenueMissionTaskEvent.findOne({ missionId, taskId }).sort({ createdAt: -1 }).lean();
  const preview = applyEventPreview(mission, taskId, input, previous && previous.eventHash);
  await RevenueMissionTaskEvent.create(preview.event);
  mission.workPackages = preview.workPackages;
  mission.deliverableWorkspace = preview.deliverableWorkspace;
  await mission.save();

  if (mission.deliverableWorkspace.status === "complete") {
    const { SettlementLedger } = require("../models/SettlementLedger");
    await SettlementLedger.findOneAndUpdate(
      { executionMissionId: mission._id },
      {
        $setOnInsert: {
          status: "eligible",
          grossAmount: 0,
          currency: "INR",
          feeRatePercent: 0,
          netAmount: 0
        }
      },
      { upsert: true, new: true }
    );
  }

  return { mission: mission.toJSON(), event: preview.event };
}
async function listTaskEvents(missionId) {
  const { RevenueMissionTaskEvent } = require("../models/RevenueMissionTaskEvent");
  return RevenueMissionTaskEvent.find({ missionId }).sort({ createdAt: 1 }).lean();
}

module.exports = { TRANSITIONS, applyEventPreview, buildEvent, listTaskEvents, normalizeEvidence, transitionTask };
