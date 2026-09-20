const mongoose = require("mongoose");

const VALID_PLATFORMS = ["instagram", "youtube", "x_twitter", "facebook", "generic_social"];
const VALID_TARGET_TYPES = ["account", "post", "keyword", "hashtag"];
const VALID_MONITOR_STATUSES = ["CONFIGURED", "AUTHORIZED", "ACTIVE", "PAUSED", "ERROR", "UNSUPPORTED"];
const VALID_AUTH_STATUSES = ["AUTHORIZED", "PENDING_AUTH", "PUBLIC_ONLY"];

const CyberShieldMonitorSchema = new mongoose.Schema(
  {
    monitorId: {
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
    userId: {
      type: String,
      required: true,
      index: true
    },
    platform: {
      type: String,
      enum: VALID_PLATFORMS,
      default: "instagram",
      index: true
    },
    targetType: {
      type: String,
      enum: VALID_TARGET_TYPES,
      default: "account"
    },
    targetIdentifier: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: VALID_MONITOR_STATUSES,
      default: "ACTIVE",
      index: true
    },
    authorizationStatus: {
      type: String,
      enum: VALID_AUTH_STATUSES,
      default: "PUBLIC_ONLY"
    },
    pollIntervalMs: {
      type: Number,
      default: 60000 // 1 minute default polling
    },
    lastSuccessfulRun: {
      type: Date,
      default: null
    },
    lastEventAt: {
      type: Date,
      default: null
    },
    lastError: {
      type: String,
      default: null
    },
    stats: {
      totalEventsScanned: { type: Number, default: 0 },
      totalIncidentsDetected: { type: Number, default: 0 },
      totalEvidenceLocked: { type: Number, default: 0 }
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

CyberShieldMonitorSchema.index({ tenantId: 1, monitorId: 1 });
CyberShieldMonitorSchema.index({ status: 1, lastSuccessfulRun: 1 });

CyberShieldMonitorSchema.set("toJSON", {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret.monitorId || String(ret._id);
    delete ret._id;
  }
});

const CyberShieldMonitor = mongoose.models.CyberShieldMonitor || mongoose.model("CyberShieldMonitor", CyberShieldMonitorSchema);

module.exports = {
  CyberShieldMonitor,
  VALID_PLATFORMS,
  VALID_TARGET_TYPES,
  VALID_MONITOR_STATUSES,
  VALID_AUTH_STATUSES
};
