const mongoose = require("mongoose");

const VALID_PLANS = ["personal", "creator", "sme", "enterprise"];
const VALID_PROFILES = ["sovereign_local", "cloud_hosted", "air_gapped"];
const VALID_STATUSES = ["active", "suspended", "archived"];

const TenantSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    plan: {
      type: String,
      enum: VALID_PLANS,
      default: "personal",
      index: true
    },
    deploymentProfile: {
      type: String,
      enum: VALID_PROFILES,
      default: "sovereign_local"
    },
    ownerUserId: {
      type: String,
      default: null,
      index: true
    },
    status: {
      type: String,
      enum: VALID_STATUSES,
      default: "active",
      index: true
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

TenantSchema.set("toJSON", {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret.tenantId || String(ret._id);
    delete ret._id;
  }
});

const Tenant = mongoose.models.Tenant || mongoose.model("Tenant", TenantSchema);

module.exports = {
  Tenant,
  VALID_PLANS,
  VALID_PROFILES,
  VALID_STATUSES
};
