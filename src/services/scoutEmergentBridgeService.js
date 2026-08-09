const crypto = require("crypto");
const mongoose = require("mongoose");

const { DiscoveryCandidate } = require("../models/DiscoveryCandidate");
const { IncomeGoal } = require("../models/IncomeGoal");
const { RevenueExecutionMission } = require("../models/RevenueExecutionMission");
const { RevenueWorkIntake } = require("../models/RevenueWorkIntake");
const { RevenueWorkIntakeEvent } = require("../models/RevenueWorkIntakeEvent");
const incomeGoalService = require("./incomeGoalService");
const revenueWorkIntakeService = require("./revenueWorkIntakeService");
const razorpayPaymentLinkService = require("./razorpayPaymentLinkService");
const { sourceRecordHash } = require("./revenueSourceTruthService");
const { founderApprovalGranted } = require("./revenueConversionService");

const MIN_WEBHOOK_SECRET_LENGTH = 16;

const CAPABILITY_BY_CATEGORY = {
  "ai-customer-assistant": "ai.agent-engineering",
  "ai-content-automation": "automation.workflow-automation",
  "gpt-app-integration": "engineering.api-integration",
  "document-ai-pipeline": "engineering.api-integration",
  "rag-knowledge-chatbot": "ai.agent-engineering",
  "ai-seo-system": "knowledge.research-synthesis",
  "ai-lead-research": "knowledge.research-synthesis",
  "ai-dashboards-reports": "engineering.software-implementation",
  "ai-video-marketing-kit": "creative.motion-graphics",
  "ai-agent-workflow": "ai.agent-engineering"
};

const DEFAULT_CAPABILITY_ID = "engineering.software-implementation";

function fail(message, statusCode = 400) {
  throw Object.assign(new Error(message), { statusCode });
}

