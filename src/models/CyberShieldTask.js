const mongoose = require("mongoose");

const VALID_TASK_STATES = [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "RETRYING",
  "DEAD_LETTER"
];

const VALID_TASK_TYPES = [
  "INGEST_POLL",
  "PROCESS_EVENT",
  "DISPATCH_ACTION"
];

const CyberShieldTaskSchema = new mongoose.Schema(
  {
    jobId: {
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
    monitorId: {
      type: String,
      default: null,
      index: true
    },
    type: {
      type: String,
      enum: VALID_TASK_TYPES,
      default: "PROCESS_EVENT",
      index: true
    },
    status: {
      type: String,
      enum: VALID_TASK_STATES,
      default: "PENDING",
      index: true
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    attempts: {
      type: Number,
      default: 0
    },
    maxAttempts: {
      type: Number,
      default: 3
    },
    lockedAt: {
      type: Date,
      default: null
    },
    nextRunAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    lastError: {
      type: String,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

CyberShieldTaskSchema.index({ status: 1, nextRunAt: 1, lockedAt: 1 });
CyberShieldTaskSchema.index({ tenantId: 1, status: 1 });

CyberShieldTaskSchema.set("toJSON", {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret.jobId || String(ret._id);
    delete ret._id;
  }
});

const CyberShieldTask = mongoose.models.CyberShieldTask || mongoose.model("CyberShieldTask", CyberShieldTaskSchema);

module.exports = {
  CyberShieldTask,
  VALID_TASK_STATES,
  VALID_TASK_TYPES
};
