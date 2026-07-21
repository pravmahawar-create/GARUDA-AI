const crypto = require("crypto");

function fail(message, statusCode = 400) { throw Object.assign(new Error(message), { statusCode }); }
function hash(value) { return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
function normalizeDecision(input = {}) {
  const decision = String(input.decision || "").trim().toLowerCase();
  if (!["approved", "request_changes", "rejected"].includes(decision)) fail("Decision must be approved, request_changes, or rejected");
  const notes = String(input.notes || "").trim();
  if (notes.length > 2000) fail("Decision notes exceed 2000 characters");
  if (decision !== "approved" && !notes) fail("Notes are required when requesting changes or rejecting");
  return { decision, notes };
}
function validateMission(mission = {}, decision) {
  if (mission.status !== "ready_for_founder_review") fail("Mission is not ready for Founder review", 409);
  const evidence = mission.executionEvidence || {};
  if (!evidence.loopId || !evidence.finalPatchSha256 || !evidence.finalReviewId) fail("Mission evidence identity is incomplete", 409);
  if (decision === "approved" && evidence.reviewerVerdict !== "APPROVE") fail("Founder approval requires an approving Reviewer verdict", 409);
  if (evidence.sourceTreeModified !== false || evidence.authorizesSourceApply !== false || evidence.authorizesCommitPushDeploy !== false || evidence.authorizesExternalAction !== false) fail("Mission evidence violates governance boundaries", 409);
  return evidence;
}
function buildDecisionRecord(missionInput, input = {}, previousDecisionHash = null, now = new Date()) {
  const mission = missionInput && typeof missionInput.toObject === "function" ? missionInput.toObject() : missionInput || {};
  const normalized = normalizeDecision(input);
  const evidence = validateMission(mission, normalized.decision);
  const missionId = String(mission._id || mission.id || "");
  if (!missionId) fail("Mission identity is required", 409);
  const evidenceHash = hash({ revisionNumber: evidence.revisionNumber || mission.revisionNumber || 1, loopId: evidence.loopId, finalPatchSha256: evidence.finalPatchSha256, finalReviewId: evidence.finalReviewId, reviewerVerdict: evidence.reviewerVerdict });
  const payload = {
    engine: "GARUDA Revenue Mission Founder Decision v1", missionId, evidenceHash,
    decision: normalized.decision, notes: normalized.notes, actor: "founder",
    decidedAt: new Date(now).toISOString(), previousDecisionHash: previousDecisionHash || null,
    governance: {
      technicalEvidenceOnly: true, authorizesSourceApply: false, authorizesCommitPushDeploy: false,
      authorizesExternalAction: false, actionSpecificApprovalStillRequired: true
    }
  };
  return { ...payload, decisionHash: hash(payload) };
}
function missionStatus(decision) { return ({ approved: "founder_approved", request_changes: "changes_required", rejected: "rejected" })[decision]; }
async function decideMission(missionId, input = {}, context = {}) {
  const mongoose = require("mongoose");
  const { RevenueExecutionMission } = require("../models/RevenueExecutionMission");
  const { RevenueMissionDecision } = require("../models/RevenueMissionDecision");
  const { founderApprovalGranted } = require("./revenueConversionService");
  if (!founderApprovalGranted(context.founderApproved)) fail("Founder approval is required for mission decision", 403);
  if (!mongoose.Types.ObjectId.isValid(String(missionId || ""))) fail("Invalid execution mission id");
  const mission = await RevenueExecutionMission.findById(missionId);
  if (!mission) fail("Execution mission not found", 404);
  const latest = await RevenueMissionDecision.findOne({ missionId: mission._id }).sort({ decidedAt: -1, _id: -1 });
  const record = buildDecisionRecord(mission, input, latest ? latest.decisionHash : null);
  let audit;
  try { audit = await RevenueMissionDecision.create(record); }
  catch (error) { if (error && error.code === 11000) fail("This evidence version already has a Founder decision", 409); throw error; }
  mission.status = missionStatus(record.decision);
  mission.founderDecision = { decision: record.decision, notes: record.notes, decidedAt: record.decidedAt, decisionHash: record.decisionHash, evidenceHash: record.evidenceHash };
  await mission.save();
  return { mission: mission.toJSON(), audit: audit.toJSON() };
}
async function listDecisions(missionId) {
  const { RevenueMissionDecision } = require("../models/RevenueMissionDecision");
  const items = await RevenueMissionDecision.find({ missionId }).sort({ decidedAt: 1, _id: 1 });
  return items.map((item) => item.toJSON());
}
module.exports = { buildDecisionRecord, decideMission, hash, listDecisions, missionStatus, normalizeDecision, validateMission };
