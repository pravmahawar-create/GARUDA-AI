const assert = require("assert");
const service = require("./revenueSignedWebhookService");
(async () => {
  const env = { GARUDA_WEBHOOK_ENABLED: "true", GARUDA_WEBHOOK_ENDPOINT: "https://provider.example/handoff", GARUDA_WEBHOOK_SECRET: "test-secret", GARUDA_WEBHOOK_TIMEOUT_MS: "1000" };
  assert.equal(service.configured(env).enabled, true);
  assert.equal(service.configured({ ...env, GARUDA_WEBHOOK_ENDPOINT: "http://unsafe" }).enabled, false);
  assert.equal(service.sign("body", "secret", "time"), service.sign("body", "secret", "time"));
  let attempts = 0;
  const validation = { payload: { safe: true }, requestHash: "request-hash", idempotencyKey: "idem-key" };
  const receipt = await service.send(validation, { env, transport: async () => { attempts += 1; if (attempts < 3) return { ok: false, status: 503, json: async () => ({}) }; return { ok: true, status: 200, json: async () => ({ accepted: true, requestHash: "request-hash", providerReference: "provider-1" }) }; } });
  assert.equal(receipt.attempts, 3); assert.equal(receipt.verified, true); assert.equal(attempts, 3);
  console.log("Signed webhook configuration, HMAC, retry, timeout, and receipt verification passed.");
})().catch((error) => { console.error(error); process.exit(1); });
