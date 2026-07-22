const crypto = require("crypto");

function fail(message, statusCode = 400) { throw Object.assign(new Error(message), { statusCode }); }
function hash(value) { return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
function object(value) { return value && typeof value.toObject === "function" ? value.toObject() : value || {}; }
function text(value, name, max = 1000, required = true) {
  const result = String(value || "").trim();
  if (required && !result) fail(`${name} is required`);
  if (result.length > max) fail(`${name} exceeds ${max} characters`);
  return result;
}
function sha(value, name) {
  const result = text(value, name, 64).toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(result)) fail(`${name} must be a SHA-256 hash`);
  return result;
}
function iso(value, name, now = new Date(), futureAllowed = false) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) fail(`${name} must be a valid date`);
  if (!futureAllowed && parsed.getTime() > new Date(now).getTime() + 5 * 60 * 1000) fail(`${name} cannot be in the future`);
  return parsed.toISOString();
}
function founderApproved(value) { return value === true || value === "true" || value === "approved"; }

function assertProductionMission(missionInput) {
  const mission = object(missionInput);
  const truthHash = String(mission.realWorkIntake?.truthHash || "");
  const verification = mission.opportunity?.engagementVerification || {};
  const brief = mission.opportunity?.brief || {};
  if (mission.status !== "founder_approved") fail("Production delivery requires a Founder-approved mission", 409);
  if (mission.truthStatus !== "verified_real_work" || !/^[a-f0-9]{64}$/.test(truthHash) || verification.truthHash !== truthHash) fail("Production delivery requires a verified real client engagement", 409);
  if (verification.verified !== true || verification.workAuthorizationConfirmed !== true || verification.termsAcceptedByClient !== true) fail("Client work authorization is incomplete", 409);
  if (!brief.price?.amount || !brief.price?.currency || !(brief.acceptanceCriteria || []).length) fail("Confirmed contract price, currency, and acceptance criteria are required", 409);
  if (mission.deliverableWorkspace?.status !== "complete") fail("Production delivery requires a complete deliverable workspace", 409);
  if (!(mission.workPackages || []).length || !(mission.workPackages || []).every((item) => item.status === "completed" && (item.evidence || []).length)) fail("Every work package must be complete with evidence", 409);
  return mission;
}

function buildArtifactManifest(missionInput) {
  const mission = assertProductionMission(missionInput);
  const manifest = [];
  for (const task of mission.workPackages || []) {
    for (const [index, item] of (task.evidence || []).entries()) {
      const kind = text(item.kind, `workPackages.${task.id}.evidence[${index}].kind`, 40);
      const artifactSha = item.sha256 ? sha(item.sha256, `workPackages.${task.id}.evidence[${index}].sha256`) : null;
      if (kind === "artifact" && !artifactSha) fail(`Artifact evidence for ${task.id} requires a SHA-256 hash`, 409);
      manifest.push({
        taskId: text(task.id, "taskId", 100),
        kind,
        label: text(item.label, "evidence.label", 200),
        reference: text(item.reference, "evidence.reference", 800),
        sha256: artifactSha
      });
    }
  }
  if (!manifest.some((item) => item.kind === "artifact" && item.sha256)) fail("At least one hashed production artifact is required", 409);
  return manifest;
}

function normalizeAutomatedTests(value) {
  if (!Array.isArray(value) || !value.length || value.length > 50) fail("At least one and at most 50 automated test results are required");
  return value.map((item, index) => {
    const exitCode = Number(item?.exitCode);
    if (!Number.isInteger(exitCode) || exitCode !== 0 || item?.passed !== true) fail(`automatedTests[${index}] must be an actual passing result`, 409);
    return {
      name: text(item.name, `automatedTests[${index}].name`, 200),
      command: text(item.command, `automatedTests[${index}].command`, 500),
      exitCode,
      passed: true,
      reference: text(item.reference, `automatedTests[${index}].reference`, 800),
      sha256: sha(item.sha256, `automatedTests[${index}].sha256`)
    };
  });
}

