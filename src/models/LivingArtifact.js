const mongoose = require("mongoose");

const LivingArtifactSchema = new mongoose.Schema({
  artifactId: { type: String, required: true, unique: true, index: true },
  artifactType: { type: String, required: true, index: true },
  purpose: { type: String, required: true },
  projectId: { type: String, default: null, index: true },
  sessionId: { type: String, default: null, index: true },
  conversationId: { type: String, default: null, index: true },
  continuityScopeId: { type: String, default: null, index: true },
  sourceArtifactId: { type: String, default: null, index: true },
  rootArtifactId: { type: String, default: null, index: true },
  continuationInstruction: { type: String, default: null },
  sourceGoal: { type: mongoose.Schema.Types.Mixed, default: null },
  sourceBrief: { type: mongoose.Schema.Types.Mixed, default: null },
  narrative: { type: String, default: null },
  keyClaims: { type: mongoose.Schema.Types.Mixed, default: [] },
  evidence: { type: mongoose.Schema.Types.Mixed, default: [] },
  assumptions: { type: mongoose.Schema.Types.Mixed, default: [] },
  decisions: { type: mongoose.Schema.Types.Mixed, default: [] },
  risks: { type: mongoose.Schema.Types.Mixed, default: [] },
  anticipatedQuestions: { type: mongoose.Schema.Types.Mixed, default: [] },
  preparedAnswers: { type: mongoose.Schema.Types.Mixed, default: [] },
  conversationContext: { type: mongoose.Schema.Types.Mixed, default: null },
  status: { type: String, default: "CREATED" },
  briefId: { type: String, default: null, index: true },
  goalId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
});

LivingArtifactSchema.pre("save", function() {
  this.updatedAt = new Date();
});

LivingArtifactSchema.index({ projectId: 1, createdAt: -1 });
LivingArtifactSchema.index({ sessionId: 1, createdAt: -1 });
LivingArtifactSchema.index({ continuityScopeId: 1, createdAt: -1 });
LivingArtifactSchema.index({ artifactType: 1, createdAt: -1 });

module.exports = mongoose.model("LivingArtifact", LivingArtifactSchema);
