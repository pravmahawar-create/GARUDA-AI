const { buildIdempotencyKey, buildPaymentLinkPayload, getProviderConfig } = require("./razorpayPaymentLinkService");
const assert = require("assert");

function test(name, fn) {
  try {
    fn();
    console.log(`PASS: ${name}`);
  } catch (error) {
    console.error(`FAIL: ${name}: ${error.message}`);
    process.exitCode = 1;
  }
}

test("buildPaymentLinkPayload embeds missionId:candidateId in reference_id", () => {
  const payload = buildPaymentLinkPayload({
    missionId: "507f1f77bcf86cd799439011",
    candidateId: "507f1f77bcf86cd799439012",
    amount: 1500,
    currency: "INR",
    description: "Milestone 1 deposit"
  }, {});
  assert.strictEqual(payload.reference_id, "507f1f77bcf86cd799439011:507f1f77bcf86cd799439012");
  assert.strictEqual(payload.notes.missionId, "507f1f77bcf86cd799439011");
  assert.strictEqual(payload.notes.candidateId, "507f1f77bcf86cd799439012");
  assert.strictEqual(payload.amount, 150000);
});

test("buildIdempotencyKey is deterministic for same input", () => {
  const input = { missionId: "a", candidateId: "b", amount: 1500, currency: "INR" };
  assert.strictEqual(buildIdempotencyKey(input), buildIdempotencyKey(input));
});

test("buildIdempotencyKey differs when amount changes", () => {
  const input = { missionId: "a", candidateId: "b", amount: 1500, currency: "INR" };
  const input2 = { missionId: "a", candidateId: "b", amount: 2000, currency: "INR" };
  assert.notStrictEqual(buildIdempotencyKey(input), buildIdempotencyKey(input2));
});

test("getProviderConfig detects live mode", () => {
  const env = {
    RAZORPAY_LIVE_ENABLED: "true",
    RAZORPAY_KEY_ID_LIVE: "rzp_live_abcdefghij",
    RAZORPAY_KEY_SECRET_LIVE: "secret1234567890",
    RAZORPAY_WEBHOOK_SECRET_LIVE: "whsec_1234567890123456"
  };
  const config = getProviderConfig(env);
  assert.strictEqual(config.mode, "live");
  assert.strictEqual(config.liveEnabled, true);
  assert.strictEqual(config.ready, true);
});

test("getProviderConfig not ready without credentials", () => {
  const config = getProviderConfig({});
  assert.strictEqual(config.ready, false);
});

test("buildPaymentLinkPayload rejects invalid amount", () => {
  assert.throws(() => buildPaymentLinkPayload({ missionId: "a", candidateId: "b", amount: 0.5 }), /at least 1.00/);
});

test("buildPaymentLinkPayload accepts non-INR currency", () => {
  const payload = buildPaymentLinkPayload({
    missionId: "507f1f77bcf86cd799439011",
    candidateId: "507f1f77bcf86cd799439012",
    amount: 250,
    currency: "USD"
  });
  assert.strictEqual(payload.currency, "USD");
  assert.strictEqual(payload.amount, 25000);
});

test("buildPaymentLinkPayload rejects malformed currency", () => {
  assert.throws(() => buildPaymentLinkPayload({ missionId: "a", candidateId: "b", amount: 100, currency: "US" }), /3-letter ISO/);
});

test("buildPaymentLinkPayload rejects invalid missionId", () => {
  assert.throws(() => buildPaymentLinkPayload({ missionId: "invalid", candidateId: "b", amount: 100 }), /Invalid missionId/);
});