function normalizeCriterionChecks(criteria, value) {
  if (!Array.isArray(value) || value.length !== criteria.length) fail("Every client acceptance criterion requires one evidence-backed check");
  return criteria.map((criterion, index) => {
    const item = value[index] || {};
    if (text(item.criterion, `criterionChecks[${index}].criterion`, 1000) !== criterion) fail(`criterionChecks[${index}] does not match the confirmed client criterion`, 409);
    if (item.passed !== true) fail(`criterionChecks[${index}] must pass before final review`, 409);
    return {
      criterion,
      passed: true,
      reference: text(item.reference, `criterionChecks[${index}].reference`, 800),
      sha256: sha(item.sha256, `criterionChecks[${index}].sha256`)
    };
  });
}

function buildQualityReport(missionInput, input = {}, now = new Date()) {
  const mission = assertProductionMission(missionInput);
  if (input.attestation?.productionData !== true || input.attestation?.noPlaceholderData !== true || input.attestation?.testedFinalArtifacts !== true) fail("Final-artifact production and no-placeholder attestations are required", 409);
  const artifactManifest = buildArtifactManifest(mission);
  const acceptanceCriteria = mission.opportunity.brief.acceptanceCriteria.map((item, index) => text(item, `acceptanceCriteria[${index}]`, 1000));
  const automatedTests = normalizeAutomatedTests(input.automatedTests);
  const criterionChecks = normalizeCriterionChecks(acceptanceCriteria, input.criterionChecks);
  const payload = {
    missionId: String(mission._id || mission.id),
    missionHash: mission.missionHash,
    workIntakeTruthHash: mission.realWorkIntake.truthHash,
    artifactManifest,
    automatedTests,
    criterionChecks,
    outcome: "passed",
    testedAt: new Date(now).toISOString(),
    governance: { finalArtifactsTested: true, allAcceptanceCriteriaPassed: true, founderFinalApprovalRequired: true, externalDeliveryAuthorized: false }
  };
  return { ...payload, qualityHash: hash(payload) };
}

function buildInitialDelivery(missionInput, qualityReport) {
  const mission = assertProductionMission(missionInput);
  const brief = mission.opportunity.brief;
  const verification = mission.opportunity.engagementVerification;
  return {
    missionId: String(mission._id || mission.id),
    status: "quality_passed",
    workIntakeTruthHash: mission.realWorkIntake.truthHash,
    client: text(verification.counterparty || mission.opportunity.company, "client", 240),
    contractAmount: Math.round(Number(brief.price.amount) * 100) / 100,
    currency: text(brief.price.currency, "currency", 3).toUpperCase(),
    acceptanceCriteria: qualityReport.criterionChecks.map((item) => item.criterion),
    artifactManifest: qualityReport.artifactManifest,
    qualityReport,
    governance: {
      realClientEngagementRequired: true,
      automatedQualityPassed: true,
      finalFounderApprovalRequired: true,
      deliveryRequiresSeparateAuthorization: true,
      clientAcceptanceRequiredBeforePayment: true,
      signedPaymentReceiptRequired: true,
      automaticDeliveryAllowed: false,
      livePaymentInitiationAllowed: false
    }
  };
}

function buildFinalApproval(deliveryInput, input = {}, now = new Date()) {
  const delivery = object(deliveryInput);
  if (delivery.status !== "quality_passed" || delivery.qualityReport?.outcome !== "passed") fail("Passing quality evidence is required before final approval", 409);
  if (input.decision !== "approved") fail("Final delivery decision must be approved");
  if (input.confirmedFinalArtifacts !== true) fail("Founder must explicitly confirm the final tested artifacts", 409);
  const payload = { deliveryId: String(delivery._id || delivery.id), qualityHash: delivery.qualityReport.qualityHash, decision: "approved", notes: text(input.notes, "notes", 2000, false), actor: "founder", approvedAt: new Date(now).toISOString(), governance: { authorizesOnlyDeliveryPreparation: true, automaticExternalDelivery: false, paymentVerified: false } };
  return { ...payload, approvalHash: hash(payload) };
}

function buildDeliveryHandoff(deliveryInput, input = {}, now = new Date()) {
  const delivery = object(deliveryInput);
  if (delivery.status !== "final_approved" || !delivery.finalApproval?.approvalHash) fail("Final Founder approval is required before delivery handoff", 409);
  if (input.founderAuthorized !== true) fail("Founder must authorize this exact delivery handoff", 403);
  const channel = text(input.channel, "channel", 80).toLowerCase();
  if (!['platform_message', 'email', 'client_portal', 'repository_release', 'other_authorized_channel'].includes(channel)) fail("Unsupported delivery channel");
  const payload = {
    deliveryId: String(delivery._id || delivery.id),
    qualityHash: delivery.qualityReport.qualityHash,
    approvalHash: delivery.finalApproval.approvalHash,
    channel,
    destination: text(input.destination, "destination", 500),
    summary: text(input.summary, "summary", 1500),
    artifacts: delivery.artifactManifest,
    preparedAt: new Date(now).toISOString(),
    governance: { founderAuthorized: true, manualDeliveryRequired: true, externalDeliveryPerformed: false, automaticSubmissionAllowed: false }
  };
  return { ...payload, packageHash: hash(payload) };
}

