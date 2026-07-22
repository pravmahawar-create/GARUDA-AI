const mongoose = require("mongoose");

const revenueExecutionMissionSchema = new mongoose.Schema(
  {
    engine: { type: String, required: true, trim: true },
    missionKey: { type: String, required: true, unique: true, index: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "DiscoveryCandidate", required: true, unique: true, index: true },
    incomeGoalId: { type: mongoose.Schema.Types.ObjectId, ref: "IncomeGoal", required: true, index: true },
    status: { type: String, enum: ["awaiting_bounded_scope", "ready_for_founder_review", "founder_approved", "changes_required", "rejected", "blocked"], default: "awaiting_bounded_scope", index: true },
    opportunity: { type: mongoose.Schema.Types.Mixed, required: true },
    realWorkIntake: { type: mongoose.Schema.Types.Mixed, required: true },
    capability: { type: mongoose.Schema.Types.Mixed, required: true },
    architecturePlan: { type: mongoose.Schema.Types.Mixed, required: true },
    boundedScope: { type: mongoose.Schema.Types.Mixed, default: null },
    workPackages: { type: [mongoose.Schema.Types.Mixed], default: [] },
    deliverableWorkspace: { type: mongoose.Schema.Types.Mixed, default: null },
    executionEvidence: { type: mongoose.Schema.Types.Mixed, default: null },
    founderDecision: { type: mongoose.Schema.Types.Mixed, default: null },
    revisionNumber: { type: Number, default: 0, min: 0, max: 3 },
    revisionHistory: { type: [mongoose.Schema.Types.Mixed], default: [] },
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
