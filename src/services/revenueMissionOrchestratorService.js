const crypto = require("crypto");
const GovernedEngineeringLoop = require("../../scripts/dev-agent/core/GovernedEngineeringLoop");

function fail(message, statusCode = 400) { throw Object.assign(new Error(message), { statusCode }); }
function text(value, name, max = 500) {
  const result = String(value || "").trim();
  if (!result) fail(`${name} is required`);
  if (result.length > max) fail(`${name} exceeds ${max} characters`);
  return result;
}
function list(value, name, maxItems = 20) {
  if (!Array.isArray(value) || value.length < 1 || value.length > maxItems) fail(`${name} must contain 1 to ${maxItems} items`);
  const result = value.map((item, index) => text(item, `${name}[${index}]`, 300));
  if (new Set(result).size !== result.length) fail(`${name} must not contain duplicates`);
  return result;
}
function slug(value) { return String(value || "mission").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "mission"; }
function normalizeScope(input = {}) {
  return {
    deliverableType: text(input.deliverableType, "deliverableType", 120),
    requiredInputs: list(input.requiredInputs, "requiredInputs"),
    acceptanceCriteria: list(input.acceptanceCriteria, "acceptanceCriteria"),
    constraints: Array.isArray(input.constraints) && input.constraints.length ? list(input.constraints, "constraints") : ["No external action without separate Founder approval"],
    maxAttempts: Math.min(3, Math.max(1, Number(input.maxAttempts) || 2))
  };
}
function buildWorkPackages(plan, scope) {
  return plan.tasks.map((task, index) => ({
    id: task.id, order: index + 1, title: task.title, brain: task.brain,
    dependencies: task.dependencies, deliverable: task.deliverable, status: "planned",
    allowedActions: task.allowedActions, blockedActions: task.blockedActions,
    acceptanceCriteria: index === 2 ? scope.acceptanceCriteria : []
  }));
}
function evidencePacket(loop, revisionNumber = 1) {
  return {
    engine: loop.engine, loopId: loop.loopId, status: loop.status, planId: loop.planId, revisionNumber,
    attempts: loop.attempts, artifactHashes: loop.finalArtifact ? loop.finalArtifact.artifacts : [],
    validationEvidence: loop.finalArtifact ? loop.finalArtifact.evidence : [],
    finalPatchSha256: loop.finalPatchSha256, finalReviewId: loop.finalReviewId,
    reviewerVerdict: loop.finalReview ? loop.finalReview.verdict : null,
    reviewerRequestedChanges: loop.finalReview ? loop.finalReview.requestedChanges : [],
    reviewerRejectReasons: loop.finalReview ? loop.finalReview.rejectReasons : [],
    sourceTreeModified: loop.finalArtifact ? loop.finalArtifact.sourceTreeModified : false,
    founderApprovalRequired: true, authorizesSourceApply: false,
    authorizesCommitPushDeploy: false, authorizesExternalAction: false
  };
}
function preparePreview(missionInput, scopeInput, options = {}) {
  const mission = missionInput && typeof missionInput.toObject === "function" ? missionInput.toObject() : missionInput || {};
  if (mission.status !== "awaiting_bounded_scope" && options.allowReplay !== true) fail("Mission is not awaiting bounded scope", 409);
  const scope = normalizeScope(scopeInput);
  const missionId = String(mission._id || mission.id || mission.missionKey || "");
  if (!missionId) fail("Mission identity is required", 409);
  const revisionNumber = Math.min(3, Math.max(1, Number(options.revisionNumber) || 1));
  const safeBase = slug(`${mission.capability && mission.capability.id}-${missionId}`);
  const safeName = `${safeBase.slice(0, 44)}-r${revisionNumber}`;
  const requiredFields = scope.requiredInputs.map((item) => slug(item).replace(/-/g, "_")).filter(Boolean);
  if (new Set(requiredFields).size !== requiredFields.length) fail("requiredInputs become duplicate contract fields after normalization");
  const loop = new GovernedEngineeringLoop({ rootDir: options.rootDir || process.cwd(), maxAttempts: scope.maxAttempts }).run({
    goalId: `revenue-execution-${safeName}`,
    goal: `Prepare an isolated deliverable-input contract for ${text(mission.opportunity && mission.opportunity.title, "opportunity.title", 300)}`,
    domain: "revenue",
    engineeringSpec: {
      template: "required_fields_validator",
      modulePath: `src/generated/revenue/${safeName}.js`,
      testPath: `src/generated/revenue/${safeName}.test.js`,
      requiredFields
    }
  });
  const status = ({ READY_FOR_FOUNDER_REVIEW: "ready_for_founder_review", CHANGES_REQUIRED: "changes_required", REJECTED: "rejected" })[loop.status] || "blocked";
  return {
    status,
    revisionNumber,
    boundedScope: { ...scope, revisionResponse: options.revisionResponse || null, approvedBy: "founder", approvedAt: new Date().toISOString(), scopeHash: crypto.createHash("sha256").update(JSON.stringify(scope)).digest("hex") },
    architecturePlan: loop.plan,
    workPackages: buildWorkPackages(loop.plan, scope),
    executionEvidence: evidencePacket(loop, revisionNumber)
  };
}
async function prepareMission(missionId, scopeInput, context = {}) {
  const mongoose = require("mongoose");
  const { RevenueExecutionMission } = require("../models/RevenueExecutionMission");
  const { founderApprovalGranted } = require("./revenueConversionService");
  if (!founderApprovalGranted(context.founderApproved)) fail("Founder approval is required to approve bounded scope", 403);
  if (!mongoose.Types.ObjectId.isValid(String(missionId || ""))) fail("Invalid execution mission id", 400);
  const mission = await RevenueExecutionMission.findById(missionId);
  if (!mission) fail("Execution mission not found", 404);
  Object.assign(mission, preparePreview(mission, scopeInput, { rootDir: context.rootDir, revisionNumber: 1 }));
  await mission.save();
  return mission.toJSON();
}
function buildResubmissionPreview(missionInput, scopeInput, responseInput, options = {}) {
  const mission = missionInput && typeof missionInput.toObject === "function" ? missionInput.toObject() : missionInput || {};
  if (mission.status !== "changes_required" || mission.founderDecision?.decision !== "request_changes") fail("Only Founder-requested changes can be resubmitted", 409);
  const currentRevision = Number(mission.revisionNumber) || 1;
  if (currentRevision >= 3) fail("Maximum three evidence revisions reached", 409);
  const responseToFounder = text(responseInput, "responseToFounder", 2000);
  const history = Array.isArray(mission.revisionHistory) ? [...mission.revisionHistory] : [];
  history.push({
    revisionNumber: currentRevision,
    scopeHash: mission.boundedScope?.scopeHash || null,
    loopId: mission.executionEvidence?.loopId || null,
    finalPatchSha256: mission.executionEvidence?.finalPatchSha256 || null,
    founderDecisionHash: mission.founderDecision?.decisionHash || null,
    founderNotes: mission.founderDecision?.notes || "",
    responseToFounder,
    archivedAt: new Date().toISOString()
  });
  return {
    ...preparePreview(mission, scopeInput, { rootDir: options.rootDir, allowReplay: true, revisionNumber: currentRevision + 1, revisionResponse: responseToFounder }),
    founderDecision: null,
    revisionHistory: history
  };
}
async function resubmitMission(missionId, input = {}, context = {}) {
  const mongoose = require("mongoose");
  const { RevenueExecutionMission } = require("../models/RevenueExecutionMission");
  const { founderApprovalGranted } = require("./revenueConversionService");
  if (!founderApprovalGranted(context.founderApproved)) fail("Founder approval is required to resubmit corrected scope", 403);
  if (!mongoose.Types.ObjectId.isValid(String(missionId || ""))) fail("Invalid execution mission id", 400);
  const mission = await RevenueExecutionMission.findById(missionId);
  if (!mission) fail("Execution mission not found", 404);
  const { responseToFounder, ...scope } = input;
  Object.assign(mission, buildResubmissionPreview(mission, scope, responseToFounder, { rootDir: context.rootDir }));
  await mission.save();
  return mission.toJSON();
}
module.exports = { buildResubmissionPreview, buildWorkPackages, evidencePacket, normalizeScope, prepareMission, preparePreview, resubmitMission };