function buildDeliveryReceipt(deliveryInput, input = {}, now = new Date()) {
  const delivery = object(deliveryInput);
  if (delivery.status !== "handoff_ready" || !delivery.deliveryHandoff?.packageHash) fail("Authorized delivery handoff is required", 409);
  if (input.deliveryActuallyPerformed !== true) fail("Actual external delivery must be explicitly confirmed", 409);
  const deliveredAt = iso(input.deliveredAt, "deliveredAt", now);
  const payload = {
    deliveryId: String(delivery._id || delivery.id),
    packageHash: delivery.deliveryHandoff.packageHash,
    channel: delivery.deliveryHandoff.channel,
    provider: text(input.provider, "provider", 160),
    reference: text(input.reference, "reference", 500),
    evidence: text(input.evidence, "evidence", 1500),
    deliveredAt,
    recordedBy: "founder",
    governance: { externalDeliveryRecorded: true, clientAcceptanceNotImplied: true, paymentNotImplied: true }
  };
  return { ...payload, receiptHash: hash(payload) };
}

function buildClientAcceptance(deliveryInput, input = {}, now = new Date()) {
  const delivery = object(deliveryInput);
  if (delivery.status !== "delivered" || !delivery.deliveryReceipt?.receiptHash) fail("Verified delivery receipt is required before client acceptance", 409);
  if (input.clientIdentityConfirmed !== true || input.allAcceptanceCriteriaConfirmed !== true) fail("Client identity and all acceptance criteria must be explicitly confirmed", 409);
  const payload = {
    deliveryId: String(delivery._id || delivery.id),
    deliveryReceiptHash: delivery.deliveryReceipt.receiptHash,
    client: delivery.client,
    reference: text(input.reference, "reference", 500),
    evidence: text(input.evidence, "evidence", 1500),
    acceptedAt: iso(input.acceptedAt, "acceptedAt", now),
    acceptanceCriteria: delivery.acceptanceCriteria,
    verifiedBy: "founder",
    governance: { clientIdentityConfirmed: true, allAcceptanceCriteriaConfirmed: true, paymentStillUnverified: true }
  };
  return { ...payload, acceptanceHash: hash(payload) };
}

function buildVerifiedPayment(deliveryInput, verificationInput, now = new Date()) {
  const delivery = object(deliveryInput);
  const verification = object(verificationInput);
  if (delivery.status !== "client_accepted" || !delivery.clientAcceptance?.acceptanceHash) fail("Verified client acceptance is required before payment verification", 409);
  if (verification.verified !== true || verification.verificationMethod !== "signed_provider_webhook") fail("A valid signed provider webhook is required", 409);
  if (String(verification.missionId) !== String(delivery.missionId)) fail("Payment receipt belongs to a different mission", 409);
  if (Number(verification.amount) !== Number(delivery.contractAmount) || String(verification.currency).toUpperCase() !== String(delivery.currency).toUpperCase()) fail("Verified payment amount and currency must match the confirmed contract", 409);
  const payload = {
    deliveryId: String(delivery._id || delivery.id),
    missionId: String(delivery.missionId),
    clientAcceptanceHash: delivery.clientAcceptance.acceptanceHash,
    eventKey: text(verification.eventKey, "eventKey", 64),
    provider: text(verification.provider, "provider", 80),
    providerReference: text(verification.providerReference, "providerReference", 300),
    amount: Number(verification.amount),
    currency: String(verification.currency).toUpperCase(),
    receivedAt: iso(verification.receivedAt, "receivedAt", now),
    payloadHash: sha(verification.payloadHash, "payloadHash"),
    signatureHash: sha(verification.signatureHash, "signatureHash"),
    verificationMethod: "signed_provider_webhook",
    verifiedAt: new Date(now).toISOString(),
    governance: { paymentReceivedVerified: true, revenueClaimAllowed: true, payoutSettlementNotImplied: true, livePaymentInitiatedByGaruda: false }
  };
  return { ...payload, paymentReceiptHash: hash(payload) };
}

