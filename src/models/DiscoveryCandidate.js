const mongoose = require("mongoose");

const discoveryCandidateSchema = new mongoose.Schema(
  {
    missionId: { type: mongoose.Schema.Types.ObjectId, ref: "IncomeGoal", required: true, index: true },
    source: { type: String, required: true, trim: true, index: true },
    externalId: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    company: { type: String, default: "", trim: true },
    category: { type: String, default: "remote_job", trim: true },
    location: { type: String, default: "Worldwide", trim: true },
    url: { type: String, required: true, trim: true },
    sourceAttribution: { type: String, required: true, trim: true },
    publishedAt: { type: Date, default: null },
    salaryText: { type: String, default: "", trim: true },
    tags: { type: [String], default: [] },
    score: { type: Number, required: true, min: 0, max: 100, index: true },
    verification: {
      sourceVerified: { type: Boolean, default: false },
      originalLinkPresent: { type: Boolean, default: false },
      prohibitedContentClear: { type: Boolean, default: false },
      scamSignalsClear: { type: Boolean, default: false }
    },
    status: { type: String, enum: ["ranked", "rejected", "approved", "dismissed"], default: "ranked", index: true },
    requiresFounderApproval: { type: Boolean, default: true, immutable: true },
    rejectionReasons: { type: [String], default: [] },
    discoveredAt: { type: Date, default: () => new Date() }
  },
  { timestamps: true }
);

discoveryCandidateSchema.index({ missionId: 1, source: 1, externalId: 1 }, { unique: true });
discoveryCandidateSchema.set("toJSON", { versionKey: false, transform: (_doc, ret) => { ret.id = String(ret._id); ret.missionId = String(ret.missionId); delete ret._id; } });

module.exports = { DiscoveryCandidate: mongoose.model("DiscoveryCandidate", discoveryCandidateSchema) };
