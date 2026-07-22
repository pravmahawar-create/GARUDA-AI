const mongoose = require("mongoose");

const STATUSES = [
  "offer_verified",
  "campaign_drafted",
  "handoff_ready",
  "published",
  "conversion_recorded",
  "commission_verified",
  "payment_received",
  "blocked"
];

const schema = new mongoose.Schema({
  provider: { type: String, required: true, index: true },
  externalOfferId: { type: String, required: true },
  caseKey: { type: String, required: true, unique: true, index: true },
  status: { type: String, enum: STATUSES, required: true, index: true },
  offer: { type: mongoose.Schema.Types.Mixed, required: true },
  campaign: { type: mongoose.Schema.Types.Mixed, default: null },
  founderApproval: { type: mongoose.Schema.Types.Mixed, default: null },
  handoff: { type: mongoose.Schema.Types.Mixed, default: null },
  publication: { type: mongoose.Schema.Types.Mixed, default: null },
  conversion: { type: mongoose.Schema.Types.Mixed, default: null },
  commission: { type: mongoose.Schema.Types.Mixed, default: null },
  payment: { type: mongoose.Schema.Types.Mixed, default: null },
  governance: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });

schema.index({ provider: 1, externalOfferId: 1 }, { unique: true });
schema.set("toJSON", { versionKey: false, transform: (_doc, ret) => { ret.id = String(ret._id); delete ret._id; return ret; } });

module.exports = {
  AffiliateConversionCase: mongoose.model("AffiliateConversionCase", schema),
  AFFILIATE_CASE_STATUSES: STATUSES
};