function buildRevenueLedgerRecords(deliveryInput, paymentReceiptInput) {
  const delivery = object(deliveryInput);
  const paymentReceipt = object(paymentReceiptInput);
  if (!paymentReceipt.paymentReceiptHash || paymentReceipt.governance?.paymentReceivedVerified !== true) fail("Verified payment receipt is required", 409);
  return {
    revenue: {
      executionMissionId: String(delivery.missionId),
      paymentEventKey: paymentReceipt.eventKey,
      verificationEvidence: { paymentReceiptHash: paymentReceipt.paymentReceiptHash, payloadHash: paymentReceipt.payloadHash, signatureHash: paymentReceipt.signatureHash, method: paymentReceipt.verificationMethod },
      amount: paymentReceipt.amount,
      currency: paymentReceipt.currency,
      source: `verified_${paymentReceipt.provider}`,
      client: delivery.client,
      status: "received",
      recordedAt: paymentReceipt.receivedAt,
      notes: "Recorded only after signed provider receipt verification and client acceptance."
    },
    settlement: {
      executionMissionId: String(delivery.missionId),
      paymentEventKey: paymentReceipt.eventKey,
      verificationEvidence: { paymentReceiptHash: paymentReceipt.paymentReceiptHash, providerReference: paymentReceipt.providerReference },
      grossAmount: paymentReceipt.amount,
      feeAmount: 0,
      netAmount: paymentReceipt.amount,
      feeRatePercent: 0,
      currency: paymentReceipt.currency,
      status: "pending",
      payoutEligible: false,
      eligibilityReasons: ["provider_settlement_pending", "verified_fee_receipt_pending"],
      auditTrail: [{ action: "verified_payment_recorded", toStatus: "pending", actor: "payment_provider", note: "Payment received; payout settlement and provider fees are not yet verified." }]
    }
  };
}

function buildAuditEvent(input = {}, now = new Date()) {
  const payload = { deliveryId: text(input.deliveryId, "deliveryId", 100), missionId: text(input.missionId, "missionId", 100), sequence: Number(input.sequence), eventType: text(input.eventType, "eventType", 80), actor: text(input.actor, "actor", 40), details: input.details || {}, previousEventHash: input.previousEventHash || null, occurredAt: new Date(now).toISOString() };
  if (!Number.isInteger(payload.sequence) || payload.sequence < 1) fail("Audit sequence must be a positive integer");
  return { ...payload, eventHash: hash(payload) };
}

async function findMission(missionId) {
  const mongoose = require("mongoose");
  const { RevenueExecutionMission } = require("../models/RevenueExecutionMission");
  if (!mongoose.Types.ObjectId.isValid(String(missionId || ""))) fail("Invalid execution mission id");
  const mission = await RevenueExecutionMission.findById(missionId);
  if (!mission) fail("Execution mission not found", 404);
  return mission;
}

async function appendAudit(delivery, eventType, actor, details, now = new Date()) {
  const { RevenueProductionDeliveryEvent } = require("../models/RevenueProductionDeliveryEvent");
  const previous = await RevenueProductionDeliveryEvent.findOne({ deliveryId: delivery._id }).sort({ sequence: -1 });
  const event = buildAuditEvent({ deliveryId: String(delivery._id), missionId: String(delivery.missionId), sequence: previous ? previous.sequence + 1 : 1, eventType, actor, details, previousEventHash: previous?.eventHash || null }, now);
  await RevenueProductionDeliveryEvent.create(event);
  delivery.lastAuditHash = event.eventHash;
  await delivery.save();
  return event;
}

function deliverySnapshot(delivery) {
  return {
    id: String(delivery._id || delivery.id), status: delivery.status,
    qualityHash: delivery.qualityReport?.qualityHash || null,
    finalApprovalHash: delivery.finalApproval?.approvalHash || null,
    packageHash: delivery.deliveryHandoff?.packageHash || null,
    deliveryReceiptHash: delivery.deliveryReceipt?.receiptHash || null,
    clientAcceptanceHash: delivery.clientAcceptance?.acceptanceHash || null,
    paymentReceiptHash: delivery.paymentReceipt?.paymentReceiptHash || null,
    revenueRecordId: delivery.revenueRecordId ? String(delivery.revenueRecordId) : null,
    settlementLedgerId: delivery.settlementLedgerId ? String(delivery.settlementLedgerId) : null,
    lastAuditHash: delivery.lastAuditHash || null,
    automaticDeliveryAllowed: false,
    livePaymentInitiationAllowed: false
  };
}

