const crypto = require("crypto");
const mongoose = require("mongoose");

const { RevenueRecord } = require("../models/RevenueRecord");
const { SettlementLedger, SETTLEMENT_STATUSES } = require("../models/SettlementLedger");
const { RevenueWorkIntake } = require("../models/RevenueWorkIntake");
const { RevenueExecutionMission } = require("../models/RevenueExecutionMission");
const deliveryUnlockService = require("./deliveryUnlockService");
const settlementFeeConfigService = require("./settlementFeeConfigService");

function fail(message, statusCode = 400) {
  throw Object.assign(new Error(message), { statusCode });
}

function hash(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function getProviderFeeRate(provider) {
  return settlementFeeConfigService.getProviderFeeRate(provider, process.env);
}

function calculateSettlementAmounts(grossAmount, feeRatePercent) {
  const gross = Number(grossAmount);
  const rate = Number(feeRatePercent);
  if (!Number.isFinite(gross) || gross < 0) fail("grossAmount must be non-negative", 400);
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) fail("feeRatePercent must be between 0 and 100", 400);
  const feeAmount = Math.round((gross * rate / 100) * 100) / 100;
  return {
    grossAmount: Math.round(gross * 100) / 100,
    feeRatePercent: rate,
    feeAmount,
    netAmount: Math.round((gross - feeAmount) * 100) / 100
  };
}

function parseReferenceId(referenceId) {
  if (!referenceId || typeof referenceId !== "string") return { missionId: null, candidateId: null };
  const parts = referenceId.split(":");
  if (parts.length >= 2) {
    return { missionId: parts[0], candidateId: parts[1] };
  }
  return { missionId: null, candidateId: null };
}

async function verifyRazorpaySignature(rawBody, signature, secret) {
  if (!secret || String(secret).length < 12) fail("Razorpay webhook secret is not configured", 503);
  if (typeof rawBody !== "string" || !rawBody) fail("rawBody is required for signature verification", 400);
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const provided = String(signature || "");
  const valid = provided.length === expected.length && crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  if (!valid) fail("Invalid Razorpay webhook signature", 401);
  return true;
}

function extractPaymentDetails(event) {
  const type = String(event.event || "");
  const payload = event.payload || {};
  const payment = payload.payment || payload.payment_link || {};
  const paymentEntity = payment.entity || payment;
  
  const paymentId = String(paymentEntity.id || "");
  const amount = Number(paymentEntity.amount || 0);
  const currency = String(paymentEntity.currency || "INR").toUpperCase();
  const referenceId = String(paymentEntity.notes?.missionId && paymentEntity.notes?.candidateId 
    ? `${paymentEntity.notes.missionId}:${paymentEntity.notes.candidateId}`
    : (paymentEntity.reference_id || paymentEntity.notes?.reference_id || ""));
  const status = String(paymentEntity.status || "");
  const capturedAt = paymentEntity.captured_at ? new Date(paymentEntity.captured_at * 1000).toISOString() : new Date().toISOString();
  
  const paymentCaptured = type === "payment.captured" || type === "payment_link.paid";
  
  return {
    provider: "razorpay",
    eventType: type,
    paymentId,
    amount,
    currency,
    referenceId,
    status,
    capturedAt,
    paymentCaptured,
    rawEvent: event
  };
}

async function createRevenueRecordFromPayment(details) {
  const { missionId, candidateId } = parseReferenceId(details.referenceId);
  const paymentEventKey = hash({ provider: details.provider, paymentId: details.paymentId, amount: details.amount });
  
  const existing = await RevenueRecord.findOne({ paymentEventKey });
  if (existing) {
    return { record: existing.toJSON(), created: false, duplicate: true };
  }
  
  let clientName = "Unknown Client";
  if (candidateId && mongoose.Types.ObjectId.isValid(candidateId)) {
    const { DiscoveryCandidate } = require("../models/DiscoveryCandidate");
    const candidate = await DiscoveryCandidate.findById(candidateId).lean();
    if (candidate) clientName = candidate.company || candidate.title || "Unknown Client";
  }
  
  const record = await RevenueRecord.create({
    opportunityId: candidateId || null,
    executionMissionId: missionId || null,
    paymentEventKey,
    verificationEvidence: {
      provider: details.provider,
      eventType: details.eventType,
      paymentId: details.paymentId,
      referenceId: details.referenceId,
      rawEvent: details.rawEvent,
      verifiedAt: new Date().toISOString()
    },
    amount: details.amount / 100,
    currency: details.currency,
    source: "razorpay_webhook",
    client: clientName,
    status: "received",
    recordedAt: new Date(),
    notes: `Payment captured via ${details.provider} webhook (${details.eventType})`
  });
  
  return { record: record.toJSON(), created: true, duplicate: false };
}

