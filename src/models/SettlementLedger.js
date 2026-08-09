const mongoose = require("mongoose");

const SETTLEMENT_STATUSES = ["pending", "eligible", "processing", "settled", "failed"];

const auditEntrySchema = new mongoose.Schema(
  {
    action: { type: String, required: true, trim: true },
    fromStatus: { type: String, default: null },
    toStatus: { type: String, default: null },
    actor: { type: String, default: "founder", trim: true },
    note: { type: String, default: "", trim: true },
    at: { type: Date, default: () => new Date() }
  },
  { _id: false }
);

const settlementLedgerSchema = new mongoose.Schema(
  {
    revenueRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RevenueRecord",
      required: true,
      unique: true,
      index: true
    },
    executionMissionId: { type: mongoose.Schema.Types.ObjectId, ref: "RevenueExecutionMission", index: true, sparse: true },
    paymentEventKey: { type: String, unique: true, sparse: true, index: true },
    verificationEvidence: { type: mongoose.Schema.Types.Mixed, default: null },
    grossAmount: { type: Number, required: true, min: 0 },
    feeAmount: { type: Number, required: true, min: 0, default: 0 },
    netAmount: { type: Number, required: true, min: 0 },
    feeRatePercent: { type: Number, required: true, min: 0, max: 100, default: 0 },
    currency: { type: String, default: "INR", uppercase: true, trim: true },
    status: { type: String, enum: SETTLEMENT_STATUSES, default: "pending", index: true },
    payoutEligible: { type: Boolean, default: false, index: true },
    eligibilityReasons: [{ type: String, trim: true }],
    payoutReference: { type: String, default: "", trim: true },
    receiptReference: { type: String, default: "", trim: true },
    settledAt: { type: Date, default: null },
    failureReason: { type: String, default: "", trim: true },
    provider: { type: String, enum: ["razorpay", "stripe", "manual"], default: "manual", index: true },
    auditTrail: { type: [auditEntrySchema], default: [] }
  },
  { timestamps: true }
);

settlementLedgerSchema.set("toJSON", {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    ret.revenueRecordId = String(ret.revenueRecordId);
    if (ret.executionMissionId) ret.executionMissionId = String(ret.executionMissionId);
    delete ret._id;
    return ret;
  }
});

module.exports = {
  SettlementLedger: mongoose.model("SettlementLedger", settlementLedgerSchema),
  SETTLEMENT_STATUSES
};
