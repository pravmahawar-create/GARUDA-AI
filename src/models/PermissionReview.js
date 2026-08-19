const mongoose = require("mongoose");

const REVIEW_DECISIONS = [
  "PERMISSION_CONFIRMED",
  "PERMISSION_PROHIBITED",
  "DISMISS",
  "NEEDS_INFORMATION"
];

const EVIDENCE_TYPES = [
  "CLIENT_EMPLOYER_EXPLICIT_PERMISSION",
  "PLATFORM_JOB_RULE_CHECK",
  "CONTRACT_ENGAGEMENT_TERMS",
  "FOUNDER_ATTESTATION",
  "UNKNOWN"
];

const FOUNDER_ATTESTATION_REQUIRED =
  "I confirm that I have sufficient basis to pursue this opportunity through the founder-engaged GARUDA-assisted model and that I am not overriding any known client, employer, platform, contractual, identity, credential, confidentiality, or AI-use restriction.";

const stateSnapshot = {
  earningMode: { type: String, default: "", trim: true },
  contractPermission: { type: String, default: "", trim: true },
  opportunityChannel: { type: String, default: "", trim: true },
  status: { type: String, default: "", trim: true }
};

// Append-only audit record for every Founder permission-review decision.
// Each document captures one decision plus the permission evidence that
// justified it. Reviews never execute an external action; they only record
// Founder judgment and (for resolved outcomes) mutate the single candidate
// through the governed state machine.
const permissionReviewSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DiscoveryCandidate",
      required: true,
      index: true
    },
    externalId: { type: String, default: "", trim: true },
    title: { type: String, default: "", trim: true },
    company: { type: String, default: "", trim: true },
    source: { type: String, default: "", trim: true },
    url: { type: String, default: "", trim: true },
    decision: {
      type: String,
      enum: REVIEW_DECISIONS,
      required: true,
      index: true
    },
    evidenceType: {
      type: String,
      enum: EVIDENCE_TYPES,
      default: "UNKNOWN"
    },
    evidenceSource: { type: String, default: "", trim: true },
    evidenceSummary: { type: String, default: "", trim: true },
    founderAttestation: { type: String, default: "", trim: true },
    note: { type: String, default: "", trim: true },
    reviewer: { type: String, default: "founder", trim: true },
    previousState: stateSnapshot,
    newState: stateSnapshot,
    decidedAt: { type: Date, default: () => new Date(), index: true }
  },
  { timestamps: true }
);

permissionReviewSchema.index({ candidateId: 1, decidedAt: -1 });
permissionReviewSchema.set("toJSON", {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    ret.candidateId = String(ret.candidateId);
    delete ret._id;
  }
});

module.exports = {
  PermissionReview: mongoose.model("PermissionReview", permissionReviewSchema),
  REVIEW_DECISIONS,
  EVIDENCE_TYPES,
  FOUNDER_ATTESTATION_REQUIRED
};