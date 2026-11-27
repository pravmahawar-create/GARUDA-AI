const mongoose = require("mongoose");

const quantSessionStateSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    wallet: {
      initialCapital: { type: Number, default: 100000 },
      cash: { type: Number, default: 100000 },
      realizedPnl: { type: Number, default: 0 },
      peakCapital: { type: Number, default: 100000 }
    },
    statistics: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    openPositions: {
      type: Array,
      default: []
    },
    dailyPnl: {
      type: Number,
      default: 0
    },
    tradesToday: {
      type: Number,
      default: 0
    },
    isLockedToday: {
      type: Boolean,
      default: false
    },
    lockReason: {
      type: String,
      default: "",
      trim: true
    },
    dateStr: {
      type: String,
      default: "",
      trim: true
    },
    lastPulseDate: {
      type: String,
      default: "",
      trim: true
    },
    pulseDeliveryConfirmations: {
      type: Array,
      default: []
    }
  },
  {
    timestamps: true
  }
);

quantSessionStateSchema.set("toJSON", {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    delete ret._id;
    return ret;
  }
});

const QuantSessionState =
  mongoose.models.QuantSessionState || mongoose.model("QuantSessionState", quantSessionStateSchema);

module.exports = QuantSessionState;
