const mongoose = require("mongoose");

const TaskItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  taskType: { type: String, required: true },
  targetPath: { type: String, default: null },
  command: { type: String, default: null },
  content: { type: String, default: "" },
  dependencies: { type: [String], default: [] },
  status: {
    type: String,
    enum: ["PENDING", "RUNNING", "VERIFIED_SUCCESS", "VERIFIED_FAILURE", "RECOVERY", "BLOCKED", "STOPPED"],
    default: "PENDING"
  },
  worker: { type: String, default: "local_brain_worker" },
  executionResult: { type: mongoose.Schema.Types.Mixed, default: null },
  validationResult: { type: mongoose.Schema.Types.Mixed, default: null },
  recoveryResult: { type: mongoose.Schema.Types.Mixed, default: null },
  retryCount: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });

const MissionRecordSchema = new mongoose.Schema({
  missionId: { type: String, required: true, unique: true, index: true },
  goal: { type: String, required: true },
  status: {
    type: String,
    enum: ["CREATED", "PLANNING", "READY", "RUNNING", "WAITING_APPROVAL", "VERIFYING", "RECOVERING", "COMPLETED", "FAILED", "BLOCKED", "CANCELLED"],
    default: "CREATED",
    index: true
  },
  founderApproved: { type: Boolean, default: false },
  priority: { type: String, default: "P1" },
  tasks: { type: [TaskItemSchema], default: [] },
  activeStepCount: { type: Number, default: 0 },
  maxContinuationDepth: { type: Number, default: 5 },
  stopReason: { type: String, default: null },
  summary: { type: String, default: "" },
  evidence: { type: mongoose.Schema.Types.Mixed, default: {} },
  history: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    details: mongoose.Schema.Types.Mixed
  }],
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
});

MissionRecordSchema.pre("save", function() {
  this.updatedAt = new Date();
});

module.exports = mongoose.model("MissionRecord", MissionRecordSchema);
