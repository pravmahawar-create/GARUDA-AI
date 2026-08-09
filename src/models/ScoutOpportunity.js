const mongoose = require("mongoose");

const SCOUT_STATUSES = [
  "found",
  "scored",
  "drafted",
  "approved",
  "submitted",
  "interview",
  "won",
  "lost",
  "dismissed",
  "paid"
];

const scoutOpportunitySchema = new mongoose.Schema(
  {
    platform: { type: String, default: "manual", index: true },
    title: { type: String, default: "", trim: true },
    client: { type: String, default: "", trim: true },
    url: { type: String, default: "", trim: true },
    budgetText: { type: String, default: "", trim: true },
    budget: { type: Number, default: null },
    currency: { type: String, default: "USD", trim: true },
    deadlineText: { type: String, default: "", trim: true },
    categoryId: { type: String, default: "", trim: true, index: true },
    notes: { type: String, default: "", trim: true },
    source: { type: String, default: "manual", trim: true },
    score: { type: Number, default: 0 },
    scoreFactors: { type: mongoose.Schema.Types.Mixed, default: null },
    verdict: { type: String, default: "LOW", trim: true },
    status: { type: String, enum: SCOUT_STATUSES, default: "found", index: true },
    proposalText: { type: String, default: "", trim: true },
    submissionUrl: { type: String, default: "", trim: true },
    revenueReceived: { type: Number, default: 0 },
    history: { type: [{ status: String, at: Date }], default: [] },
    decidedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

scoutOpportunitySchema.set("toJSON", {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    delete ret._id;
    if (ret.scoreFactors && ret.scoreFactors._id) delete ret.scoreFactors._id;
  }
});

module.exports = {
  ScoutOpportunity: mongoose.model("ScoutOpportunity", scoutOpportunitySchema),
  SCOUT_STATUSES
};