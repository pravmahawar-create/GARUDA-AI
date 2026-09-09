const mongoose = require("mongoose");
const { VALID_PLANS } = require("./Tenant");

const SUBSCRIPTION_STATUSES = [
  "active",
  "past_due",
  "canceled",
  "incomplete",
  "trialing"
];

const BILLING_INTERVALS = ["monthly", "yearly"];

const SubscriptionSchema = new mongoose.Schema(
  {
    subscriptionId: {
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
    plan: {
      type: String,
      enum: VALID_PLANS,
      default: "personal",
      index: true
    },
    status: {
      type: String,
      enum: SUBSCRIPTION_STATUSES,
      default: "active",
      index: true
    },
    interval: {
      type: String,
      enum: BILLING_INTERVALS,
      default: "monthly"
    },
    amount: {
      type: Number,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true
    },
    provider: {
      type: String,
      enum: ["razorpay", "stripe", "manual"],
      default: "razorpay"
    },
    providerSubscriptionId: {
      type: String,
      default: null,
      index: true
    },
    currentPeriodStart: {
      type: Date,
      default: Date.now
    },
    currentPeriodEnd: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({})
    }
  },
  {
    timestamps: true
  }
);

SubscriptionSchema.set("toJSON", {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret.subscriptionId || String(ret._id);
    delete ret._id;
  }
});

const Subscription = mongoose.models.Subscription || mongoose.model("Subscription", SubscriptionSchema);

module.exports = {
  Subscription,
  SUBSCRIPTION_STATUSES,
  BILLING_INTERVALS
};
