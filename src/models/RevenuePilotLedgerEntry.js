const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  missionId: { type: mongoose.Schema.Types.ObjectId, ref: "RevenueExecutionMission", required: true, index: true },
  actionRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "RevenueExternalActionRequest", required: true, unique: true, index: true },
  entryKey: { type: String, required: true, unique: true, index: true },
  amount: { type: Number, required: true, min: 0 }, currency: { type: String, required: true, default: "INR" },
  provider: { type: String, required: true }, reference: { type: String, required: true },
  evidenceHash: { type: String, required: true }, receiptHash: { type: String, required: true },
  previousEntryHash: { type: String, default: null }, entryHash: { type: String, required: true, unique: true },
  status: { type: String, enum: ["verified"], default: "verified" }, verifiedAt: { type: Date, required: true },
  governance: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });
schema.set("toJSON", { versionKey: false, transform: (_doc, ret) => { ret.id = String(ret._id); ret.missionId = String(ret.missionId); ret.actionRequestId = String(ret.actionRequestId); delete ret._id; return ret; } });
module.exports = { RevenuePilotLedgerEntry: mongoose.model("RevenuePilotLedgerEntry", schema) };
