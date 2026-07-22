const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: "AffiliateConversionCase", required: true, index: true },
  eventType: { type: String, required: true, index: true },
  payloadHash: { type: String, required: true },
  previousEventHash: { type: String, default: null },
  eventHash: { type: String, required: true, unique: true },
  occurredAt: { type: Date, required: true }
}, { timestamps: true });

schema.set("toJSON", { versionKey: false, transform: (_doc, ret) => { ret.id = String(ret._id); ret.caseId = String(ret.caseId); delete ret._id; return ret; } });
module.exports = { AffiliateConversionEvent: mongoose.model("AffiliateConversionEvent", schema) };
