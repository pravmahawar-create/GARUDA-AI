/**
 * GARUDA Social Revenue Lead Model
 * Persistent cloud storage for discovered, qualified, and contacted buyer leads.
 * Survives Render container restarts and laptop shutdowns.
 */

const mongoose = require('mongoose');

const socialRevenueLeadSchema = new mongoose.Schema(
  {
    leadId: { type: String, required: true, unique: true, index: true },
    platform: { type: String, required: true, index: true },
    sourceType: { type: String, default: 'post' },
    profileUrl: { type: String, default: '' },
    postUrl: { type: String, default: '' },
    name: { type: String, default: '' },
    username: { type: String, default: '' },
    company: { type: String, default: '' },
    location: { type: String, default: '' },
    category: { type: String, default: 'GENERAL_SOFTWARE', index: true },
    requirement: { type: String, default: '' },
    intentSignals: [{ type: String }],
    evidence: { type: mongoose.Schema.Types.Mixed, default: {} },
    confidence: { type: Number, default: 0 },
    qualificationScore: { type: Number, default: 0 },
    status: {
      type: String,
      enum: [
        'DISCOVERED',
        'EVIDENCE_CAPTURED',
        'NORMALIZED',
        'DEDUPLICATED',
        'QUALIFIED',
        'TRUTH_VERIFIED',
        'OUTREACH_ELIGIBLE',
        'MANUAL_ACTION_REQUIRED',
        'DISPATCHED',
        'REPLIED',
        'INTERESTED',
        'REQUIREMENTS',
        'PROPOSAL',
        'NEGOTIATION',
        'WON',
        'LOST',
        'DISQUALIFIED'
      ],
      default: 'DISCOVERED',
      index: true
    },
    outreachStatus: {
      type: String,
      enum: [
        'NONE',
        'AWAITING_APPROVAL',
        'FOUNDER_APPROVED',
        'DISPATCHING',
        'SENT',
        'FAILED',
        'ALREADY_SENT',
        'DISPATCH_UNKNOWN',
        'OPTED_OUT',
        'DO_NOT_CONTACT'
      ],
      default: 'NONE',
      index: true
    },
    responseStatus: {
      type: String,
      enum: [
        'NONE',
        'INTERESTED',
        'QUESTION',
        'PRICE_REQUEST',
        'TIMELINE',
        'REQUIREMENTS',
        'NEGOTIATION',
        'NOT_INTERESTED',
        'OPT_OUT',
        'UNKNOWN'
      ],
      default: 'NONE',
      index: true
    },
    pitch: { type: String, default: '' },
    messageHash: { type: String, default: '' },
    deliveryEvidence: { type: mongoose.Schema.Types.Mixed, default: null },
    discoveredAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
    dispatchedAt: { type: Date, default: null },
    followUpCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Indexes for fast querying & dedup
socialRevenueLeadSchema.index({ platform: 1, profileUrl: 1 });
socialRevenueLeadSchema.index({ status: 1, qualificationScore: -1 });

module.exports = mongoose.models.SocialRevenueLead || mongoose.model('SocialRevenueLead', socialRevenueLeadSchema);
