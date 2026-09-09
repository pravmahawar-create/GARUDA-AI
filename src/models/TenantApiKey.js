const mongoose = require("mongoose");
const crypto = require("crypto");

const API_KEY_STATUSES = ["active", "revoked", "expired"];

const TenantApiKeySchema = new mongoose.Schema(
  {
    keyId: {
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
    name: {
      type: String,
      required: true,
      trim: true
    },
    hashedKey: {
      type: String,
      required: true,
      index: true
    },
    keyPrefix: {
      type: String,
      required: true
    },
    createdByUserId: {
      type: String,
      default: null,
      index: true
    },
    status: {
      type: String,
      enum: API_KEY_STATUSES,
      default: "active",
      index: true
    },
    lastUsedAt: {
      type: Date,
      default: null
    },
    expiresAt: {
      type: Date,
      default: null
    },
    rateLimitPerMinute: {
      type: Number,
      default: 60,
      min: 1
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

TenantApiKeySchema.statics.hashRawKey = function (rawKey) {
  return crypto.createHash("sha256").update(String(rawKey)).digest("hex");
};

TenantApiKeySchema.set("toJSON", {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret.keyId || String(ret._id);
    delete ret.hashedKey;
    delete ret._id;
  }
});

const TenantApiKey = mongoose.models.TenantApiKey || mongoose.model("TenantApiKey", TenantApiKeySchema);

module.exports = {
  TenantApiKey,
  API_KEY_STATUSES
};