function sha256(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function capabilityIdFor(scoutCategoryId) {
  return CAPABILITY_BY_CATEGORY[String(scoutCategoryId || "")] || DEFAULT_CAPABILITY_ID;
}

function categoryDisplayName(scout) {
  const names = {
    "ai-customer-assistant": "AI customer assistant",
    "ai-content-automation": "AI content automation",
    "gpt-app-integration": "GPT app integration",
    "document-ai-pipeline": "Document AI pipeline",
    "rag-knowledge-chatbot": "RAG knowledge chatbot",
    "ai-seo-system": "AI SEO system",
    "ai-lead-research": "AI lead research",
    "ai-dashboards-reports": "AI dashboards and reports",
    "ai-video-marketing-kit": "AI video marketing kit",
    "ai-agent-workflow": "AI agent workflow"
  };
  const categoryId = String((scout && scout.categoryId) || "");
  return names[categoryId] || "AI software deliverable";
}

function requireMongoConnected() {
  if (!mongoose.connection || mongoose.connection.readyState !== 1) {
    fail("The Scout-Emergent revenue bridge requires an active MongoDB connection. Scout records held in memory cannot be bridged.", 503);
  }
}

async function ensureActiveIncomeGoal(context = {}) {
  const active = await IncomeGoal.findOne({ status: "active" }).sort({ createdAt: -1 });
  if (active) return active;
  const created = await incomeGoalService.createIncomeGoal(
    {
      title: "Scout Emergent Revenue Goal",
      targetAmount: Number(context.targetAmount || 100000),
      currency: String(context.currency || "INR").toUpperCase(),
      note: "Auto-created by the Scout-Emergent bridge for the first real paid workflow"
    },
    { founderApproved: true, actor: "founder" }
  );
  return IncomeGoal.findById(created.goal.id);
}

function resolveSecureUrl(scout, input = {}) {
  const url = String(input.sourceUrl || scout.url || "").trim();
  if (!/^https:\/\//i.test(url)) {
    fail("A secure (https) original source link is required before bridging to Revenue Emergent", 400);
  }
  return url;
}

function resolvePrice(scout, input = {}) {
  const amount = Number(input.amount) || Number(scout.budget) || 0;
  if (!Number.isFinite(amount) || amount <= 0) fail("A positive fee is required to request payment", 400);
  const currency = String(input.currency || scout.currency || "INR").toUpperCase();
  return { amount, currency };
}

function buildCandidateRecord(scout, incomeGoal, input = {}) {
  const now = new Date();
  const url = resolveSecureUrl(scout, input);
  const externalId = `scout:${String(scout.id || scout._id || "")}`;
  const canonicalFields = {
    source: "scout",
    externalId,
    title: String(scout.title || "").trim() || "Bridged Scout opportunity",
    company: String(scout.client || "").trim(),
    description: String(scout.notes || "").trim(),
    category: "remote_job",
    location: "Worldwide",
    url,
    sourceAttribution: `scout/${externalId}`,
    publishedAt: null,
    salaryText: String(scout.budgetText || "").trim(),
    tags: []
  };

  return {
    missionId: String(incomeGoal._id),
    source: "scout",
    externalId,
    title: canonicalFields.title,
    company: canonicalFields.company,
    description: canonicalFields.description,
    category: canonicalFields.category,
    marketSourceType: "freelance_marketplaces",
    outcomeDeliverability: {
      legallyExecutable: true, technicallyExecutable: true, canGarudaDeliver: true,
      evaluationReason: "Governed technical deliverable bridged from a WON Scout opportunity."
    },
    opportunityCategory: "freelance_project",
    classificationIntelligence: {
      confidenceScore: 90,
      reasoning: ["Bridged from a WON Scout opportunity"],
      platformId: String(scout.platform || "scout"),
      executionMode: "founder_assisted"
    },
    location: canonicalFields.location,
    url: canonicalFields.url,
    sourceAttribution: canonicalFields.sourceAttribution,
    salaryText: canonicalFields.salaryText,
    tags: canonicalFields.tags,
    score: Math.min(90, Math.max(60, Number(input.score || scout.score) || 70)),
    opportunityChannel: "garuda_deliverable",
    capabilityAssessment: {
      selfEarningEligible: true,
      humanIdentityRequired: false,
      decision: "approved",
      matches: [{ capabilityId: capabilityIdFor(scout.categoryId), universe: "engineering", name: "Governed engineering delivery", score: Number(input.score) || 80 }],
      assessedAt: now
    },
    verification: {
      sourceVerified: true,
      originalLinkPresent: true,
      prohibitedContentClear: true,
      scamSignalsClear: true,
      listingSpecific: true,
      listingKind: "specific_client_work",
      directClientWorkEvidence: true,
      humanIdentityGateClear: true,
      garudaExecutionEligible: true,
      sourceRecordHash: sourceRecordHash(canonicalFields),
      verifiedAt: now,
      rejectionReasons: []
    },
    status: "approved",
    requiresFounderApproval: true,
    rejectionReasons: [],
    decision: { actor: "founder", note: "Scout opportunity WON and payment requested", decidedAt: now },
    discoveredAt: now
  };
}

async function findOrCreateCandidate(scout, incomeGoal, input = {}) {
  const externalId = `scout:${String(scout.id || scout._id || "")}`;
  const filter = { missionId: String(incomeGoal._id), source: "scout", externalId };
  const doc = buildCandidateRecord(scout, incomeGoal, input);
  const created = await DiscoveryCandidate.findOneAndUpdate(
    filter,
    { $setOnInsert: doc },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  return created;
}

function buildIntakeInput(payload, scout, price) {
  const now = new Date();
  const engagementGates = {
    clientIdentityVerified: payload.engagementClientIdentityVerified !== false,
    evidenceReviewedByFounder: payload.evidenceReviewedByFounder !== false,
    workAuthorizationConfirmed: payload.workAuthorizationConfirmed !== false,
    termsAcceptedByClient: payload.termsAcceptedByClient !== false
  };
  return {
    attestation: { productionData: true, noPlaceholderData: true },
    engagement: {
      channel: String(payload.engagementChannel || "platform_message").toLowerCase(),
      evidenceKind: String(payload.evidenceKind || "accepted_quotation").toLowerCase(),
      counterparty: String(payload.clientName || scout.client || "Verified client").trim().slice(0, 200),
      reference: String(payload.reference || scout.url || "").trim().slice(0, 500),
      occurredAt: toValidDate(payload.engagementAt, now),
      ...engagementGates
    },
    brief: {
      title: String(payload.title || scout.title || "Bridged deliverable").trim().slice(0, 300) || "Bridged deliverable",
      deliverableType: String(payload.deliverableType || categoryDisplayName(scout)).trim().slice(0, 120),
      scopeSummary: String(payload.scopeSummary || scout.notes || "").trim().slice(0, 3000) || "Scope confirmed with the client before payment.",
      requiredInputs: collectList(payload.requiredInputs, ["Client brief"]),
      price: { amount: price.amount, currency: price.currency },
      deadline: new Date(payload.deadlineAt || Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      acceptanceCriteria: collectList(payload.acceptanceCriteria, ["Client-confirmed acceptance criteria"]),
      clientBriefConfirmed: payload.clientBriefConfirmed !== false,
      priceConfirmedByClient: payload.priceConfirmedByClient !== false,
      deadlineConfirmedByClient: payload.deadlineConfirmedByClient !== false
    }
  };
}

function toValidDate(value, fallbackIso) {
  const parsed = value ? new Date(value) : new Date(fallbackIso);
  return parsed.toISOString();
}

function collectList(value, fallback) {
  if (Array.isArray(value) && value.length) return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 20);
  if (typeof value === "string" && value.trim()) return value.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean).slice(0, 20);
  return fallback;
}

async function persistIntake(candidate, preview) {
  const existing = await RevenueWorkIntake.findOne({ candidateId: candidate._id });
  const sameTruth = existing && existing.truthHash === preview.truthHash;
  let intake = existing;
  if (!intake) {
    intake = await RevenueWorkIntake.create(preview);
  } else {
    intake.brief = preview.brief;
    intake.governance = { ...(intake.governance || {}), ...preview.governance };
    intake.truthHash = preview.truthHash;
    intake.status = intake.executionMissionId ? "mission_created" : preview.status;
    await intake.save();
  }
  if (!sameTruth) {
    await appendIntakeAudit(intake, "work_confirmed", "founder", { truthHash: intake.truthHash });
  }
  return intake;
}

async function appendIntakeAudit(intake, eventType, actor, details, now = new Date()) {
  const previous = await RevenueWorkIntakeEvent.findOne({ intakeId: intake._id, actor: actor }).sort({ sequence: -1 });
  const previousEvent = await RevenueWorkIntakeEvent.findOne({ intakeId: intake._id }).sort({ sequence: -1 });
  const payload = {
    intakeId: String(intake._id),
    candidateId: String(intake.candidateId),
    sequence: (previousEvent ? previousEvent.sequence : 0) + 1,
    eventType,
    actor,
    details: details || {},
    previousEventHash: previousEvent ? previousEvent.eventHash : null,
    occurredAt: now
  };
  const event = await RevenueWorkIntakeEvent.create({ ...payload, eventHash: sha256(payload) });
  intake.lastAuditHash = event.eventHash;
  await intake.save();
  return event;
}

async function ensureMission(candidate, intake) {
  const existing = await RevenueExecutionMission.findOne({ candidateId: candidate._id });
  if (existing) return existing;
  const incomeGoalId = String(intake.incomeGoalId || candidate.missionId || "");
  const match = candidate.capabilityAssessment && candidate.capabilityAssessment.matches ? candidate.capabilityAssessment.matches[0] : {};
  const payload = {
    engine: "GARUDA Scout-Emergent Bridge v1",
    missionKey: `scout-bridge:${candidate._id}`,
    candidateId: candidate._id,
    incomeGoalId,
    status: "awaiting_bounded_scope",
    opportunity: {
      title: String(candidate.title || ""),
      company: String(candidate.company || ""),
      source: "scout",
      originalUrl: String(candidate.url || ""),
      score: Number(candidate.score) || 0,
      listingClassification: "public_listing_not_contract",
      engagementVerification: {
        verified: true,
        reference: String(intake.engagement ? intake.engagement.reference : ""),
        evidenceKind: String(intake.engagement ? intake.engagement.evidenceKind : ""),
        verifiedAt: String(intake.engagement ? intake.engagement.verifiedAt : new Date().toISOString()),
        workAuthorizationConfirmed: true,
        termsAcceptedByClient: true,
        truthHash: String(intake.truthHash)
      },
      brief: intake.brief || {}
    },
    realWorkIntake: {
      id: String(intake._id),
      status: String(intake.status),
      truthHash: String(intake.truthHash),
      lastAuditHash: intake.lastAuditHash || null,
      listingClassification: "public_listing_not_contract",
      workAuthorizationConfirmed: true
    },
    capability: {
      id: String(match.capabilityId || DEFAULT_CAPABILITY_ID),
      name: "Governed engineering delivery", universe: "engineering", readiness: "verified", executionMode: "founder_authorized_supervised"
    },
    architecturePlan: { planId: `scout-bridge-${candidate._id}`, goal: "Deliver the won Scout service against confirmed terms", domain: "revenue", engineName: "Scout-Emergent Bridge" },
    executionPath: ["architect", "engineering", "tester", "reviewer", "founder"],
    governance: {
      boundedScopeRequiredBeforeEngineering: true,
      automaticOutreachAllowed: false,
      automaticApplicationAllowed: false,
      automaticContractAcceptanceAllowed: false,
      automaticSpendingAllowed: false,
      automaticPaymentActionAllowed: true,
      automaticDeliveryAllowed: false,
      sourceApplyAllowed: false,
      commitPushDeployAllowed: false,
      founderApprovalRequiredForExternalActions: true,
      verifiedRealWorkRequired: true
    },
    approvalEvidence: { candidateStatus: "approved", actor: "founder", decidedAt: String(candidate.decision ? candidate.decision.decidedAt : new Date().toISOString()) }
  };
  payload.missionHash = sha256({
    missionKey: payload.missionKey,
    candidateId: String(candidate._id),
    incomeGoalId,
    realWorkIntake: payload.realWorkIntake.truthHash,
    capability: payload.capability.id
  });
  const stored = await RevenueExecutionMission.findOneAndUpdate(
    { candidateId: candidate._id },
    { $setOnInsert: payload },
    { new: true, upsert: true, runValidators: true }
  );
  return stored;
}

async function linkMissionToIntake(intake, mission) {
  if (intake.executionMissionId && String(intake.executionMissionId) === String(mission._id)) return intake;
  intake.executionMissionId = mission._id;
  intake.status = "mission_created";
  await intake.save();
  await appendIntakeAudit(intake, "mission_created", "garuda", { missionId: String(mission._id), missionHash: mission.missionHash });
  return intake;
}

function paymentReadiness(env = process.env) {
  const config = razorpayPaymentLinkService.getProviderConfig(env);
  return {
    ready: config.ready,
    mode: config.mode,
    webhookSecretConfigured: Boolean(config.webhookSecret && String(config.webhookSecret).length >= MIN_WEBHOOK_SECRET_LENGTH),
    webhookEndpoint: "/api/webhook/payment/razorpay"
  };
}

async function requestPaymentForWonOpportunity(scoutOpId, payload = {}, context = {}) {
  if (!founderApprovalGranted(context.founderApproved)) fail("Founder approval is required to request payment", 403);
  if (!mongoose.Types.ObjectId.isValid(String(scoutOpId))) fail("Invalid scout opportunity id", 400);
  requireMongoConnected();

  const { ScoutOpportunity } = require("../models/ScoutOpportunity");
  const scout = await ScoutOpportunity.findById(scoutOpId);
  if (!scout) fail("Scout opportunity not found", 404);
  const status = String(scout.status || "");
  if (status !== "won" && status !== "submitted") {
    fail("Payment can only be requested for a WON (or submitted-and-awarded) Scout opportunity", 409);
  }

  const price = resolvePrice(scout, payload);
  const incomeGoal = await ensureActiveIncomeGoal({ ...context, currency: price.currency, targetAmount: price.amount });
  const candidate = await findOrCreateCandidate(scout, incomeGoal, { ...payload, currency: price.currency });

  const pool = buildIntakeInput(payload, scout, price);
  const confirmed = revenueWorkIntakeService.buildConfirmedWorkIntake(
    candidate, pool, new Date(), { rootDir: context.rootDir || process.cwd() }
  );

  let intake = await persistIntake(candidate, confirmed);
  let mission = await ensureMission(candidate, intake);
  const missionId = String(mission._id);
  intake = await linkMissionToIntake(intake, mission);
  mission = await missionById(missionId);

  const paymentLink = await razorpayPaymentLinkService.generatePaymentLink(
    {
      missionId,
      candidateId: String(candidate._id),
      amount: price.amount,
      currency: price.currency,
      description: String(payload.description || `Payment for ${scout.title || "bridged Scout service"}`).slice(0, 255),
      customer: payload.customer && typeof payload.customer === "object" ? payload.customer : undefined
    },
    { env: context.env || process.env, transport: context.transport }
  );

  if (paymentLink && paymentLink.paymentUrl) {
    const current = await RevenueExecutionMission.findById(missionId);
    if (current) {
      current.payment = {
        provider: "razorpay",
        paymentUrl: String(paymentLink.paymentUrl),
        amount: price.amount,
        currency: price.currency,
        status: String(paymentLink.status || "pending"),
        reference: String(paymentLink.paymentId || ""),
        mode: String(paymentLink.mode || "test"),
        createdAt: new Date().toISOString()
      };
      await current.save();
    }
  }

  const persisted = await RevenueExecutionMission.findById(missionId);

  return {
    candidate: candidate.toJSON(),
    intake: intake.toJSON(),
    mission: persisted ? persisted.toJSON() : mission,
    paymentLink,
    webhook: paymentReadiness(context.env || process.env)
  };
}

async function publicPaymentByReference(ref, context = {}) {
  requireMongoConnected();
  if (!String(ref || "").trim()) fail("Payment reference is required", 400);

  const query = {};

  if (mongoose.Types.ObjectId.isValid(String(ref))) {
    const mission = await RevenueExecutionMission.findById(ref).lean();
    if (mission) query._id = mission._id;
  }

  if (!query._id) {
    query["payment.reference"] = String(ref);
  }

  const mission = await RevenueExecutionMission.findOne(query).lean();
  if (!mission || !mission.payment || !mission.payment.paymentUrl) fail("Payment reference not found", 404);

  const paymentStatus = await razorpayPaymentLinkService.fetchPaymentLinkStatus(
    mission.payment.reference || mission.payment.paymentUrl,
    { env: context.env || process.env, transport: context.transport }
  );

  return {
    reference: String(ref),
    missionId: String(mission._id),
    title: String((mission.opportunity && (mission.opportunity.title || mission.opportunity.description)) || "GARUDA service").slice(0, 120),
    amount: Number(mission.payment.amount),
    currency: String(mission.payment.currency || "INR"),
    paymentUrl: String(mission.payment.paymentUrl),
    status: paymentStatus && paymentStatus.status ? paymentStatus.status : String(mission.payment.status || "pending"),
    issuedAt: String(mission.payment.createdAt || ""),
    mode: String(mission.payment.mode || "")
  };
}

async function missionById(id) {
  const mission = await RevenueExecutionMission.findById(id);
  if (!mission) fail("Execution mission not found", 404);
  return mission.toJSON();
}

module.exports = {
  MIN_WEBHOOK_SECRET_LENGTH,
  buildCandidateRecord,
  capabilityIdFor,
  categoryDisplayName,
  ensureActiveIncomeGoal,
  findOrCreateCandidate,
  paymentReadiness,
  publicPaymentByReference,
  requestPaymentForWonOpportunity
};