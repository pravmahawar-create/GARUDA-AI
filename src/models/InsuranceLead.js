const mongoose = require("mongoose");

const LEAD_STATUSES = [
  "new",
  "message_prepared",
  "message_sent",
  "opened_replied",
  "interested",
  "appointment_booked",
  "qualified",
  "proposal_sent",
  "policy_issued",
  "not_interested",
  "opted_out",
  "failed"
];

const insuranceLeadSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true },
    firstName: { type: String, trim: true, default: "" },
    lastName: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    source: { type: String, default: "founder_contacts" },
    status: { type: String, enum: LEAD_STATUSES, default: "new" },
    pitchSubject: { type: String, default: "" },
    pitchBody: { type: String, default: "" },
    sentAt: { type: Date, default: null },
    lastAttemptAt: { type: Date, default: null },
    sentCount: { type: Number, default: 0 },
    optedOut: { type: Boolean, default: false },
    optOutAt: { type: Date, default: null },
    reason: { type: String, default: "" },
    tags: [{ type: String }],
    notes: { type: String, default: "" },
    audit: [
      {
        action: { type: String, default: "" },
        at: { type: Date, default: Date.now },
        detail: { type: String, default: "" }
      }
    ]
  },
  { timestamps: true }
);

insuranceLeadSchema.index({ email: 1 }, { unique: true });
insuranceLeadSchema.index({ status: 1 });

module.exports = { InsuranceLead: mongoose.model("InsuranceLead", insuranceLeadSchema), LEAD_STATUSES };
