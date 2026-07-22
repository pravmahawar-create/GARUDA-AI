const mongoose = require("mongoose");

const ACQUISITION_STATUSES = [
  "proposal_drafted",
  "changes_requested",
  "handoff_ready",
  "submitted",
  "response_received",
  "closed_no_award",
  "mission_created"
];

const schema = new mongoose.Schema(
  {
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "DiscoveryCandidate", required: true, unique: true, index: true },
    incomeGoalId: { type: mongoose.Schema.Types.ObjectId, ref: "IncomeGoal", required: true, index: true },
    status: { type: String, enum: ACQUISITION_STATUSES, required: true, index: true },
    listing: { type: mongoose.Schema.Types.Mixed, required: true },
    capability: { type: mongoose.Schema.Types.Mixed, required: true },
    sourceRules: { type: mongoose.Schema.Types.Mixed, required: true },
    proposal: { type: mongoose.Schema.Types.Mixed, required: true },
    founderApproval: { type: mongoose.Schema.Types.Mixed, default: null },
    handoff: { type: mongoose.Schema.Types.Mixed, default: null },
    submissionReceipt: { type: mongoose.Schema.Types.Mixed, default: null },
    latestResponse: { type: mongoose.Schema.Types.Mixed, default: null },
    workIntakeId: { type: mongoose.Schema.Types.ObjectId, ref: "RevenueWorkIntake", default: null, index: true },
    executionMissionId: { type: mongoose.Schema.Types.ObjectId, ref: "RevenueExecutionMission", default: null, index: true },
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
    if (ret.workIntakeId) ret.workIntakeId = String(ret.workIntakeId);
    if (ret.executionMissionId) ret.executionMissionId = String(ret.executionMissionId);
    delete ret._id;
    return ret;
  }
});

module.exports = {
  ACQUISITION_STATUSES,
  RevenueAcquisitionCase: mongoose.model("RevenueAcquisitionCase", schema)
};
