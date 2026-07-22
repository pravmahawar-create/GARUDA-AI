const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  missionId: { type: mongoose.Schema.Types.ObjectId, ref: "RevenueExecutionMission", required: true, index: true },
  taskId: { type: String, required: true, index: true },
  status: { type: String, enum: ["completed", "blocked"], required: true, index: true },
  attempts: { type: Number, required: true, min: 1, max: 3 },
  evidence: { type: [mongoose.Schema.Types.Mixed], default: [] },
  errors: { type: [String], default: [] },
  eventHashes: { type: [String], default: [] },
  previousRunHash: { type: String, default: null },
  runHash: { type: String, required: true, unique: true, index: true },
  governance: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true, versionKey: false });

schema.set("toJSON", { transform: (_doc, ret) => { ret.id = String(ret._id); ret.missionId = String(ret.missionId); delete ret._id; } });
module.exports = { RevenueAutonomousTaskRun: mongoose.model("RevenueAutonomousTaskRun", schema) };
