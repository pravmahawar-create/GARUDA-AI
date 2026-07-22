const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  missionId: { type: mongoose.Schema.Types.ObjectId, ref: "RevenueExecutionMission", required: true, index: true },
  actionRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "RevenueExternalActionRequest", required: true, index: true },
  actionType: { type: String, required: true }, decision: { type: String, enum: ["approved", "request_changes", "rejected"], required: true },
  notes: { type: String, default: "" }, evidenceHash: { type: String, required: true }, previousDecisionHash: { type: String, default: null },
  decisionHash: { type: String, required: true, unique: true }, actor: { type: String, default: "founder" }, decidedAt: { type: Date, required: true },
  governance: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });
schema.set("toJSON", { versionKey: false, transform: (_doc, ret) => { ret.id = String(ret._id); ret.missionId = String(ret.missionId); ret.actionRequestId = String(ret.actionRequestId); delete ret._id; return ret; } });
module.exports = { RevenueExternalActionDecision: mongoose.model("RevenueExternalActionDecision", schema) };
