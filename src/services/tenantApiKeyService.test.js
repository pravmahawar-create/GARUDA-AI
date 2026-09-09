const assert = require("assert");
const { describe, it } = require("node:test");
const { generateApiKey, verifyApiKey, revokeApiKey, listTenantApiKeys, KEY_PREFIX } = require("./tenantApiKeyService");
const { TenantApiKey } = require("../models/TenantApiKey");

describe("Tenant API Key Engine Test Suite", () => {
  const testTenantId = "tenant_test_dev_99";
  let generatedKeyData = null;

  it("1. Generates cryptographically secure API key with prefix", async () => {
    generatedKeyData = await generateApiKey(testTenantId, "Staging CI Runner");
    assert(generatedKeyData.apiKey.startsWith(KEY_PREFIX), "Key must start with grd_live_");
    assert(generatedKeyData.keyPrefix.startsWith(KEY_PREFIX), "Prefix must start with grd_live_");
    assert.strictEqual(generatedKeyData.tenantId, testTenantId);
    assert.strictEqual(generatedKeyData.name, "Staging CI Runner");
    console.log("✔ PASS: Generated secure API key with prefix:", generatedKeyData.keyPrefix);
  });

  it("2. Verifies valid API key and returns tenant context", async () => {
    const result = await verifyApiKey(generatedKeyData.apiKey);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.tenantId, testTenantId);
    assert.strictEqual(result.name, "Staging CI Runner");
    console.log("✔ PASS: Verified API key against stored SHA-256 hash");
  });

  it("3. Rejects malformed or unknown API key", async () => {
    const invalidResult = await verifyApiKey("grd_live_invalid_key_that_does_not_exist");
    assert.strictEqual(invalidResult.valid, false);
    assert.strictEqual(invalidResult.reason, "key_not_found");

    const nonPrefixed = await verifyApiKey("sk-regular-fake-key");
    assert.strictEqual(nonPrefixed.valid, false);
    assert.strictEqual(nonPrefixed.reason, "invalid_key_format");
    console.log("✔ PASS: Safely rejected invalid and un-prefixed keys");
  });

  it("4. Lists tenant API keys without exposing raw secrets", async () => {
    const list = await listTenantApiKeys(testTenantId);
    assert(Array.isArray(list));
    assert(list.length >= 1);
    const item = list.find((k) => k.keyId === generatedKeyData.keyId);
    assert(item);
    assert.strictEqual(item.apiKey, undefined, "Raw key must NEVER be leaked in list queries");
    assert.strictEqual(item.keyPrefix, generatedKeyData.keyPrefix);
    console.log("✔ PASS: Listed tenant API keys without leaking secrets");
  });

  it("5. Revokes API key and verifies subsequent rejection", async () => {
    const revoked = await revokeApiKey(generatedKeyData.keyId, testTenantId);
    assert.strictEqual(revoked.success, true);

    const check = await verifyApiKey(generatedKeyData.apiKey);
    assert.strictEqual(check.valid, false);
    assert.strictEqual(check.reason, "key_revoked");
    console.log("✔ PASS: Key revoked and subsequent requests blocked with key_revoked");
  });
});
