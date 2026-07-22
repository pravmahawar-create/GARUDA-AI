const assert = require("assert");
const crypto = require("crypto");
const service = require("./revenuePaymentReceiptService");

const env = {
  GARUDA_PAYMENT_PROVIDER: "provider-test",
  GARUDA_PAYMENT_ACCOUNT_REFERENCE: "eligible-account-ref",
  GARUDA_PAYMENT_KYC_VERIFIED: "true",
  GARUDA_PAYMENT_ACCOUNT_HOLDER_ELIGIBLE: "true",
  GARUDA_PAYMENT_PAYOUTS_ENABLED: "true",
  GARUDA_PAYMENT_SUPPORTED_CURRENCIES: "INR,USD",
  GARUDA_PAYMENT_WEBHOOK_SECRET: "isolated-unit-secret-123"
};
const rawBody = JSON.stringify({
  event: "payment.received",
  eventId: "evt-unit-1",
  missionId: "mission-1",
  provider: "provider-test",
  accountReference: "eligible-account-ref",
  payment: { amount: 1250, currency: "INR", status: "captured", providerReference: "pay-unit-1", receivedAt: "2026-07-22T10:00:00.000Z" }
});
const signature = crypto.createHmac("sha256", env.GARUDA_PAYMENT_WEBHOOK_SECRET).update(rawBody).digest("hex");

assert.strictEqual(service.accountReadiness(env).ready, true);
assert.strictEqual(service.accountReadiness({}).livePaymentInitiationEnabled, false);
const verified = service.verifySignedWebhook(rawBody, signature, env, new Date("2026-07-22T10:01:00.000Z"));
assert.strictEqual(verified.verified, true);
assert.strictEqual(verified.verificationMethod, "signed_provider_webhook");
assert.strictEqual(verified.amount, 1250);
assert.strictEqual(verified.livePaymentInitiatedByGaruda, false);
assert.throws(() => service.verifySignedWebhook(rawBody, "0".repeat(64), env), /signature/);
assert.throws(() => service.verifySignedWebhook(rawBody, signature, { ...env, GARUDA_PAYMENT_KYC_VERIFIED: "false" }), /not ready/);

console.log("Eligible payment account readiness and signed provider receipt validation passed.");
