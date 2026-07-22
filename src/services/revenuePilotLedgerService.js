const crypto = require("crypto");
function hash(value) { return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
function fail(message, statusCode = 400) { throw Object.assign(new Error(message), { statusCode }); }
function text(value, name, max = 200) { const result = String(value || "").trim(); if (!result) fail(`${name} is required`); if (result.length > max) fail(`${name} exceeds ${max} characters`); return result; }
function amount(value) { const result = Number(value); if (!Number.isFinite(result) || result <= 0 || result > 1000000000) fail("amount must be greater than zero and within the supported range"); return Math.round(result * 100) / 100; }
function buildLedgerEntry(requestInput, input = {}, previousEntryHash = null, now = new Date()) {
  const request = requestInput?.toObject ? requestInput.toObject() : requestInput || {};
  if (request.actionType !== "payment_verification" || request.status !== "externally_completed") fail("A completed payment-verification action is required", 409);
  if (!request.completionReceipt?.paymentVerified || !request.completionReceipt?.receiptHash) fail("Founder-verified payment receipt is required", 409);
  const record = { missionId: String(request.missionId), actionRequestId: String(request._id || request.id), amount: amount(input.amount), currency: text(input.currency || "INR", "currency", 3).toUpperCase(), provider: text(request.completionReceipt.provider, "provider"), reference: text(request.completionReceipt.reference, "reference", 500), evidenceHash: request.evidenceHash, receiptHash: request.completionReceipt.receiptHash, previousEntryHash: previousEntryHash || null, verifiedAt: new Date(now).toISOString(), governance: { founderVerifiedReceiptRequired: true, revenueClaimAllowed: true, payoutNotImplied: true, immutableAudit: true } };
  const entryKey = hash({ actionRequestId: record.actionRequestId, receiptHash: record.receiptHash });
  return { ...record, entryKey, entryHash: hash({ ...record, entryKey }) };
}
async function recordVerifiedEarning(requestId, input = {}, context = {}) {
  const { founderApprovalGranted } = require("./revenueConversionService");
  const { RevenueExternalActionRequest } = require("../models/RevenueExternalActionRequest");
  const { RevenuePilotLedgerEntry } = require("../models/RevenuePilotLedgerEntry");
  if (!founderApprovalGranted(context.founderApproved)) fail("Founder approval is required to record verified earning", 403);
  const request = await RevenueExternalActionRequest.findById(requestId); if (!request) fail("Action request not found", 404);
  const existing = await RevenuePilotLedgerEntry.findOne({ actionRequestId: request._id }); if (existing) return existing.toJSON();
  const previous = await RevenuePilotLedgerEntry.findOne({}).sort({ verifiedAt: -1 });
  return (await RevenuePilotLedgerEntry.create(buildLedgerEntry(request, input, previous?.entryHash))).toJSON();
}
async function listLedger(missionId) { const { RevenuePilotLedgerEntry } = require("../models/RevenuePilotLedgerEntry"); const query = missionId ? { missionId } : {}; return (await RevenuePilotLedgerEntry.find(query).sort({ verifiedAt: -1 })).map((item) => item.toJSON()); }
function deploymentReadiness(env = process.env) { const nodeEnv = String(env.NODE_ENV || "development"); const publicUrl = String(env.GARUDA_PUBLIC_URL || ""); let publicUrlValid = false; try { publicUrlValid = new URL(publicUrl).protocol === "https:"; } catch (_) {} const checks = { productionMode: nodeEnv === "production", publicHttpsUrl: publicUrlValid, databaseConfigured: Boolean(env.MONGODB_URI), connectorExplicitlyConfigured: env.GARUDA_WEBHOOK_ENABLED === "true" }; return { ready: Object.values(checks).every(Boolean), checks, externalDispatchDefaultOff: env.GARUDA_WEBHOOK_ENABLED !== "true", truth: Object.values(checks).every(Boolean) ? "Deployment configuration is complete; external actions still require Founder approval." : "Deployment is not production-ready until every configuration check passes." }; }
module.exports = { buildLedgerEntry, deploymentReadiness, listLedger, recordVerifiedEarning };
