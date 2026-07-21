const mongoose = require("mongoose");

const INCOME_GOAL_STATUSES = ["draft", "active", "paused", "completed", "cancelled"];

const milestoneSchema = new mongoose.Schema(
  {
    sequence: { type: Number, required: true, min: 1 },
    label: { type: String, required: true, trim: true },
    targetAmount: { type: Number, required: true, min: 0 },
    achievedAmount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["pending", "in_progress", "completed"], default: "pending" }
  },
  { _id: false }
);

const auditEntrySchema = new mongoose.Schema(
  {
    action: { type: String, required: true, trim: true },
    actor: { type: String, default: "founder", trim: true },
    note: { type: String, default: "", trim: true },
    at: { type: Date, default: () => new Date() }
  },
  { _id: false }
);

const incomeGoalSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    targetAmount: { type: Number, required: true, min: 1 },
    achievedAmount: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "INR", uppercase: true, trim: true },
    status: { type: String, enum: INCOME_GOAL_STATUSES, default: "active", index: true },
    deadline: { type: Date, default: null },
    constraints: {
      lawfulOnly: { type: Boolean, default: true, immutable: true },
      verifiedOpportunitiesOnly: { type: Boolean, default: true },
      founderApprovalForExecution: { type: Boolean, default: true, immutable: true },
      noIncomeGuarantee: { type: Boolean, default: true, immutable: true }
    },
    missionPolicy: {
      targetIsMinimum: { type: Boolean, default: true, immutable: true },
      stopAtTarget: { type: Boolean, default: false, immutable: true },
      continuousDiscovery: { type: Boolean, default: true, immutable: true },
      pursueUpsideOpportunities: { type: Boolean, default: true },
      idleOnOpportunityGap: { type: Boolean, default: false, immutable: true },
      controlRoom: { type: String, enum: ["mobile_first"], default: "mobile_first", immutable: true }
    },
    discovery: {
      status: { type: String, enum: ["waiting", "running", "healthy", "degraded"], default: "waiting" },
      lastCycleAt: { type: Date, default: null },
      nextCycleAt: { type: Date, default: null },
      lastCandidateCount: { type: Number, default: 0, min: 0 },
      totalCandidateCount: { type: Number, default: 0, min: 0 },
      lastError: { type: String, default: "", trim: true }
    },
    milestones: { type: [milestoneSchema], default: [] },
    auditTrail: { type: [auditEntrySchema], default: [] }
  },
  { timestamps: true }
);

incomeGoalSchema.set("toJSON", {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    delete ret._id;
    return ret;
  }
});

module.exports = {
  IncomeGoal: mongoose.model("IncomeGoal", incomeGoalSchema),
  INCOME_GOAL_STATUSES
};
