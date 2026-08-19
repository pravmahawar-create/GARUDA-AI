const mongoose = require("mongoose");
const { RevenueRecord } = require("../models/RevenueRecord");
const { SettlementLedger, SETTLEMENT_STATUSES } = require("../models/SettlementLedger");
const { founderApprovalGranted } = require("./revenueConversionService");
const settlementFeeConfigService = require("./settlementFeeConfigService");

const STATUS_TRANSITIONS = Object.freeze({
  pending: ["eligible", "failed"],
  eligible: ["processing", "failed"],
  processing: ["settled", "failed"],
  failed: ["eligible"],
  settled: []
});

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function calculateSettlementAmounts(grossAmount, feeRatePercent = 0) {
  const gross = Number(grossAmount);
  const rate = Number(feeRatePercent);
  if (!Number.isFinite(gross) || gross < 0) throw Object.assign(new Error("grossAmount must be non-negative"), { statusCode: 400 });
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) throw Object.assign(new Error("feeRatePercent must be between 0 and 100"), { statusCode: 400 });
  const feeAmount = roundMoney(gross * rate / 100);
  return { grossAmount: roundMoney(gross), feeRatePercent: rate, feeAmount, netAmount: roundMoney(gross - feeAmount) };
}

function assessPayoutEligibility(revenueRecord) {
  const reasons = [];
  if (!revenueRecord) reasons.push("revenue_record_missing");
  if (revenueRecord && revenueRecord.status !== "received") reasons.push("payment_not_received");
  if (revenueRecord && (!Number.isFinite(revenueRecord.amount) || revenueRecord.amount <= 0)) reasons.push("amount_not_positive");
  return { eligible: reasons.length === 0, reasons };
}

function requireFounderApproval(context = {}) {
  if (!founderApprovalGranted(context.founderApproved)) {
    throw Object.assign(new Error("Founder approval is required for settlement changes"), { statusCode: 403 });
  }
}

async function findRevenueRecord(id) {
  if (!mongoose.Types.ObjectId.isValid(String(id || ""))) throw Object.assign(new Error("Invalid revenue record id"), { statusCode: 400 });
  const record = await RevenueRecord.findById(id);
  if (!record) throw Object.assign(new Error("Revenue record not found"), { statusCode: 404 });
  return record;
}

async function previewSettlement(revenueRecordId, payload = {}) {
  const revenueRecord = await findRevenueRecord(revenueRecordId);
  const eligibility = assessPayoutEligibility(revenueRecord);
  const provider = String(payload.provider || revenueRecord.provider || "manual").toLowerCase().trim();
  const feeRatePercent = payload.feeRatePercent !== undefined && payload.feeRatePercent !== ""
    ? Number(payload.feeRatePercent)
    : settlementFeeConfigService.getProviderFeeRate(provider, process.env);
  return {
    revenueRecordId: String(revenueRecord._id),
    ...calculateSettlementAmounts(revenueRecord.amount, feeRatePercent),
    currency: revenueRecord.currency,
    provider,
    payoutEligible: eligibility.eligible,
    eligibilityReasons: eligibility.reasons,
    initialStatus: eligibility.eligible ? "eligible" : "pending",
    requiresFounderApproval: true,
    writeAllowed: false
  };
}

async function createSettlement(revenueRecordId, payload = {}, context = {}) {
  requireFounderApproval(context);
  const preview = await previewSettlement(revenueRecordId, payload);
  const duplicate = await SettlementLedger.findOne({ revenueRecordId });
  if (duplicate) throw Object.assign(new Error("Settlement ledger already exists for this revenue record"), { statusCode: 409 });
  const ledger = await SettlementLedger.create({
    revenueRecordId,
    grossAmount: preview.grossAmount,
    feeAmount: preview.feeAmount,
    netAmount: preview.netAmount,
    feeRatePercent: preview.feeRatePercent,
    currency: preview.currency,
    provider: preview.provider,
    status: preview.initialStatus,
    payoutEligible: preview.payoutEligible,
    eligibilityReasons: preview.eligibilityReasons,
    auditTrail: [{ action: "settlement_created", toStatus: preview.initialStatus, actor: context.actor || "founder", note: payload.note || "" }]
  });
  return ledger.toJSON();
}

