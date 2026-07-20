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
    tags: { type: [String], default: [] }
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
