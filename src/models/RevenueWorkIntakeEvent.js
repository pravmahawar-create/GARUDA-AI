const mongoose = require("mongoose");

const EVENT_TYPES = ["handoff_prepared", "work_confirmed", "mission_created"];

const schema = new mongoose.Schema(
  {
    intakeId: { type: mongoose.Schema.Types.ObjectId, ref: "RevenueWorkIntake", required: true, index: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "DiscoveryCandidate", required: true, index: true },
    sequence: { type: Number, required: true, min: 1 },
    eventType: { type: String, enum: EVENT_TYPES, required: true, index: true },
    actor: { type: String, enum: ["founder", "garuda"], required: true },
    details: { type: mongoose.Schema.Types.Mixed, required: true },
    previousEventHash: { type: String, default: null },
    eventHash: { type: String, required: true, unique: true, index: true },
    occurredAt: { type: Date, required: true }
  },
  { timestamps: true }
);

schema.index({ intakeId: 1, sequence: 1 }, { unique: true });
schema.pre("save", function immutableSave() {
  if (!this.isNew) throw new Error("Revenue work-intake audit records are immutable");
});
for (const operation of ["updateOne", "updateMany", "findOneAndUpdate", "replaceOne", "deleteOne", "deleteMany", "findOneAndDelete"]) {
  schema.pre(operation, function immutableMutation() {
    throw new Error("Revenue work-intake audit records are immutable");
  });
}
schema.set("toJSON", {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    ret.intakeId = String(ret.intakeId);
    ret.candidateId = String(ret.candidateId);
    delete ret._id;
    return ret;
  }
});

module.exports = {
  RevenueWorkIntakeEvent: mongoose.model("RevenueWorkIntakeEvent", schema),
  EVENT_TYPES
};
