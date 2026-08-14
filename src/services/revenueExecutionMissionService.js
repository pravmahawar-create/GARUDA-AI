const crypto = require("crypto");
const ArchitectBrain = require("../../scripts/dev-agent/core/ArchitectBrain");
const capabilityRegistry = require("./capabilityRegistryService");
const { assertCurrentSourceTruth } = require("./revenueSourceTruthService");

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
  if (verification.prohibitedContentClear !== true || verification.scamSignalsClear !== true) fail("Candidate safety verification gates are incomplete", 409);
  assertCurrentSourceTruth(candidate, options.now ? new Date(options.now) : new Date(), { maxAgeMs: options.sourceTruthMaxAgeMs });
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
  const { validateConfirmedIntake } = require("./revenueWorkIntakeService");
  const intake = validateConfirmedIntake(options.workIntake, candidateId);
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
      score: Number(candidate.score) || 0,
      listingClassification: "public_listing_not_contract",
      engagementVerification: {
        verified: true,
        reference: String(intake.engagement.reference),
        evidenceKind: String(intake.engagement.evidenceKind),
        verifiedAt: String(intake.engagement.verifiedAt),
        workAuthorizationConfirmed: true,
        termsAcceptedByClient: true,
        truthHash: String(intake.truthHash)
      },
      brief: intake.brief
    },
    realWorkIntake: {
      id: String(intake._id || intake.id || ""),
      status: String(intake.status),
      truthHash: String(intake.truthHash),
      lastAuditHash: intake.lastAuditHash || null,
      listingClassification: "public_listing_not_contract",
      workAuthorizationConfirmed: true
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
      founderApprovalRequiredForExternalActions: true,
      verifiedRealWorkRequired: true,
      listingAloneNeverCreatesMission: true
    }
  };
  const hashPayload = {
    missionKey,
    candidateId,
    incomeGoalId,
    opportunity: payload.opportunity,
    realWorkIntake: payload.realWorkIntake,
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
  const { RevenueWorkIntake } = require("../models/RevenueWorkIntake");
  const workIntake = context.workIntake || await RevenueWorkIntake.findOne({ candidateId: candidate._id });
  const preview = buildMissionPreview(candidate, { rootDir: context.rootDir, workIntake });
  const existing = await RevenueExecutionMission.findOne({ candidateId: candidate._id });
  if (existing) {
    if (existing.realWorkIntake?.truthHash !== preview.realWorkIntake.truthHash) fail("An existing listing-only or stale mission cannot be promoted without matching verified real-work evidence", 409);
    return { ...existing.toJSON(), truthStatus: "verified_real_work" };
  }
  const { preparePreview } = require("./revenueMissionOrchestratorService");
  const prepared = preparePreview(preview, {
    deliverableType: workIntake.brief.deliverableType,
    requiredInputs: workIntake.brief.requiredInputs,
    acceptanceCriteria: workIntake.brief.acceptanceCriteria,
    constraints: [
      "Execute only against the verified real-work intake",
      "No external action without separate Founder approval",
      `Confirmed deadline: ${workIntake.brief.deadline}`,
      `Confirmed price: ${workIntake.brief.price.currency} ${workIntake.brief.price.amount}`
    ],
    maxAttempts: 2
  }, { rootDir: context.rootDir, revisionNumber: 1 });
  const record = { ...preview, ...prepared };
  const stored = await RevenueExecutionMission.findOneAndUpdate(
    { candidateId: candidate._id },
    { $setOnInsert: record },
    { new: true, upsert: true, runValidators: true }
  );
  if (!stored.deliverableWorkspace) {
    stored.deliverableWorkspace = {
      status: "active",
      totalTasks: 0,
      completedTasks: 0,
      blockedTasks: 0,
      progressPercent: 0,
      externalActionsAuthorized: false
    };
    await stored.save();
  }
  return { ...stored.toJSON(), truthStatus: "verified_real_work" };
}

async function listMissions(filters = {}) {
  const { RevenueExecutionMission } = require("../models/RevenueExecutionMission");
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.incomeGoalId) query.incomeGoalId = filters.incomeGoalId;
  const limit = Math.min(100, Math.max(1, Number(filters.limit) || 50));
  const items = await RevenueExecutionMission.find(query).sort({ createdAt: -1 }).limit(limit);
  return items.map((item) => {
    const mission = item.toJSON();
    return { ...mission, truthStatus: mission.realWorkIntake?.truthHash ? "verified_real_work" : "listing_only_not_contract" };
  });
}

module.exports = { buildMissionPreview, createFromApprovedCandidate, listMissions, validateApprovedCandidate };
