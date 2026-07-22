const mongoose = require("mongoose");

const revenueMissionTaskEventSchema = new mongoose.Schema(
  {
    missionId: { type: mongoose.Schema.Types.ObjectId, ref: "RevenueExecutionMission", required: true, index: true },
    taskId: { type: String, required: true, trim: true, index: true },
    fromStatus: { type: String, required: true, trim: true },
    toStatus: { type: String, required: true, trim: true },
    actor: { type: String, enum: ["founder", "garuda"], required: true },
    note: { type: String, default: "", trim: true },
    evidence: { type: [mongoose.Schema.Types.Mixed], default: [] },
    previousEventHash: { type: String, default: null },
    eventHash: { type: String, required: true, unique: true, index: true }
  },
  { timestamps: true, versionKey: false }
);

revenueMissionTaskEventSchema.set("toJSON", { transform: (_doc, ret) => { ret.id = String(ret._id); ret.missionId = String(ret.missionId); delete ret._id; } });

module.exports = { RevenueMissionTaskEvent: mongoose.model("RevenueMissionTaskEvent", revenueMissionTaskEventSchema) };
