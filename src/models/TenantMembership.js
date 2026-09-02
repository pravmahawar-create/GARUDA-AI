const mongoose = require("mongoose");

const VALID_ROLES = [
  "platform_founder",
  "tenant_admin",
  "tenant_member",
  "tenant_viewer",
  "anonymous_guest"
];

const VALID_MEMBERSHIP_STATUSES = ["active", "invited", "revoked"];

const TenantMembershipSchema = new mongoose.Schema(
  {
    membershipId: {
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
    role: {
      type: String,
      enum: VALID_ROLES,
      default: "tenant_member",
      index: true
    },
    status: {
      type: String,
      enum: VALID_MEMBERSHIP_STATUSES,
      default: "active",
      index: true
    }
  },
  {
    timestamps: true
  }
);

TenantMembershipSchema.index({ tenantId: 1, userId: 1 }, { unique: true });

TenantMembershipSchema.set("toJSON", {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret.membershipId || String(ret._id);
    delete ret._id;
  }
});

const TenantMembership = mongoose.models.TenantMembership || mongoose.model("TenantMembership", TenantMembershipSchema);

module.exports = {
  TenantMembership,
  VALID_ROLES,
  VALID_MEMBERSHIP_STATUSES
};
