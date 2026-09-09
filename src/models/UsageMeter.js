const mongoose = require("mongoose");

const UsageMeterSchema = new mongoose.Schema(
  {
    meterId: {
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
    periodMonth: {
      type: String,
      required: true,
      index: true // e.g. "2026-09"
    },
    tokenUsage: {
      inputTokens: { type: Number, default: 0, min: 0 },
      outputTokens: { type: Number, default: 0, min: 0 },
      totalTokens: { type: Number, default: 0, min: 0 }
    },
    generationUsage: {
      images: { type: Number, default: 0, min: 0 },
      videos: { type: Number, default: 0, min: 0 },
      audioMinutes: { type: Number, default: 0, min: 0 }
    },
    apiHits: {
      type: Number,
      default: 0,
      min: 0
    },
    activeProjectsCount: {
      type: Number,
      default: 0,
      min: 0
    },
    limits: {
      maxTokensPerMonth: { type: Number, default: 1000000 },
      maxGenerationsPerMonth: { type: Number, default: 100 },
      maxProjects: { type: Number, default: 10 }
    },
    lastIncrementAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

UsageMeterSchema.index({ tenantId: 1, periodMonth: 1 }, { unique: true });

UsageMeterSchema.set("toJSON", {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret.meterId || String(ret._id);
    delete ret._id;
  }
});

const UsageMeter = mongoose.models.UsageMeter || mongoose.model("UsageMeter", UsageMeterSchema);

module.exports = {
  UsageMeter
};
