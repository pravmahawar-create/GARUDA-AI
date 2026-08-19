const mongoose = require("mongoose");

const REVENUE_STATUSES = ["pending", "received", "refunded"];
const REVENUE_MODES = ["live", "test"];

const revenueRecordSchema = new mongoose.Schema(
  {
    opportunityId: { type: mongoose.Schema.Types.ObjectId, ref: "Opportunity", index: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "DiscoveryCandidate", index: true, sparse: true },
    executionMissionId: { type: mongoose.Schema.Types.ObjectId, ref: "RevenueExecutionMission", index: true, sparse: true },
    paymentEventKey: { type: String, unique: true, sparse: true, index: true },
    providerEventId: { type: String, index: true, sparse: true },
    paymentId: { type: String, index: true, sparse: true },
    mode: { type: String, enum: REVENUE_MODES, default: "live", index: true },
    verificationEvidence: { type: mongoose.Schema.Types.Mixed, default: null },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR", uppercase: true, trim: true },
    source: { type: String, default: "direct", trim: true },
    client: { type: String, required: true, trim: true },
    status: { type: String, enum: REVENUE_STATUSES, default: "pending", index: true },
    capturedAt: { type: Date, default: null },
    recordedAt: { type: Date, default: () => new Date(), index: true },
    notes: { type: String, default: "" }
  },
  { timestamps: true }
);

revenueRecordSchema.set("toJSON", {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    if (ret.opportunityId) {
      ret.opportunityId = String(ret.opportunityId);
    }
    if (ret.executionMissionId) ret.executionMissionId = String(ret.executionMissionId);
    delete ret._id;
    return ret;
  }
});

module.exports = {
  RevenueRecord: mongoose.model("RevenueRecord", revenueRecordSchema),
  REVENUE_STATUSES,
  REVENUE_MODES
};
