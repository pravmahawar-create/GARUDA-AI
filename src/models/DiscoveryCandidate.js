const mongoose = require("mongoose");

const OPPORTUNITY_CHANNELS = [
  "autonomous_garuda",
  "founder_garuda",
  "human_only",
  "reject",
  "garuda_deliverable",
  "human_opportunity_only",
  "no_verified_capability_match"
];

const OPPORTUNITY_CATEGORIES = [
  "full_time_job",
  "contract_role",
  "freelance_project",
  "agency_project",
  "rfp_tender",
  "grant",
  "founder_assisted",
  "other"
];

const EXECUTION_MODES = [
  "ai_only",
  "founder_assisted",
  "founder_required",
  "human_team_required"
];

const MARKET_SOURCE_TYPES = [
  "job_listings",
  "freelance_marketplaces",
  "business_problems",
  "partnerships",
  "direct_outreach"
];

const discoveryCandidateSchema = new mongoose.Schema(
  {
    missionId: { type: mongoose.Schema.Types.ObjectId, ref: "IncomeGoal", required: true, index: true },
    source: { type: String, required: true, trim: true, index: true },
    externalId: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    company: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    category: { type: String, default: "remote_job", trim: true },
    marketSourceType: {
      type: String,
      enum: MARKET_SOURCE_TYPES,
      default: "job_listings",
      index: true
    },
    outcomeDeliverability: {
      legallyExecutable: { type: Boolean, default: true },
      technicallyExecutable: { type: Boolean, default: true },
      canGarudaDeliver: { type: Boolean, default: true },
      evaluationReason: { type: String, default: "Governed technical software deliverable.", trim: true }
    },
    opportunityCategory: {
      type: String,
      enum: OPPORTUNITY_CATEGORIES,
      default: "other",
      index: true
    },
    classificationIntelligence: {
      confidenceScore: { type: Number, default: 80, min: 0, max: 100 },
      reasoning: { type: [String], default: [] },
      platformId: { type: String, default: "generic", trim: true },
      executionMode: { type: String, enum: EXECUTION_MODES, default: "founder_assisted" }
    },
    location: { type: String, default: "Worldwide", trim: true },
    url: { type: String, required: true, trim: true },
    sourceAttribution: { type: String, required: true, trim: true },
    publishedAt: { type: Date, default: null },
    salaryText: { type: String, default: "", trim: true },
    tags: { type: [String], default: [] },
    score: { type: Number, required: true, min: 0, max: 100, index: true },
    opportunityChannel: {
      type: String,
      enum: OPPORTUNITY_CHANNELS,
      default: "no_verified_capability_match",
      index: true
    },
    capabilityAssessment: {
      selfEarningEligible: { type: Boolean, default: false },
      humanIdentityRequired: { type: Boolean, default: false },
      decision: { type: String, default: "no_verified_capability_match", trim: true },
      matches: {
        type: [{ capabilityId: String, universe: String, name: String, score: Number }],
        default: []
      },
      assessedAt: { type: Date, default: null }
    },
    verification: {
      sourceVerified: { type: Boolean, default: false },
      originalLinkPresent: { type: Boolean, default: false },
      prohibitedContentClear: { type: Boolean, default: false },
      scamSignalsClear: { type: Boolean, default: false },
      listingSpecific: { type: Boolean, default: false },
      listingKind: {
        type: String,
        enum: ["specific_client_work", "human_role_listing", "talent_network_recruitment", "generic_marketplace_page", "unverified_general_listing"],
        default: "unverified_general_listing"
      },
      directClientWorkEvidence: { type: Boolean, default: false },
      humanIdentityGateClear: { type: Boolean, default: false },
      garudaExecutionEligible: { type: Boolean, default: false },
      sourceRecordHash: { type: String, default: "", trim: true },
      verifiedAt: { type: Date, default: null },
      rejectionReasons: { type: [String], default: [] }
    },
    status: { type: String, enum: ["ranked", "rejected", "approved", "dismissed"], default: "ranked", index: true },
    requiresFounderApproval: { type: Boolean, default: true, immutable: true },
    rejectionReasons: { type: [String], default: [] },
    decision: {
      actor: { type: String, default: "", trim: true },
      note: { type: String, default: "", trim: true },
      decidedAt: { type: Date, default: null }
    },
    discoveredAt: { type: Date, default: () => new Date() }
  },
  { timestamps: true }
);

discoveryCandidateSchema.index({ missionId: 1, source: 1, externalId: 1 }, { unique: true });
discoveryCandidateSchema.set("toJSON", { versionKey: false, transform: (_doc, ret) => { ret.id = String(ret._id); ret.missionId = String(ret.missionId); delete ret._id; } });

module.exports = {
  DiscoveryCandidate: mongoose.model("DiscoveryCandidate", discoveryCandidateSchema),
  OPPORTUNITY_CHANNELS,
  OPPORTUNITY_CATEGORIES,
  EXECUTION_MODES,
  MARKET_SOURCE_TYPES
};