async function syncMission(delivery) {
  const { RevenueExecutionMission } = require("../models/RevenueExecutionMission");
  await RevenueExecutionMission.updateOne({ _id: delivery.missionId }, { $set: { productionDelivery: deliverySnapshot(delivery) } });
}

async function getByMission(missionId) {
  const { RevenueProductionDelivery } = require("../models/RevenueProductionDelivery");
  const { RevenueProductionDeliveryEvent } = require("../models/RevenueProductionDeliveryEvent");
  const delivery = await RevenueProductionDelivery.findOne({ missionId });
  if (!delivery) return null;
  const auditTrail = await RevenueProductionDeliveryEvent.find({ deliveryId: delivery._id }).sort({ sequence: 1 });
  return { ...delivery.toJSON(), auditTrail: auditTrail.map((event) => event.toJSON()) };
}

async function recordQuality(missionId, input = {}, context = {}) {
  const { RevenueProductionDelivery } = require("../models/RevenueProductionDelivery");
  if (!founderApproved(context.founderApproved)) fail("Founder authorization is required to record final production QA", 403);
  const mission = await findMission(missionId);
  const qualityReport = buildQualityReport(mission, input);
  const existing = await RevenueProductionDelivery.findOne({ missionId });
  if (existing) {
    if (existing.qualityReport?.qualityHash === qualityReport.qualityHash) return getByMission(missionId);
    fail("Recorded production quality evidence is immutable; create a reviewed mission revision", 409);
  }
  const delivery = await RevenueProductionDelivery.create(buildInitialDelivery(mission, qualityReport));
  await appendAudit(delivery, "quality_passed", "garuda", { qualityHash: qualityReport.qualityHash, artifactCount: qualityReport.artifactManifest.length, automatedTestCount: qualityReport.automatedTests.length, acceptanceCheckCount: qualityReport.criterionChecks.length });
  await syncMission(delivery);
  return getByMission(missionId);
}

async function approveFinal(missionId, input = {}, context = {}) {
  const { RevenueProductionDelivery } = require("../models/RevenueProductionDelivery");
  if (!founderApproved(context.founderApproved)) fail("Founder approval is required for final delivery approval", 403);
  const delivery = await RevenueProductionDelivery.findOne({ missionId });
  if (!delivery) fail("Production quality report not found", 404);
  if (delivery.finalApproval?.approvalHash) return getByMission(missionId);
  delivery.finalApproval = buildFinalApproval(delivery, input);
  delivery.status = "final_approved";
  await delivery.save();
  await appendAudit(delivery, "final_approved", "founder", { approvalHash: delivery.finalApproval.approvalHash, qualityHash: delivery.qualityReport.qualityHash });
  await syncMission(delivery);
  return getByMission(missionId);
}

async function prepareHandoff(missionId, input = {}, context = {}) {
  const { RevenueProductionDelivery } = require("../models/RevenueProductionDelivery");
  if (!founderApproved(context.founderApproved)) fail("Founder approval is required to prepare delivery handoff", 403);
  const delivery = await RevenueProductionDelivery.findOne({ missionId });
  if (!delivery) fail("Production delivery not found", 404);
  if (delivery.deliveryHandoff?.packageHash) return getByMission(missionId);
  delivery.deliveryHandoff = buildDeliveryHandoff(delivery, input);
  delivery.status = "handoff_ready";
  await delivery.save();
  await appendAudit(delivery, "delivery_handoff_prepared", "founder", { packageHash: delivery.deliveryHandoff.packageHash, channel: delivery.deliveryHandoff.channel, destination: delivery.deliveryHandoff.destination, externalDeliveryPerformed: false });
  await syncMission(delivery);
  return getByMission(missionId);
}