async function createSettlementFromRevenueRecord(revenueRecord, provider) {
  const existing = await SettlementLedger.findOne({ revenueRecordId: revenueRecord.id });
  if (existing) {
    return { ledger: existing.toJSON(), created: false };
  }
  
  const feeRatePercent = getProviderFeeRate(provider);
  const amounts = calculateSettlementAmounts(revenueRecord.amount, feeRatePercent);
  
  const ledger = await SettlementLedger.create({
    revenueRecordId: revenueRecord.id,
    grossAmount: amounts.grossAmount,
    feeAmount: amounts.feeAmount,
    netAmount: amounts.netAmount,
    feeRatePercent: amounts.feeRatePercent,
    currency: revenueRecord.currency,
    status: "eligible",
    payoutEligible: true,
    eligibilityReasons: [],
    provider,
    auditTrail: [{
      action: "settlement_created",
      toStatus: "eligible",
      actor: "system",
      note: `Auto-created from ${provider} webhook payment verification`
    }]
  });
  
  return { ledger: ledger.toJSON(), created: true };
}

async function triggerDeliveryUnlock(missionId, paymentDetails) {
  if (!missionId || !mongoose.Types.ObjectId.isValid(missionId)) {
    return { unlocked: false, reason: "Invalid or missing missionId" };
  }
  
  try {
    const result = await deliveryUnlockService.unlockDeliveryForMission(missionId, {
      paymentId: paymentDetails.paymentId,
      amount: paymentDetails.amount,
      currency: paymentDetails.currency,
      verifiedAt: paymentDetails.capturedAt,
      provider: paymentDetails.provider
    });
    return { unlocked: true, ...result };
  } catch (error) {
    return { unlocked: false, reason: error.message };
  }
}

async function processRazorpayWebhook(rawBody, headers) {
  const signature = headers["x-razorpay-signature"] || headers["X-Razorpay-Signature"] || "";
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET_LIVE || process.env.RAZORPAY_WEBHOOK_SECRET_TEST || "";
  
  await verifyRazorpaySignature(rawBody, signature, secret);
  
  const event = JSON.parse(rawBody);
  const details = extractPaymentDetails(event);
  
  if (!details.paymentCaptured) {
    return { success: true, ignored: true, reason: `Event ${details.eventType} does not indicate payment capture` };
  }
  
  const revenueResult = await createRevenueRecordFromPayment(details);
  const settlementResult = await createSettlementFromRevenueRecord(revenueResult.record, details.provider);
  
  let unlockResult = { unlocked: false, reason: "No missionId in referenceId" };
  const { missionId } = parseReferenceId(details.referenceId);
  if (missionId) {
    unlockResult = await triggerDeliveryUnlock(missionId, details);
  }
  
  return {
    success: true,
    revenueRecord: revenueResult.record,
    revenueRecordCreated: revenueResult.created,
    settlement: settlementResult.ledger,
    settlementCreated: settlementResult.created,
    deliveryUnlock: unlockResult,
    paymentDetails: {
      paymentId: details.paymentId,
      amount: details.amount,
      currency: details.currency,
      referenceId: details.referenceId
    }
  };
}

module.exports = {
  verifyRazorpaySignature,
  extractPaymentDetails,
  createRevenueRecordFromPayment,
  createSettlementFromRevenueRecord,
  triggerDeliveryUnlock,
  processRazorpayWebhook,
  parseReferenceId,
  getProviderFeeRate,
  calculateSettlementAmounts
};