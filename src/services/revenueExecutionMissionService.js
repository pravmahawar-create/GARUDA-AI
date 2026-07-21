const crypto = require("crypto");
const ArchitectBrain = require("../../scripts/dev-agent/core/ArchitectBrain");
const capabilityRegistry = require("./capabilityRegistryService");

function fail(message, statusCode = 400) {
  throw Object.assign(new Error(message), { statusCode });
}

function plain(candidate) {
  return candidate && typeof candidate.toObject === "function" ? candidate.toObject() : candidate || {};
}

function validateApprovedCandidate(candidateInput, options = {}) {
  const candidate = plain(candidateInput);
  if (candidate.status !== "approved") fail("Candidate must have Founder-approved status", 409);
  if (!candidate.decision || String(candidate.decision.actor || "").toLowerCase() !== "founder" || !candidate.decision.decidedAt || !Number.isFinite(Date.parse(candidate.decision.decidedAt))) fail("Candidate Founder approval evidence is incomplete", 409);
  if (candidate.opportunityChannel !== "garuda_deliverable") fail("Candidate is not a GARUDA-deliverable opportunity", 409);
  const assessment = candidate.capabilityAssessment || {};
  if (assessment.selfEarningEligible !== true || assessment.humanIdentityRequired === true) fail("Candidate is not eligible for GARUDA self-execution", 409);
  const verification = candidate.verification || {};
  const verificationPassed = verification.sourceVerified === true && verification.originalLinkPresent === true && verification.prohibitedContentClear === true && verification.scamSignalsClear === true;
  if (!verificationPassed) fail("Candidate verification gates are incomplete", 409);
  if (!/^https:\/\//i.test(String(candidate.url || ""))) fail("Candidate requires a secure original source link", 409);
  const matches = Array.isArray(assessment.matches) ? assessment.matches : [];
  if (!matches.length || !matches[0].capabilityId) fail("Candidate has no verified capability match", 409);
  const capability = capabilityRegistry.getCapability(matches[0].capabilityId, { rootDir: options.rootDir || process.cwd() });
  if (!capability || capability.eligibleForMatching !== true || capability.humanIdentityRequired === true) fail("Matched GARUDA capability is not currently verified and commercializable", 409);
  return { candidate, capability, match: matches[0] };
}

function buildMissionPreview(candidateInput, options = {}) {
  const { candidate, capability, match } = validateApprovedCandidate(candidateInput, options);
  const candidateId = String(candidate._id || candidate.id || "");
  const incomeGoalId = String(candidate.missionId || "");
  if (!candidateId || !incomeGoalId) fail("Candidate identity and income mission are required", 409);
  const missionKey = `candidate:${candidateId}`;
  const architecturePlan = new ArchitectBrain().plan({
    goalId: `revenue-${candidateId}`,
    goal: `Prepare a bounded GARUDA deliverable plan for approved opportunity: ${String(candidate.title || "Untitled opportunity").slice(0, 300)}`,
    domain: "revenue"
  });
  const payload = {
    engine: "GARUDA Revenue Execution Mission Bridge v1",
    missionKey,
    candidateId,
    incomeGoalId,
    status: "awaiting_bounded_scope",
    opportunity: {
      title: String(candidate.title || ""),
      company: String(candidate.company || ""),
      source: String(candidate.source || ""),
      originalUrl: String(candidate.url || ""),
      score: Number(candidate.score) || 0
    },
    capability: {
      id: capability.id,
      name: capability.name,
      universe: capability.universe,
      readiness: capability.readiness,
      matchScore: Number(match.score) || 0,
      executionMode: capability.executionMode
    },
    architecturePlan,
    executionPath: ["architect", "engineering", "tester", "reviewer", "founder"],
    approvalEvidence: {
      candidateStatus: candidate.status,
      actor: String(candidate.decision.actor),
      decidedAt: new Date(candidate.decision.decidedAt).toISOString()
    },
    governance: {
      boundedScopeRequiredBeforeEngineering: true,
      automaticOutreachAllowed: false,
      automaticApplicationAllowed: false,
      automaticContractAcceptanceAllowed: false,
      automaticSpendingAllowed: false,
      automaticPaymentActionAllowed: false,
      automaticDeliveryAllowed: false,
      sourceApplyAllowed: false,
      commitPushDeployAllowed: false,
      founderApprovalRequiredForExternalActions: true
    }
  };
  const hashPayload = {
    missionKey,
    candidateId,
    incomeGoalId,
    opportunity: payload.opportunity,
    capability: payload.capability,
    architecturePlanId: architecturePlan.planId,
    approvalEvidence: payload.approvalEvidence,
    governance: payload.governance
  };
  return { ...payload, missionHash: crypto.createHash("sha256").update(JSON.stringify(hashPayload)).digest("hex") };
}

async function createFromApprovedCandidate(candidateId, context = {}) {
  const mongoose = require("mongoose");
  const { DiscoveryCandidate } = require("../models/DiscoveryCandidate");
  const { RevenueExecutionMission } = require("../models/RevenueExecutionMission");
  const { founderApprovalGranted } = require("./revenueConversionService");
  if (!founderApprovalGranted(context.founderApproved)) fail("Founder approval is required to create an execution mission", 403);
  if (!mongoose.Types.ObjectId.isValid(String(candidateId || ""))) fail("Invalid candidate id", 400);
  const candidate = await DiscoveryCandidate.findById(candidateId);
  if (!candidate) fail("Discovery candidate not found", 404);
  const preview = buildMissionPreview(candidate, { rootDir: context.rootDir });
  const stored = await RevenueExecutionMission.findOneAndUpdate(
    { candidateId: candidate._id },
    { $setOnInsert: preview },
    { new: true, upsert: true, runValidators: true }
  );
  return stored.toJSON();
}

async function listMissions(filters = {}) {
  const { RevenueExecutionMission } = require("../models/RevenueExecutionMission");
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.incomeGoalId) query.incomeGoalId = filters.incomeGoalId;
  const limit = Math.min(100, Math.max(1, Number(filters.limit) || 50));
  const items = await RevenueExecutionMission.find(query).sort({ createdAt: -1 }).limit(limit);
  return items.map((item) => item.toJSON());
}

module.exports = { buildMissionPreview, createFromApprovedCandidate, listMissions, validateApprovedCandidate };
