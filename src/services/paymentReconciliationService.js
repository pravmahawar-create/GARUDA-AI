const mongoose = require("mongoose");
const { PaymentReconciliationItem, RECONCILIATION_STATUSES } = require("../models/PaymentReconciliationItem");

function fail(message, statusCode = 400) {
  throw Object.assign(new Error(message), { statusCode });
}

async function createReconciliationItem(details, reason, rawEvent) {
  const item = await PaymentReconciliationItem.create({
    providerEventId: String(details.providerEventId || "") || undefined,
    providerPaymentId: String(details.paymentId || "") || undefined,
    eventType: String(details.eventType || ""),
    amount: Number(details.amount || 0) / 100,
    currency: String(details.currency || "INR").toUpperCase(),
    referenceId: String(details.referenceId || ""),
    status: "unmatched",
    reason: String(reason || "payment_reference_unresolvable"),
    rawEvent: rawEvent || details.rawEvent || null
  });
  return item.toJSON();
}

async function listReconciliationItems(filters = {}) {
  const query = {};
  if (filters.status) {
    if (!RECONCILIATION_STATUSES.includes(filters.status)) fail(`status must be one of: ${RECONCILIATION_STATUSES.join(", ")}`);
    query.status = filters.status;
  }
  const items = await PaymentReconciliationItem.find(query).sort({ createdAt: -1 });
  return items.map((item) => item.toJSON());
}

async function resolveReconciliationItem(id, payload = {}, context = {}) {
  const founderApproved = String(context.founderApproved || "").toLowerCase() === "true" || context.founderApproved === true;
  if (!founderApproved) fail("Founder approval is required to resolve reconciliation items", 403);
  if (!mongoose.Types.ObjectId.isValid(String(id || ""))) fail("Invalid reconciliation item id");
  const item = await PaymentReconciliationItem.findById(id);
  if (!item) fail("Reconciliation item not found", 404);
  const nextStatus = String(payload.status || "");
  if (!RECONCILIATION_STATUSES.includes(nextStatus)) fail(`status must be one of: ${RECONCILIATION_STATUSES.join(", ")}`);
  item.status = nextStatus;
  if (payload.matchedRevenueRecordId) {
    if (!mongoose.Types.ObjectId.isValid(String(payload.matchedRevenueRecordId))) fail("Invalid matched revenue record id");
    item.matchedRevenueRecordId = payload.matchedRevenueRecordId;
  }
  if (payload.resolution !== undefined) item.resolution = String(payload.resolution).trim();
  if (payload.reason !== undefined) item.reason = String(payload.reason).trim();
  item.resolvedAt = new Date();
  await item.save();
  return item.toJSON();
}

module.exports = {
  createReconciliationItem,
  listReconciliationItems,
  resolveReconciliationItem,
  RECONCILIATION_STATUSES
};
