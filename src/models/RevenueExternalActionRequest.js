const mongoose = require("mongoose");

const ACTION_TYPES = ["outreach", "application", "contract", "delivery", "deployment", "payment_verification"];
const ACTION_STATUSES = ["pending_founder", "changes_required", "rejected", "handoff_ready", "externally_completed"];

const schema = new mongoose.Schema({
  missionId: { type: mongoose.Schema.Types.ObjectId, ref: "RevenueExecutionMission", required: true, index: true },
  requestKey: { type: String, required: true, unique: true, index: true },
  actionType: { type: String, enum: ACTION_TYPES, required: true, index: true },
  status: { type: String, enum: ACTION_STATUSES, default: "pending_founder", index: true },
  summary: { type: String, required: true, trim: true },
  destination: { type: String, default: "", trim: true },
  deliverables: { type: [mongoose.Schema.Types.Mixed], default: [] },
  evidenceHash: { type: String, required: true },
  handoffPackage: { type: mongoose.Schema.Types.Mixed, default: null },
  completionReceipt: { type: mongoose.Schema.Types.Mixed, default: null },
  latestDecisionHash: { type: String, default: null },
  governance: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });

schema.set("toJSON", { versionKey: false, transform: (_doc, ret) => { ret.id = String(ret._id); ret.missionId = String(ret.missionId); delete ret._id; return ret; } });
module.exports = { RevenueExternalActionRequest: mongoose.model("RevenueExternalActionRequest", schema), ACTION_TYPES, ACTION_STATUSES };
