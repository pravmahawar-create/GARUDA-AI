const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  missionId: { type: mongoose.Schema.Types.ObjectId, ref: "RevenueExecutionMission", required: true, index: true },
  actionRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "RevenueExternalActionRequest", required: true, index: true },
  connectorId: { type: String, required: true, index: true },
  idempotencyKey: { type: String, required: true, unique: true, index: true },
  mode: { type: String, enum: ["dry_run", "dispatch"], required: true },
  status: { type: String, enum: ["validated", "dispatched", "failed"], required: true, index: true },
  requestHash: { type: String, required: true }, response: { type: mongoose.Schema.Types.Mixed, required: true },
  receiptHash: { type: String, required: true }, previousDispatchHash: { type: String, default: null },
  governance: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });
schema.set("toJSON", { versionKey: false, transform: (_doc, ret) => { ret.id = String(ret._id); ret.missionId = String(ret.missionId); ret.actionRequestId = String(ret.actionRequestId); delete ret._id; return ret; } });
module.exports = { RevenueConnectorDispatch: mongoose.model("RevenueConnectorDispatch", schema) };
