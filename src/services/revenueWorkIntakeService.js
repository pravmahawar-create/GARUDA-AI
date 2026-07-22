const crypto = require("crypto");

const HANDOFF_TYPES = ["application", "quotation"];
const ENGAGEMENT_CHANNELS = ["email", "platform_message", "video_call", "phone_call", "signed_document", "purchase_order"];
const EVIDENCE_KINDS = ["accepted_quotation", "signed_contract", "platform_award", "purchase_order"];

function fail(message, statusCode = 400) {
  throw Object.assign(new Error(message), { statusCode });
}

function hash(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function text(value, name, max = 1000) {
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

function isoDate(value, name, now, future = false) {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) fail(`${name} must be a valid date`);
  if (future && parsed.getTime() <= now.getTime()) fail(`${name} must be in the future`);
  if (!future && parsed.getTime() > now.getTime()) fail(`${name} cannot be in the future`);
  return parsed.toISOString();
}

function money(input = {}) {
  const amount = Number(input.amount);
  const currency = String(input.currency || "").trim().toUpperCase();
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) fail("price.amount must be a positive finite amount");
  if (!/^[A-Z]{3}$/.test(currency)) fail("price.currency must be a three-letter currency code");
  return { amount, currency };
}

function requireProductionAttestation(input = {}) {
  const attestation = input.attestation || {};
  if (attestation.productionData !== true || attestation.noPlaceholderData !== true) {
    fail("Production intake requires explicit confirmation that every field is genuine and contains no demo, fake, or placeholder data", 409);
  }
  return { productionData: true, noPlaceholderData: true };
}

function candidateSnapshot(candidate) {
  return {
    title: String(candidate.title || ""),
    company: String(candidate.company || ""),
    source: String(candidate.source || ""),
    originalUrl: String(candidate.url || ""),
    score: Number(candidate.score) || 0,
    classification: "public_listing_not_contract"
  };
}

function candidateContext(candidateInput, options = {}) {
  const { validateApprovedCandidate } = require("./revenueExecutionMissionService");
  const validated = validateApprovedCandidate(candidateInput, options);
  const candidate = validated.candidate;
  const candidateId = String(candidate._id || candidate.id || "");
  const incomeGoalId = String(candidate.missionId || "");
  if (!candidateId || !incomeGoalId) fail("Candidate identity and income mission are required", 409);
  return { ...validated, candidateId, incomeGoalId, listing: candidateSnapshot(candidate) };
}

function buildHandoffPreview(candidateInput, input = {}, now = new Date(), options = {}) {
  const context = candidateContext(candidateInput, options);
  requireProductionAttestation(input);
  const handoffType = text(input.handoffType, "handoffType", 40).toLowerCase();
  if (!HANDOFF_TYPES.includes(handoffType)) fail(`handoffType must be one of: ${HANDOFF_TYPES.join(", ")}`);
  if (input.founderAuthorized !== true) fail("Founder authorization is required to prepare an application or quotation handoff", 403);
  const payload = {
    candidateId: context.candidateId,
    handoffType,
    destination: text(input.destination, "destination", 500),
    summary: text(input.summary, "summary", 2000),
    preparedAt: now.toISOString(),
    founderAuthorization: { actor: "founder", authorized: true, authorizedAt: now.toISOString() },
    governance: {
      manualSubmissionRequired: true,
      automaticSubmissionAllowed: false,
      externalExecutionPerformed: false,
      contractConfirmed: false,
      missionCreationAllowed: false
    }
  };
  return {
    candidateId: context.candidateId,
    incomeGoalId: context.incomeGoalId,
    status: "handoff_ready",
    listing: context.listing,
    handoff: { ...payload, packageHash: hash(payload) },
    truthHash: hash({ listing: context.listing, payload }),
    governance: {
      listingIsNotContract: true,
      realWorkVerificationRequiredForMission: true,
      externalExecutionAuthorized: false,
      paidServiceAuthorized: false
    }
  };
}

