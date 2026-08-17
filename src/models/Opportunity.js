const mongoose = require("mongoose");

const OPP_STAGES = [
  "prospect",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost"
];

const opportunitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    client: { type: String, required: true, trim: true },
    source: { type: String, default: "direct", trim: true },
    stage: { type: String, enum: OPP_STAGES, default: "prospect", index: true },
    potentialValue: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR", uppercase: true, trim: true },
    probability: { type: Number, min: 0, max: 100, default: 25 },
    expectedCloseDate: { type: Date, default: null },
    notes: { type: String, default: "" },
    tags: { type: [String], default: [] },
    priority: {
      type: String,
      enum: ["LOW_VALUE", "LOW", "NORMAL", "HIGH", "VERY_HIGH", "STRATEGIC", "UNMEASURED"],
      default: "UNMEASURED",
      index: true
    },
    valueModel: {
      status: {
        type: String,
        enum: ["UNKNOWN", "ESTIMATED", "APPROVED_DEAL", "RECEIVED"],
        default: "UNKNOWN"
      },
      rawValue: { type: String, default: "", trim: true },
      estimatedINR: { type: Number, default: null },
      valueType: { type: String, default: "estimated_project_value", trim: true },
      payUnit: { type: String, default: "unknown", trim: true },
      confidence: { type: Number, default: 0, min: 0, max: 100 },
      source: { type: String, default: "source_evidence_missing", trim: true },
      note: { type: String, default: "", trim: true },
      bandPriority: { type: String, default: "UNMEASURED", trim: true },
      bandLabel: { type: String, default: "UNMEASURED", trim: true },
      rank: { type: Number, default: 0, min: 0, max: 100 },
      factors: {
        type: [{ id: String, label: String, score: Number, evidence: String }],
        default: []
      },
      rankedAt: { type: Date, default: null }
    },
    outreach: {
      followUpCount: { type: Number, default: 0, min: 0 },
      lastFollowUpAt: { type: Date, default: null },
      firstOutreachAt: { type: Date, default: null },
      lastReplyAt: { type: Date, default: null },
      replyIntent: { type: String, default: "", trim: true },
      archived: { type: Boolean, default: false },
      archivedAt: { type: Date, default: null },
      archiveReason: { type: String, default: "", trim: true }
    },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "DiscoveryCandidate", default: null },
    origin: {
      type: String,
      enum: ["discovery", "founder_assisted", "insurance_lead", "manual"],
      default: "manual"
    }
  },
  { timestamps: true }
);

opportunitySchema.set("toJSON", {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    delete ret._id;
    return ret;
  }
});

module.exports = {
  Opportunity: mongoose.model("Opportunity", opportunitySchema),
  OPP_STAGES
};
