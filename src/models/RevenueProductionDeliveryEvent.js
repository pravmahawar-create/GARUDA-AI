const mongoose = require("mongoose");

const EVENT_TYPES = [
  "quality_passed",
  "final_approved",
  "delivery_handoff_prepared",
  "delivery_recorded",
  "client_accepted",
  "payment_verified",
  "settlement_ledger_created"
];

const schema = new mongoose.Schema({
  deliveryId: { type: mongoose.Schema.Types.ObjectId, ref: "RevenueProductionDelivery", required: true, index: true },
  missionId: { type: mongoose.Schema.Types.ObjectId, ref: "RevenueExecutionMission", required: true, index: true },
  sequence: { type: Number, required: true, min: 1 },
  eventType: { type: String, enum: EVENT_TYPES, required: true, index: true },
  actor: { type: String, enum: ["garuda", "founder", "client", "payment_provider"], required: true },
  details: { type: mongoose.Schema.Types.Mixed, required: true },
  previousEventHash: { type: String, default: null },
  eventHash: { type: String, required: true, unique: true, index: true },
  occurredAt: { type: Date, required: true }
});

schema.index({ deliveryId: 1, sequence: 1 }, { unique: true });
schema.set("toJSON", {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    ret.deliveryId = String(ret.deliveryId);
    ret.missionId = String(ret.missionId);
    delete ret._id;
    return ret;
  }
});

module.exports = {
  EVENT_TYPES,
  RevenueProductionDeliveryEvent: mongoose.model("RevenueProductionDeliveryEvent", schema)
};
