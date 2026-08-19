const mongoose = require("mongoose");

const RECONCILIATION_STATUSES = ["unmatched", "matched", "duplicate", "partial", "disputed", "refunded"];

const paymentReconciliationItemSchema = new mongoose.Schema(
  {
    providerEventId: { type: String, unique: true, sparse: true, index: true },
    providerPaymentId: { type: String, index: true },
    eventType: { type: String, default: "", trim: true },
    amount: { type: Number, min: 0, default: 0 },
    currency: { type: String, default: "INR", uppercase: true, trim: true },
    referenceId: { type: String, default: "", trim: true },
    status: { type: String, enum: RECONCILIATION_STATUSES, default: "unmatched", index: true },
    reason: { type: String, default: "", trim: true },
    rawEvent: { type: mongoose.Schema.Types.Mixed, default: null },
    matchedRevenueRecordId: { type: mongoose.Schema.Types.ObjectId, ref: "RevenueRecord", default: null },
    resolution: { type: String, default: "", trim: true },
    resolvedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

paymentReconciliationItemSchema.set("toJSON", {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    if (ret.matchedRevenueRecordId) ret.matchedRevenueRecordId = String(ret.matchedRevenueRecordId);
    delete ret._id;
    return ret;
  }
});

module.exports = {
  PaymentReconciliationItem: mongoose.model("PaymentReconciliationItem", paymentReconciliationItemSchema),
  RECONCILIATION_STATUSES
};
