const mongoose = require("mongoose");

const INTAKE_STATUSES = ["handoff_ready", "work_confirmed", "mission_created"];

const schema = new mongoose.Schema(
  {
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "DiscoveryCandidate", required: true, unique: true, index: true },
    incomeGoalId: { type: mongoose.Schema.Types.ObjectId, ref: "IncomeGoal", required: true, index: true },
    status: { type: String, enum: INTAKE_STATUSES, required: true, index: true },
    listing: { type: mongoose.Schema.Types.Mixed, required: true },
    engagement: { type: mongoose.Schema.Types.Mixed, default: null },
    brief: { type: mongoose.Schema.Types.Mixed, default: null },
    handoff: { type: mongoose.Schema.Types.Mixed, default: null },
    executionMissionId: { type: mongoose.Schema.Types.ObjectId, ref: "RevenueExecutionMission", default: null, index: true },
    truthHash: { type: String, required: true, trim: true, index: true },
    lastAuditHash: { type: String, default: null, trim: true },
    governance: { type: mongoose.Schema.Types.Mixed, required: true }
  },
  { timestamps: true }
);

schema.set("toJSON", {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    ret.candidateId = String(ret.candidateId);
    ret.incomeGoalId = String(ret.incomeGoalId);
    if (ret.executionMissionId) ret.executionMissionId = String(ret.executionMissionId);
    delete ret._id;
    return ret;
  }
});

module.exports = {
  RevenueWorkIntake: mongoose.model("RevenueWorkIntake", schema),
  INTAKE_STATUSES
};
