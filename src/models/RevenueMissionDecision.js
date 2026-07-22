const mongoose = require("mongoose");

const revenueMissionDecisionSchema = new mongoose.Schema(
  {
    engine: { type: String, required: true, trim: true },
    missionId: { type: mongoose.Schema.Types.ObjectId, ref: "RevenueExecutionMission", required: true, index: true },
    evidenceHash: { type: String, required: true, trim: true },
    decision: { type: String, enum: ["approved", "request_changes", "rejected"], required: true, index: true },
    notes: { type: String, default: "", maxlength: 2000 },
    actor: { type: String, enum: ["founder"], required: true },
    decidedAt: { type: Date, required: true },
    previousDecisionHash: { type: String, default: null },
    decisionHash: { type: String, required: true, unique: true, index: true },
    governance: { type: mongoose.Schema.Types.Mixed, required: true }
  },
  { timestamps: true }
);

revenueMissionDecisionSchema.index({ missionId: 1, evidenceHash: 1 }, { unique: true });
revenueMissionDecisionSchema.pre("save", function immutableSave() {
  if (!this.isNew) throw new Error("Revenue mission decision records are immutable");
});
for (const operation of ["updateOne", "updateMany", "findOneAndUpdate", "replaceOne", "deleteOne", "deleteMany", "findOneAndDelete"]) {
  revenueMissionDecisionSchema.pre(operation, function immutableMutation() { throw new Error("Revenue mission decision records are immutable"); });
}
revenueMissionDecisionSchema.set("toJSON", { versionKey: false, transform: (_doc, ret) => { ret.id = String(ret._id); ret.missionId = String(ret.missionId); delete ret._id; } });

module.exports = { RevenueMissionDecision: mongoose.model("RevenueMissionDecision", revenueMissionDecisionSchema) };
