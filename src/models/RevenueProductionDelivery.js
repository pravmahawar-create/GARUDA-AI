const mongoose = require("mongoose");

const DELIVERY_STATUSES = [
  "quality_passed",
  "final_approved",
  "handoff_ready",
  "delivered",
  "client_accepted",
  "payment_verified"
];

const schema = new mongoose.Schema(
  {
    missionId: { type: mongoose.Schema.Types.ObjectId, ref: "RevenueExecutionMission", required: true, unique: true, index: true },
    status: { type: String, enum: DELIVERY_STATUSES, required: true, index: true },
    workIntakeTruthHash: { type: String, required: true, trim: true },
    client: { type: String, required: true, trim: true },
    contractAmount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, required: true, uppercase: true, trim: true },
    acceptanceCriteria: { type: [String], required: true },
    artifactManifest: { type: [mongoose.Schema.Types.Mixed], required: true },
    qualityReport: { type: mongoose.Schema.Types.Mixed, required: true },
    finalApproval: { type: mongoose.Schema.Types.Mixed, default: null },
    deliveryHandoff: { type: mongoose.Schema.Types.Mixed, default: null },
    deliveryReceipt: { type: mongoose.Schema.Types.Mixed, default: null },
    clientAcceptance: { type: mongoose.Schema.Types.Mixed, default: null },
    paymentReceipt: { type: mongoose.Schema.Types.Mixed, default: null },
    paymentEventKey: { type: String, unique: true, sparse: true, index: true },
    revenueRecordId: { type: mongoose.Schema.Types.ObjectId, ref: "RevenueRecord", default: null },
    settlementLedgerId: { type: mongoose.Schema.Types.ObjectId, ref: "SettlementLedger", default: null },
    lastAuditHash: { type: String, default: null },
    governance: { type: mongoose.Schema.Types.Mixed, required: true }
  },
  { timestamps: true }
);

schema.set("toJSON", {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    ret.missionId = String(ret.missionId);
    if (ret.revenueRecordId) ret.revenueRecordId = String(ret.revenueRecordId);
    if (ret.settlementLedgerId) ret.settlementLedgerId = String(ret.settlementLedgerId);
    delete ret._id;
    return ret;
  }
});

module.exports = {
  DELIVERY_STATUSES,
  RevenueProductionDelivery: mongoose.model("RevenueProductionDelivery", schema)
};