async function listSettlements(filters = {}) {
  const query = {};
  if (filters.status) {
    if (!SETTLEMENT_STATUSES.includes(filters.status)) throw Object.assign(new Error(`status must be one of: ${SETTLEMENT_STATUSES.join(", ")}`), { statusCode: 400 });
    query.status = filters.status;
  }
  if (filters.payoutEligible !== undefined) query.payoutEligible = String(filters.payoutEligible) === "true";
  const ledgers = await SettlementLedger.find(query).sort({ createdAt: -1 });
  return ledgers.map((ledger) => ledger.toJSON());
}

async function updateSettlementStatus(id, payload = {}, context = {}) {
  requireFounderApproval(context);
  if (!mongoose.Types.ObjectId.isValid(String(id || ""))) throw Object.assign(new Error("Invalid settlement id"), { statusCode: 400 });
  const ledger = await SettlementLedger.findById(id);
  if (!ledger) throw Object.assign(new Error("Settlement ledger not found"), { statusCode: 404 });
  const nextStatus = payload.status;
  if (!SETTLEMENT_STATUSES.includes(nextStatus)) throw Object.assign(new Error(`status must be one of: ${SETTLEMENT_STATUSES.join(", ")}`), { statusCode: 400 });
  if (!(STATUS_TRANSITIONS[ledger.status] || []).includes(nextStatus)) throw Object.assign(new Error(`Invalid settlement transition: ${ledger.status} -> ${nextStatus}`), { statusCode: 409 });
  if (["eligible", "processing", "settled"].includes(nextStatus) && !ledger.payoutEligible) throw Object.assign(new Error("Settlement is not payout eligible"), { statusCode: 409 });
  if (nextStatus === "settled" && (!payload.payoutReference || !payload.receiptReference)) throw Object.assign(new Error("payoutReference and receiptReference are required to settle"), { statusCode: 400 });
  if (nextStatus === "failed" && !payload.failureReason) throw Object.assign(new Error("failureReason is required for failed settlement"), { statusCode: 400 });

  const previousStatus = ledger.status;
  ledger.status = nextStatus;
  if (payload.payoutReference !== undefined) ledger.payoutReference = String(payload.payoutReference).trim();
  if (payload.receiptReference !== undefined) ledger.receiptReference = String(payload.receiptReference).trim();
  if (payload.settlementReference !== undefined) ledger.settlementReference = String(payload.settlementReference).trim();
  if (payload.utr !== undefined) ledger.utr = String(payload.utr).trim();
  if (payload.taxAmount !== undefined) ledger.taxAmount = Number(payload.taxAmount) || 0;
  if (payload.settlementTimestamp !== undefined) ledger.settlementTimestamp = new Date(payload.settlementTimestamp);
  if (payload.failureReason !== undefined) ledger.failureReason = String(payload.failureReason).trim();
  if (nextStatus === "settled") ledger.settledAt = new Date();
  ledger.auditTrail.push({ action: "status_changed", fromStatus: previousStatus, toStatus: nextStatus, actor: context.actor || "founder", note: payload.note || payload.failureReason || "" });
  await ledger.save();
  return ledger.toJSON();
}

async function recordBankReconciliation(id, payload = {}, context = {}) {
  requireFounderApproval(context);
  if (!mongoose.Types.ObjectId.isValid(String(id || ""))) throw Object.assign(new Error("Invalid settlement id"), { statusCode: 400 });
  const ledger = await SettlementLedger.findById(id);
  if (!ledger) throw Object.assign(new Error("Settlement ledger not found"), { statusCode: 404 });
  if (ledger.status !== "settled") throw Object.assign(new Error("Bank reconciliation requires the settlement to be settled first"), { statusCode: 409 });
  if (!payload.utr && !payload.evidenceReference) throw Object.assign(new Error("utr or evidenceReference is required to record bank reconciliation"), { statusCode: 400 });
  if (payload.utr) ledger.utr = String(payload.utr).trim();
  ledger.bankReconciled = true;
  ledger.bankReconciliationEvidence = {
    utr: String(payload.utr || ledger.utr || ""),
    evidenceReference: String(payload.evidenceReference || ""),
    reconciledAt: new Date().toISOString(),
    note: String(payload.note || "")
  };
  ledger.auditTrail.push({ action: "bank_reconciled", fromStatus: "settled", toStatus: "settled", actor: context.actor || "founder", note: `Bank credit reconciled (UTR ${String(payload.utr || "").slice(0, 4)}…)` });
  await ledger.save();
  return ledger.toJSON();
}

module.exports = { STATUS_TRANSITIONS, assessPayoutEligibility, calculateSettlementAmounts, createSettlement, listSettlements, previewSettlement, requireFounderApproval, updateSettlementStatus, recordBankReconciliation };
