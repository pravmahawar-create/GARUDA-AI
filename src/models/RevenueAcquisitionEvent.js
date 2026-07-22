const mongoose = require("mongoose");

const EVENT_TYPES = [
  "proposal_drafted",
  "source_invalidated",
  "founder_handoff_approved",
  "submission_recorded",
  "client_response_recorded",
  "no_award_closed",
  "award_verified",
  "mission_created"
];

const schema = new mongoose.Schema(
  {
    acquisitionCaseId: { type: mongoose.Schema.Types.ObjectId, ref: "RevenueAcquisitionCase", required: true, index: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "DiscoveryCandidate", required: true, index: true },
    sequence: { type: Number, required: true, min: 1 },
    eventType: { type: String, enum: EVENT_TYPES, required: true, index: true },
    actor: { type: String, enum: ["garuda", "founder", "client"], required: true },
    details: { type: mongoose.Schema.Types.Mixed, required: true },
    previousEventHash: { type: String, default: null },
    eventHash: { type: String, required: true, unique: true, index: true },
    occurredAt: { type: Date, required: true }
  },
  { timestamps: true }
);

schema.index({ acquisitionCaseId: 1, sequence: 1 }, { unique: true });
schema.pre("save", function immutableSave() {
  if (!this.isNew) throw new Error("Revenue acquisition audit records are immutable");
});
for (const operation of ["updateOne", "updateMany", "findOneAndUpdate", "replaceOne", "deleteOne", "deleteMany", "findOneAndDelete"]) {
  schema.pre(operation, function immutableMutation() {
    throw new Error("Revenue acquisition audit records are immutable");
  });
}
schema.set("toJSON", {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    ret.acquisitionCaseId = String(ret.acquisitionCaseId);
    ret.candidateId = String(ret.candidateId);
    delete ret._id;
    return ret;
  }
});

module.exports = {
  EVENT_TYPES,
  RevenueAcquisitionEvent: mongoose.model("RevenueAcquisitionEvent", schema)
};
