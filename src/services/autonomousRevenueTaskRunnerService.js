const crypto = require("crypto");
const workspace = require("./revenueDeliverableWorkspaceService");

function fail(message, statusCode = 400) { throw Object.assign(new Error(message), { statusCode }); }
function artifact(label, reference, sha256 = null, kind = "artifact") { if (!reference) throw new Error(`${label} evidence is unavailable`); return { kind, label, reference: String(reference), sha256 }; }
function verifiedEvidence(mission, task) {
  const packet = mission.executionEvidence || {};
  if (task.brain === "architect") { if (!mission.architecturePlan?.planId) throw new Error("Architecture plan evidence is unavailable"); return [artifact("Architecture plan", `garuda://architecture/${mission.architecturePlan.planId}`, mission.architecturePlan.planId)]; }
  if (task.brain === "engineering") { if (!packet.loopId || !packet.finalPatchSha256) throw new Error("Engineering patch evidence is unavailable"); return [artifact("Engineering patch", `garuda://evidence/${packet.loopId}/patch`, packet.finalPatchSha256)]; }
  if (task.brain === "tester") {
    const passed = (packet.validationEvidence || []).filter((item) => item.status === "PASSED");
    if (!passed.length) throw new Error("Passed Tester evidence is unavailable");
    return passed.slice(0, 20).map((item) => artifact("Tester evidence", `garuda://test/${item.evidenceId}`, null, "test"));
  }
  if (task.brain === "reviewer") {
    if (packet.reviewerVerdict !== "APPROVE" || !packet.finalReviewId) throw new Error("Reviewer approval evidence is unavailable");
    return [artifact("Reviewer verdict", `garuda://review/${packet.finalReviewId}`, null, "review")];
  }
  if (task.brain === "documentation") { if (!mission.founderDecision?.decisionHash) throw new Error("Founder decision evidence is unavailable"); return [artifact("Founder decision", `garuda://founder-decision/${mission.founderDecision.decisionHash}`, mission.founderDecision.decisionHash, "reference")]; }
  throw new Error(`No verified evidence adapter for brain ${task.brain}`);
}
function eligibleTask(mission) {
  const tasks = mission.workPackages || [];
  return tasks.find((task) => ["planned", "ready", "in_progress", "blocked"].includes(task.status) && (task.dependencies || []).every((id) => tasks.some((item) => item.id === id && item.status === "completed"))) || null;
}
function runPreview(missionInput, options = {}) {
  let mission = missionInput && typeof missionInput.toObject === "function" ? missionInput.toObject() : JSON.parse(JSON.stringify(missionInput || {}));
  if (mission.status !== "founder_approved") fail("Autonomous runner requires a Founder-approved mission", 409);
  const task = eligibleTask(mission);
  if (!task) return { status: (mission.workPackages || []).every((item) => item.status === "completed") ? "mission_complete" : "idle", mission, events: [], run: null };
  const maxAttempts = Math.min(3, Math.max(1, Number(options.maxAttempts) || 3));
  const provider = options.evidenceProvider || verifiedEvidence;
  const events = [];
  let previousHash = task.lastEventHash || null;
  const apply = (toStatus, input = {}) => { const result = workspace.applyEventPreview(mission, task.id, { actor: "garuda", toStatus, ...input }, previousHash, options.now || new Date()); mission = { ...mission, workPackages: result.workPackages, deliverableWorkspace: result.deliverableWorkspace }; events.push(result.event); previousHash = result.event.eventHash; };
  if (task.status === "planned" || task.status === "blocked") apply("ready", { note: task.status === "blocked" ? "Automatic recovery retry" : "Dependencies verified" });
  if (task.status !== "in_progress") apply("in_progress", { note: "Bounded internal evidence packaging started" });
  const errors = [];
  let evidence = [];
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try { evidence = provider(mission, task, attempt); break; } catch (error) { errors.push(String(error.message || error)); }
  }
  const attempts = Math.max(1, errors.length + (evidence.length ? 1 : 0));
  if (evidence.length) apply("completed", { note: "Verified evidence package recorded", evidence });
  else apply("blocked", { note: `Evidence unavailable after ${maxAttempts} bounded attempts: ${errors[errors.length - 1]}`, evidence: [] });
  const summary = { missionId: String(mission._id || mission.id), taskId: task.id, status: evidence.length ? "completed" : "blocked", attempts: Math.min(maxAttempts, attempts), evidence, errors, eventHashes: events.map((item) => item.eventHash), previousRunHash: options.previousRunHash || null, governance: { internalOnly: true, externalActionsAuthorized: false, sourceGitDeployAuthorized: false, spendingPaymentAuthorized: false } };
  return { status: summary.status, mission, events, run: { ...summary, runHash: crypto.createHash("sha256").update(JSON.stringify(summary)).digest("hex") } };
}
async function runMission(missionId, options = {}) {
  const mongoose = require("mongoose");
  const { RevenueExecutionMission } = require("../models/RevenueExecutionMission");
  const { RevenueMissionTaskEvent } = require("../models/RevenueMissionTaskEvent");
  const { RevenueAutonomousTaskRun } = require("../models/RevenueAutonomousTaskRun");
  const { founderApprovalGranted } = require("./revenueConversionService");
  if (options.trustedInternal !== true && !founderApprovalGranted(options.founderApproved)) fail("Founder approval is required to start an autonomous task run", 403);
  if (!mongoose.Types.ObjectId.isValid(String(missionId || ""))) fail("Invalid execution mission id");
  const mission = await RevenueExecutionMission.findById(missionId);
  if (!mission) fail("Execution mission not found", 404);
  const previous = await RevenueAutonomousTaskRun.findOne({ missionId }).sort({ createdAt: -1 }).lean();
  const result = runPreview(mission, { maxAttempts: options.maxAttempts, previousRunHash: previous?.runHash || null });
  if (!result.run) return { status: result.status, mission: mission.toJSON(), run: null };
  await RevenueMissionTaskEvent.insertMany(result.events);
  await RevenueAutonomousTaskRun.create(result.run);
  mission.workPackages = result.mission.workPackages;
  mission.deliverableWorkspace = result.mission.deliverableWorkspace;
  await mission.save();
  return { status: result.status, mission: mission.toJSON(), run: result.run };
}
async function runEligibleCycle(options = {}) {
  const { RevenueExecutionMission } = require("../models/RevenueExecutionMission");
  const missions = await RevenueExecutionMission.find({ status: "founder_approved", "deliverableWorkspace.status": { $ne: "complete" } }).limit(Math.min(20, Number(options.limit) || 10));
  const results = [];
  for (const mission of missions) { try { results.push(await runMission(mission._id, { ...options, trustedInternal: true })); } catch (error) { results.push({ status: "error", missionId: String(mission._id), error: error.message }); } }
  return { scanned: missions.length, completed: results.filter((item) => item.status === "completed").length, blocked: results.filter((item) => item.status === "blocked").length, results };
}
async function runMissionToCompletion(missionId, options = {}) {
  const { founderApprovalGranted } = require("./revenueConversionService");
  if (!founderApprovalGranted(options.founderApproved)) fail("Founder approval is required to start one-tap internal execution", 403);
  const results = [];
  for (let step = 0; step < 50; step += 1) { const result = await runMission(missionId, { maxAttempts: options.maxAttempts, trustedInternal: true }); results.push(result); if (["mission_complete", "idle", "blocked"].includes(result.status)) break; }
  const final = results[results.length - 1];
  return { status: final?.status || "idle", mission: final?.mission || null, runs: results.filter((item) => item.run).map((item) => item.run), governance: { singleFounderApproval: true, internalOnly: true, externalActionStillRequiresSeparateApproval: true } };
}
async function listRuns(missionId) { const { RevenueAutonomousTaskRun } = require("../models/RevenueAutonomousTaskRun"); return RevenueAutonomousTaskRun.find({ missionId }).sort({ createdAt: 1 }).lean(); }
module.exports = { eligibleTask, listRuns, runEligibleCycle, runMission, runMissionToCompletion, runPreview, verifiedEvidence };