function buildConfirmedWorkIntake(candidateInput, input = {}, now = new Date(), options = {}) {
  const context = candidateContext(candidateInput, options);
  const attestation = requireProductionAttestation(input);
  const engagementInput = input.engagement || {};
  const briefInput = input.brief || {};
  const channel = text(engagementInput.channel, "engagement.channel", 60).toLowerCase();
  const evidenceKind = text(engagementInput.evidenceKind, "engagement.evidenceKind", 60).toLowerCase();
  if (!ENGAGEMENT_CHANNELS.includes(channel)) fail(`engagement.channel must be one of: ${ENGAGEMENT_CHANNELS.join(", ")}`);
  if (!EVIDENCE_KINDS.includes(evidenceKind)) fail(`engagement.evidenceKind must be one of: ${EVIDENCE_KINDS.join(", ")}`);
  for (const gate of ["clientIdentityVerified", "evidenceReviewedByFounder", "workAuthorizationConfirmed", "termsAcceptedByClient"]) {
    if (engagementInput[gate] !== true) fail(`engagement.${gate} must be explicitly confirmed`, 409);
  }
  for (const gate of ["clientBriefConfirmed", "priceConfirmedByClient", "deadlineConfirmedByClient"]) {
    if (briefInput[gate] !== true) fail(`brief.${gate} must be explicitly confirmed`, 409);
  }
  const engagement = {
    verified: true,
    counterparty: text(engagementInput.counterparty, "engagement.counterparty", 200),
    channel,
    evidenceKind,
    reference: text(engagementInput.reference, "engagement.reference", 500),
    occurredAt: isoDate(engagementInput.occurredAt, "engagement.occurredAt", now, false),
    verifiedAt: now.toISOString(),
    verifiedBy: "founder",
    clientIdentityVerified: true,
    evidenceReviewedByFounder: true,
    workAuthorizationConfirmed: true,
    termsAcceptedByClient: true
  };
  const brief = {
    title: text(briefInput.title, "brief.title", 300),
    deliverableType: text(briefInput.deliverableType, "brief.deliverableType", 120),
    scopeSummary: text(briefInput.scopeSummary, "brief.scopeSummary", 3000),
    requiredInputs: list(briefInput.requiredInputs, "brief.requiredInputs"),
    price: money(briefInput.price),
    deadline: isoDate(briefInput.deadline, "brief.deadline", now, true),
    acceptanceCriteria: list(briefInput.acceptanceCriteria, "brief.acceptanceCriteria"),
    clientBriefConfirmed: true,
    priceConfirmedByClient: true,
    deadlineConfirmedByClient: true
  };
  const truth = { candidateId: context.candidateId, incomeGoalId: context.incomeGoalId, listing: context.listing, engagement, brief, attestation };
  return {
    candidateId: context.candidateId,
    incomeGoalId: context.incomeGoalId,
    status: "work_confirmed",
    listing: context.listing,
    engagement,
    brief,
    truthHash: hash(truth),
    governance: {
      listingIsNotContract: true,
      genuineClientEngagementVerified: true,
      workAuthorizationConfirmed: true,
      missionCreationAllowed: true,
      externalExecutionAuthorized: false,
      automaticApplicationAllowed: false,
      automaticQuotationSubmissionAllowed: false,
      automaticContractAcceptanceAllowed: false,
      paidServiceAuthorized: false
    }
  };
}

