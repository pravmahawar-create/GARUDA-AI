const mongoose = require("mongoose");

const quantTradeRecordSchema = new mongoose.Schema(
  {
    tradeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    symbol: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    symbolName: {
      type: String,
      default: "",
      trim: true
    },
    assetClass: {
      type: String,
      enum: ["India", "Crypto", "Forex", "Commodity", "Index"],
      default: "Index",
      index: true
    },
    action: {
      type: String,
      required: true,
      trim: true
    },
    direction: {
      type: String,
      enum: ["BULLISH", "BEARISH"],
      required: true,
      index: true
    },
    quantity: {
      type: Number,
      required: true
    },
    entryPrice: {
      type: Number,
      required: true
    },
    exitPrice: {
      type: Number,
      default: null
    },
    stopLoss: {
      type: Number,
      default: null
    },
    target1: {
      type: Number,
      default: null
    },
    target2: {
      type: Number,
      default: null
    },
    pnlPoints: {
      type: Number,
      default: 0
    },
    netPnl: {
      type: Number,
      default: 0,
      index: true
    },
    exitReason: {
      type: String,
      default: "",
      trim: true
    },
    isWin: {
      type: Boolean,
      default: false,
      index: true
    },
    score: {
      type: Number,
      default: 0
    },
    factors: {
      type: [String],
      default: []
    },
    entryTime: {
      type: Date,
      default: Date.now,
      index: true
    },
    exitTime: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ["OPEN", "CLOSED", "CANCELLED"],
      default: "CLOSED",
      index: true
    },
    strategy: {
      type: String,
      default: "ALPHA_QUANT",
      index: true
    },
    mode: {
      type: String,
      enum: ["paper", "simulated", "live"],
      default: "paper"
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  {
    timestamps: true
  }
);

quantTradeRecordSchema.set("toJSON", {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    delete ret._id;
    return ret;
  }
});

const QuantTradeRecord =
  mongoose.models.QuantTradeRecord || mongoose.model("QuantTradeRecord", quantTradeRecordSchema);

module.exports = QuantTradeRecord;
