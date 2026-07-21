const mongoose = require("mongoose");

const revenueExecutionMissionSchema = new mongoose.Schema(
  {
    engine: { type: String, required: true, trim: true },
    missionKey: { type: String, required: true, unique: true, index: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "DiscoveryCandidate", required: true, unique: true, index: true },
    incomeGoalId: { type: mongoose.Schema.Types.ObjectId, ref: "IncomeGoal", required: true, index: true },
    status: { type: String, enum: ["awaiting_bounded_scope", "ready_for_founder_review", "blocked"], default: "awaiting_bounded_scope", index: true },
    opportunity: { type: mongoose.Schema.Types.Mixed, required: true },
    capability: { type: mongoose.Schema.Types.Mixed, required: true },
    architecturePlan: { type: mongoose.Schema.Types.Mixed, required: true },
    executionPath: { type: [String], required: true },
    governance: { type: mongoose.Schema.Types.Mixed, required: true },
    approvalEvidence: { type: mongoose.Schema.Types.Mixed, required: true },
    missionHash: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

revenueExecutionMissionSchema.set("toJSON", {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    ret.candidateId = String(ret.candidateId);
    ret.incomeGoalId = String(ret.incomeGoalId);
    delete ret._id;
  }
});

module.exports = { RevenueExecutionMission: mongoose.model("RevenueExecutionMission", revenueExecutionMissionSchema) };
