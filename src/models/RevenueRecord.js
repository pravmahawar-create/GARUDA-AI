const mongoose = require("mongoose");

const REVENUE_STATUSES = ["pending", "received", "refunded"];

const revenueRecordSchema = new mongoose.Schema(
  {
    opportunityId: { type: mongoose.Schema.Types.ObjectId, ref: "Opportunity", index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR", uppercase: true, trim: true },
    source: { type: String, default: "direct", trim: true },
    client: { type: String, required: true, trim: true },
    status: { type: String, enum: REVENUE_STATUSES, default: "received", index: true },
    recordedAt: { type: Date, default: () => new Date(), index: true },
    notes: { type: String, default: "" }
  },
  { timestamps: true }
);

revenueRecordSchema.set("toJSON", {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    if (ret.opportunityId) {
      ret.opportunityId = String(ret.opportunityId);
    }
    delete ret._id;
    return ret;
  }
});

module.exports = {
  RevenueRecord: mongoose.model("RevenueRecord", revenueRecordSchema),
  REVENUE_STATUSES
};
