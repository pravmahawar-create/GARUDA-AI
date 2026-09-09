const crypto = require("crypto");
const mongoose = require("mongoose");
const { TenantApiKey } = require("../models/TenantApiKey");

const KEY_PREFIX = "grd_live_";
const memoryKeyStore = new Map();

function isMongoConnected() {
  return Boolean(mongoose.connection && mongoose.connection.readyState === 1);
}

/**
 * Generates a new cryptographically secure API key for a tenant.
 * Returns the raw key ONLY once.
 */
async function generateApiKey(tenantId, name, userId = null, options = {}) {
  if (!tenantId || !name) {
    throw new Error("tenantId and name are required to generate an API key");
  }

  const rawSecret = crypto.randomBytes(24).toString("base64url");
  const fullApiKey = `${KEY_PREFIX}${rawSecret}`;
  const hashedKey = TenantApiKey.hashRawKey(fullApiKey);
  const keyPrefix = `${KEY_PREFIX}${rawSecret.slice(0, 6)}...`;
  const keyId = `key_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

  const keyRecord = {
    keyId,
    tenantId,
    name: String(name).trim(),
    hashedKey,
    keyPrefix,
    createdByUserId: userId,
    status: "active",
    rateLimitPerMinute: Number(options.rateLimitPerMinute) || 60,
    expiresAt: options.expiresAt ? new Date(options.expiresAt) : null,
    metadata: options.metadata || {},
    createdAt: new Date(),
    updatedAt: new Date()
  };

  memoryKeyStore.set(hashedKey, keyRecord);

  if (isMongoConnected()) {
    try {
      await TenantApiKey.create(keyRecord);
    } catch {}
  }

  return {
    keyId,
    tenantId,
    name: keyRecord.name,
    keyPrefix,
    apiKey: fullApiKey, // Only revealed once!
    createdAt: keyRecord.createdAt
  };
}

/**
 * Verifies an incoming raw API key against stored SHA-256 hashes.
 */
async function verifyApiKey(rawKey) {
  if (!rawKey || typeof rawKey !== "string" || !rawKey.startsWith(KEY_PREFIX)) {
    return { valid: false, reason: "invalid_key_format" };
  }

  const hashedKey = TenantApiKey.hashRawKey(rawKey);
  let keyDoc = memoryKeyStore.get(hashedKey) || null;

  if (!keyDoc && isMongoConnected()) {
    try {
      keyDoc = await TenantApiKey.findOne({ hashedKey }).lean();
      if (keyDoc) memoryKeyStore.set(hashedKey, keyDoc);
    } catch {}
  }

  if (!keyDoc) {
    return { valid: false, reason: "key_not_found" };
  }

  if (keyDoc.status !== "active") {
    return { valid: false, reason: `key_${keyDoc.status}` };
  }

  if (keyDoc.expiresAt && new Date(keyDoc.expiresAt).getTime() < Date.now()) {
    keyDoc.status = "expired";
    memoryKeyStore.set(hashedKey, keyDoc);
    if (isMongoConnected()) {
      try {
        await TenantApiKey.updateOne({ keyId: keyDoc.keyId }, { $set: { status: "expired" } });
      } catch {}
    }
    return { valid: false, reason: "key_expired" };
  }

  // Record usage asynchronously
  keyDoc.lastUsedAt = new Date();
  memoryKeyStore.set(hashedKey, keyDoc);
  if (isMongoConnected()) {
    try {
      TenantApiKey.updateOne({ keyId: keyDoc.keyId }, { $set: { lastUsedAt: new Date() } }).exec();
    } catch {}
  }

  return {
    valid: true,
    keyId: keyDoc.keyId,
    tenantId: keyDoc.tenantId,
    name: keyDoc.name,
    rateLimitPerMinute: keyDoc.rateLimitPerMinute || 60
  };
}

/**
 * Revokes an existing API key.
 */
async function revokeApiKey(keyId, tenantId) {
  let found = false;
  for (const [hash, record] of memoryKeyStore.entries()) {
    if (record.keyId === keyId && record.tenantId === tenantId) {
      record.status = "revoked";
      record.updatedAt = new Date();
      memoryKeyStore.set(hash, record);
      found = true;
    }
  }

  if (isMongoConnected()) {
    try {
      const result = await TenantApiKey.updateOne(
        { keyId, tenantId },
        { $set: { status: "revoked" } }
      );
      if (result.modifiedCount > 0) found = true;
    } catch {}
  }

  return { success: found };
}

/**
 * Lists active/all API keys for a tenant (without revealing raw keys).
 */
async function listTenantApiKeys(tenantId) {
  const result = [];
  const seenIds = new Set();

  if (isMongoConnected()) {
    try {
      const keys = await TenantApiKey.find({ tenantId }).sort({ createdAt: -1 }).lean();
      for (const k of keys) {
        seenIds.add(k.keyId);
        result.push({
          keyId: k.keyId,
          name: k.name,
          keyPrefix: k.keyPrefix,
          status: k.status,
          lastUsedAt: k.lastUsedAt,
          expiresAt: k.expiresAt,
          createdAt: k.createdAt
        });
      }
    } catch {}
  }

  for (const record of memoryKeyStore.values()) {
    if (record.tenantId === tenantId && !seenIds.has(record.keyId)) {
      seenIds.add(record.keyId);
      result.push({
        keyId: record.keyId,
        name: record.name,
        keyPrefix: record.keyPrefix,
        status: record.status,
        lastUsedAt: record.lastUsedAt,
        expiresAt: record.expiresAt,
        createdAt: record.createdAt
      });
    }
  }

  return result;
}

module.exports = {
  generateApiKey,
  verifyApiKey,
  revokeApiKey,
  listTenantApiKeys,
  KEY_PREFIX
};