function validateConfirmedIntake(intakeInput, candidateId) {
  const intake = intakeInput && typeof intakeInput.toObject === "function" ? intakeInput.toObject() : intakeInput || {};
  if (!["work_confirmed", "mission_created"].includes(intake.status)) fail("A verified and client-authorized real-work intake is required before mission creation", 409);
  if (String(intake.candidateId || "") !== String(candidateId || "")) fail("Work intake does not belong to this candidate", 409);
  if (!/^[a-f0-9]{64}$/.test(String(intake.truthHash || ""))) fail("Work-intake truth evidence is incomplete", 409);
  if (intake.listing?.classification !== "public_listing_not_contract") fail("Listing truth classification is missing", 409);
  if (intake.engagement?.verified !== true || intake.engagement?.workAuthorizationConfirmed !== true || intake.engagement?.termsAcceptedByClient !== true) fail("Client work authorization is not verified", 409);
  if (!EVIDENCE_KINDS.includes(String(intake.engagement?.evidenceKind || ""))) fail("Accepted work evidence is missing", 409);
  if (!intake.brief?.price?.amount || !intake.brief?.deadline || !(intake.brief?.acceptanceCriteria || []).length) fail("Confirmed price, deadline, and acceptance criteria are required", 409);
  const expectedTruthHash = hash({
    candidateId: String(intake.candidateId),
    incomeGoalId: String(intake.incomeGoalId),
    listing: intake.listing,
    engagement: intake.engagement,
    brief: intake.brief,
    attestation: { productionData: true, noPlaceholderData: true }
  });
  if (expectedTruthHash !== intake.truthHash) fail("Work-intake truth evidence does not match the verified terms", 409);
  return intake;
}

function buildAuditEvent(input = {}, now = new Date()) {
  const payload = {
    intakeId: text(input.intakeId, "intakeId", 80),
    candidateId: text(input.candidateId, "candidateId", 80),
    sequence: Number(input.sequence),
    eventType: text(input.eventType, "eventType", 80),
    actor: input.actor === "garuda" ? "garuda" : "founder",
    details: input.details || {},
    previousEventHash: input.previousEventHash || null,
    occurredAt: now.toISOString()
  };
  if (!Number.isInteger(payload.sequence) || payload.sequence < 1) fail("Audit sequence must be a positive integer");
  return { ...payload, eventHash: hash(payload) };
}

async function requireCandidate(candidateId) {
  const mongoose = require("mongoose");
  const { DiscoveryCandidate } = require("../models/DiscoveryCandidate");
  if (!mongoose.Types.ObjectId.isValid(String(candidateId || ""))) fail("Invalid candidate id");
  const candidate = await DiscoveryCandidate.findById(candidateId);
  if (!candidate) fail("Discovery candidate not found", 404);
  return candidate;
}

async function appendAudit(intake, eventType, actor, details, now = new Date()) {
  const { RevenueWorkIntakeEvent } = require("../models/RevenueWorkIntakeEvent");
  const previous = await RevenueWorkIntakeEvent.findOne({ intakeId: intake._id }).sort({ sequence: -1 });
  const event = buildAuditEvent({
    intakeId: String(intake._id),
    candidateId: String(intake.candidateId),
    sequence: previous ? previous.sequence + 1 : 1,
    eventType,
    actor,
    details,
    previousEventHash: previous?.eventHash || null
  }, now);
  const stored = await RevenueWorkIntakeEvent.create(event);
  intake.lastAuditHash = event.eventHash;
  await intake.save();
  return stored.toJSON();
}

async function prepareHandoff(candidateId, input = {}, context = {}) {
  const { founderApprovalGranted } = require("./revenueConversionService");
  const { RevenueWorkIntake } = require("../models/RevenueWorkIntake");
  if (!founderApprovalGranted(context.founderApproved)) fail("Founder approval is required to prepare an application or quotation handoff", 403);
  const candidate = await requireCandidate(candidateId);
  const preview = buildHandoffPreview(candidate, input, new Date(), { rootDir: context.rootDir });
  let intake = await RevenueWorkIntake.findOne({ candidateId: candidate._id });
  const sameHandoff = intake?.handoff?.packageHash === preview.handoff.packageHash;
  if (!intake) intake = await RevenueWorkIntake.create(preview);
  else {
    intake.handoff = preview.handoff;
    if (!intake.executionMissionId) intake.status = intake.engagement ? "work_confirmed" : "handoff_ready";
    if (!intake.engagement) intake.truthHash = preview.truthHash;
    intake.governance = { ...(intake.governance || {}), ...preview.governance };
    await intake.save();
  }
  if (!sameHandoff) await appendAudit(intake, "handoff_prepared", "founder", {
    handoffType: preview.handoff.handoffType,
    destination: preview.handoff.destination,
    summary: preview.handoff.summary,
    packageHash: preview.handoff.packageHash,
    externalExecutionPerformed: false,
    contractConfirmed: false
  });
  return getIntakeByCandidate(candidateId);
}

