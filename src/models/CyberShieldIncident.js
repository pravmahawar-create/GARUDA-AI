const mongoose = require("mongoose");

const VALID_INCIDENT_STATUSES = [
  "DETECTED",
  "EVIDENCE_PRESERVED",
  "ACTION_RECOMMENDED",
  "HUMAN_APPROVED",
  "RESOLVED",
  "ARCHIVED"
];

const VALID_MODERATION_ACTIONS = [
  "NONE",
  "AUTO_HIDDEN",
  "FLAGGED",
  "BLOCKED",
  "LEGAL_NOTICE_APPROVED"
];

const CyberShieldIncidentSchema = new mongoose.Schema(
  {
    incidentId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    tenantId: {
      type: String,
      required: true,
      index: true
    },
    monitorId: {
      type: String,
      default: "mon_default_direct",
      index: true
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    // LAYER 1: FACT (Captured & Verified Data Only)
    facts: {
      platform: { type: String, required: true },
      targetHandle: { type: String, required: true },
      perpetratorHandle: { type: String, default: "anonymous" },
      perpetratorId: { type: String, default: "UNKNOWN_ID" },
      commentId: { type: String, default: "N/A" },
      postUrl: { type: String, default: "N/A" },
      rawText: { type: String, required: true },
      platformTimestamp: { type: Date, default: Date.now },
      captureTimestamp: { type: Date, default: Date.now },
      acquisitionMethod: { type: String, default: "POLLING_DAEMON" }
    },
    // LAYER 2: INTELLIGENCE (AI & NLP Analysis)
    intelligence: {
      severityLevel: { type: Number, required: true, min: 1, max: 5 },
      tierName: { type: String, required: true },
      primaryCategory: { type: String, default: "GENERAL_TOXICITY" },
      confidence: { type: Number, default: 0.95 },
      isActionable: { type: Boolean, default: false },
      coordinationScore: { type: Number, default: 0.0 },
      coordinationPattern: { type: String, default: "ISOLATED_INCIDENT" },
      normalizedText: { type: String, default: "" }
    },
    // LAYER 3: LEGAL RELEVANCE (Statutory Options - Human Review Required)
    legalRelevance: {
      legalSectionsTriggered: [{ type: String }],
      recommendedAction: { type: String, default: "LOG_AND_MONITOR" },
      humanReviewRequired: { type: Boolean, default: true }
    },
    // Cryptographic Evidence Vault
    evidenceVault: {
      sha256Hash: { type: String, required: true, index: true },
      certificateId: { type: String, required: true },
      statutoryAct: { type: String, default: "Section 63 Bharatiya Sakshya Adhiniyam, 2023 / Sec 65B IEA" },
      capturedAtUtc: { type: String, required: true },
      systemMetadata: { type: mongoose.Schema.Types.Mixed, default: () => ({}) }
    },
    // Generated Statutory Drafts (Pending Human Approval)
    legalDrafts: {
      trollWarning: { type: String, default: null },
      grievanceNotice: { type: String, default: null },
      cyberCrimeDraft: { type: mongoose.Schema.Types.Mixed, default: null }
    },
    // Human Governance Boundary
    humanApproval: {
      required: { type: Boolean, default: true },
      status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
      approvedBy: { type: String, default: null },
      approvedAt: { type: Date, default: null },
      notes: { type: String, default: null }
    },
    moderationAction: {
      type: String,
      enum: VALID_MODERATION_ACTIONS,
      default: "NONE"
    },
    status: {
      type: String,
      enum: VALID_INCIDENT_STATUSES,
      default: "DETECTED",
      index: true
    }
  },
  {
    timestamps: true
  }
);

CyberShieldIncidentSchema.index({ tenantId: 1, "intelligence.severityLevel": -1, createdAt: -1 });
CyberShieldIncidentSchema.index({ tenantId: 1, status: 1 });

CyberShieldIncidentSchema.set("toJSON", {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret.incidentId || String(ret._id);
    delete ret._id;
  }
});

const CyberShieldIncident = mongoose.models.CyberShieldIncident || mongoose.model("CyberShieldIncident", CyberShieldIncidentSchema);

module.exports = {
  CyberShieldIncident,
  VALID_INCIDENT_STATUSES,
  VALID_MODERATION_ACTIONS
};