async function recordDelivery(missionId, input = {}, context = {}) {
  const { RevenueProductionDelivery } = require("../models/RevenueProductionDelivery");
  if (!founderApproved(context.founderApproved)) fail("Founder approval is required to record authorized delivery", 403);
  const delivery = await RevenueProductionDelivery.findOne({ missionId });
  if (!delivery) fail("Production delivery not found", 404);
  if (delivery.deliveryReceipt?.receiptHash) return getByMission(missionId);
  delivery.deliveryReceipt = buildDeliveryReceipt(delivery, input);
  delivery.status = "delivered";
  await delivery.save();
  await appendAudit(delivery, "delivery_recorded", "founder", { receiptHash: delivery.deliveryReceipt.receiptHash, reference: delivery.deliveryReceipt.reference, clientAcceptanceNotImplied: true });
  await syncMission(delivery);
  return getByMission(missionId);
}

async function recordClientAcceptance(missionId, input = {}, context = {}) {
  const { RevenueProductionDelivery } = require("../models/RevenueProductionDelivery");
  if (!founderApproved(context.founderApproved)) fail("Founder verification is required to record client acceptance", 403);
  const delivery = await RevenueProductionDelivery.findOne({ missionId });
  if (!delivery) fail("Production delivery not found", 404);
  if (delivery.clientAcceptance?.acceptanceHash) return getByMission(missionId);
  delivery.clientAcceptance = buildClientAcceptance(delivery, input);
  delivery.status = "client_accepted";
  await delivery.save();
  await appendAudit(delivery, "client_accepted", "client", { acceptanceHash: delivery.clientAcceptance.acceptanceHash, reference: delivery.clientAcceptance.reference, paymentStillUnverified: true });
  await syncMission(delivery);
  return getByMission(missionId);
}

async function recordVerifiedPayment(missionId, verification, context = {}) {
  const { RevenueProductionDelivery } = require("../models/RevenueProductionDelivery");
  const { RevenueRecord } = require("../models/RevenueRecord");
  const { SettlementLedger } = require("../models/SettlementLedger");
  if (context.trustedSignedWebhook !== true) fail("Only a trusted signed provider webhook can record payment", 403);
  const delivery = await RevenueProductionDelivery.findOne({ missionId });
  if (!delivery) fail("Production delivery not found", 404);
  if (delivery.paymentReceipt?.paymentReceiptHash) {
    if (delivery.paymentEventKey !== verification.eventKey) fail("A different payment is already bound to this delivery", 409);
    return getByMission(missionId);
  }
  const paymentReceipt = buildVerifiedPayment(delivery, verification);
  const records = buildRevenueLedgerRecords(delivery, paymentReceipt);
  let revenue = await RevenueRecord.findOne({ paymentEventKey: paymentReceipt.eventKey });
  if (!revenue) {
    revenue = await RevenueRecord.create(records.revenue);
  }
  let settlement = await SettlementLedger.findOne({ paymentEventKey: paymentReceipt.eventKey });
  if (!settlement) {
    settlement = await SettlementLedger.create({ ...records.settlement, revenueRecordId: revenue._id });
  }
  delivery.paymentReceipt = paymentReceipt;
  delivery.paymentEventKey = paymentReceipt.eventKey;
  delivery.revenueRecordId = revenue._id;
  delivery.settlementLedgerId = settlement._id;
  delivery.status = "payment_verified";
  await delivery.save();
  await appendAudit(delivery, "payment_verified", "payment_provider", { paymentReceiptHash: paymentReceipt.paymentReceiptHash, eventKey: paymentReceipt.eventKey, amount: paymentReceipt.amount, currency: paymentReceipt.currency, revenueRecordId: String(revenue._id), payoutSettlementNotImplied: true });
  await appendAudit(delivery, "settlement_ledger_created", "garuda", { settlementLedgerId: String(settlement._id), status: settlement.status, payoutEligible: settlement.payoutEligible, reasons: settlement.eligibilityReasons });
  await syncMission(delivery);
  return getByMission(missionId);
}

module.exports = {
  appendAudit,
  approveFinal,
  assertProductionMission,
  buildArtifactManifest,
  buildAuditEvent,
  buildClientAcceptance,
  buildDeliveryHandoff,
  buildDeliveryReceipt,
  buildFinalApproval,
  buildInitialDelivery,
  buildQualityReport,
  buildRevenueLedgerRecords,
  buildVerifiedPayment,
  getByMission,
  hash,
  prepareHandoff,
  recordClientAcceptance,
  recordDelivery,
  recordQuality,
  recordVerifiedPayment
};