async function verifyAndCreateMission(candidateId, input = {}, context = {}) {
  const { founderApprovalGranted } = require("./revenueConversionService");
  const { RevenueWorkIntake } = require("../models/RevenueWorkIntake");
  if (!founderApprovalGranted(context.founderApproved)) fail("Founder approval is required to verify real work and create a mission", 403);
  const candidate = await requireCandidate(candidateId);
  const preview = buildConfirmedWorkIntake(candidate, input, new Date(), { rootDir: context.rootDir });
  let intake = await RevenueWorkIntake.findOne({ candidateId: candidate._id });
  if (intake?.executionMissionId && intake.truthHash !== preview.truthHash) fail("Verified terms cannot be replaced after mission creation; create a separately reviewed intake instead", 409);
  const sameTruth = intake?.truthHash === preview.truthHash && ["work_confirmed", "mission_created"].includes(intake.status);
  if (!intake) intake = await RevenueWorkIntake.create(preview);
  else {
    intake.status = intake.executionMissionId ? "mission_created" : "work_confirmed";
    intake.listing = preview.listing;
    intake.engagement = preview.engagement;
    intake.brief = preview.brief;
    intake.truthHash = preview.truthHash;
    intake.governance = { ...(intake.governance || {}), ...preview.governance };
    await intake.save();
  }
  if (!sameTruth) await appendAudit(intake, "work_confirmed", "founder", {
    truthHash: preview.truthHash,
    listingClassification: preview.listing.classification,
    engagement: preview.engagement,
    brief: preview.brief
  });
  const { createFromApprovedCandidate } = require("./revenueExecutionMissionService");
  const mission = await createFromApprovedCandidate(candidateId, { ...context, workIntake: intake });
  if (!intake.executionMissionId) {
    intake.executionMissionId = mission.id;
    intake.status = "mission_created";
    await intake.save();
    await appendAudit(intake, "mission_created", "garuda", { missionId: mission.id, missionHash: mission.missionHash, truthHash: intake.truthHash });
  }
  return { intake: await getIntakeByCandidate(candidateId), mission };
}

async function getIntakeByCandidate(candidateId) {
  const { RevenueWorkIntake } = require("../models/RevenueWorkIntake");
  const { RevenueWorkIntakeEvent } = require("../models/RevenueWorkIntakeEvent");
  const intake = await RevenueWorkIntake.findOne({ candidateId });
  if (!intake) return null;
  const auditTrail = await RevenueWorkIntakeEvent.find({ intakeId: intake._id }).sort({ sequence: 1 });
  return { ...intake.toJSON(), auditTrail: auditTrail.map((event) => event.toJSON()) };
}

async function listIntakes(filters = {}) {
  const { RevenueWorkIntake } = require("../models/RevenueWorkIntake");
  const { RevenueWorkIntakeEvent } = require("../models/RevenueWorkIntakeEvent");
  const query = {};
  if (filters.status) query.status = filters.status;
  const limit = Math.min(100, Math.max(1, Number(filters.limit) || 50));
  const intakes = await RevenueWorkIntake.find(query).sort({ updatedAt: -1 }).limit(limit);
  const events = await RevenueWorkIntakeEvent.find({ intakeId: { $in: intakes.map((item) => item._id) } }).sort({ sequence: 1 });
  const byIntake = new Map();
  for (const event of events) {
    const key = String(event.intakeId);
    byIntake.set(key, [...(byIntake.get(key) || []), event.toJSON()]);
  }
  return intakes.map((intake) => ({ ...intake.toJSON(), auditTrail: byIntake.get(String(intake._id)) || [] }));
}

module.exports = {
  EVIDENCE_KINDS,
  ENGAGEMENT_CHANNELS,
  HANDOFF_TYPES,
  buildAuditEvent,
  buildConfirmedWorkIntake,
  buildHandoffPreview,
  getIntakeByCandidate,
  hash,
  listIntakes,
  prepareHandoff,
  validateConfirmedIntake,
  verifyAndCreateMission
};
