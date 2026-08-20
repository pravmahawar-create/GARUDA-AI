// GARUDA generic Prospect model (multi-domain).
// Mirrors the shape of data/<domain>-prospects.json entries so the file-based
// lead pipeline (genericLeadGenEngine) can sync to Mongo. A unique index on
// (domain + email) makes upserts idempotent per domain namespace.

const mongoose = require("mongoose");

const prospectSchema = new mongoose.Schema(
  {
    domain: { type: String, required: true, trim: true, index: true },
    name: { type: String, trim: true, default: "" },
    firstName: { type: String, trim: true, default: "" },
    lastName: { type: String, trim: true, default: "" },
    businessName: { type: String, trim: true, default: "" },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true, default: "" },
    location: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    website: { type: String, trim: true, default: "" },
    score: { type: Number, default: 0 },
    grade: { type: String, trim: true, default: "" },
    action: { type: String, trim: true, default: "" },
    status: { type: String, trim: true, default: "scored", index: true },
    query: { type: String, trim: true, default: "" },
    signals: [{ type: String }],
    segments: [{ type: String }],
    source: { type: String, trim: true, default: "public_research" },
    notes: { type: String, trim: true, default: "" },
    locale: { type: String, trim: true, default: "" },
    country: { type: String, trim: true, default: "" },
    sourceId: { type: String, trim: true, default: "" }
  },
  { timestamps: true }
);

prospectSchema.index({ domain: 1, email: 1 }, { unique: true });
prospectSchema.index({ domain: 1, status: 1, score: -1 });

module.exports = { Prospect: mongoose.model("Prospect", prospectSchema) };