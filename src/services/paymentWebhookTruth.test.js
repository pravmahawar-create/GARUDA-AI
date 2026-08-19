const assert = require("assert");
const crypto = require("crypto");
const mongoose = require("mongoose");
const {
  verifyRazorpaySignature,
  extractPaymentDetails,
  parseReferenceId,
  hasValidReference,
  getProviderMode,
  calculateSettlementAmounts
} = require("./paymentWebhookService");

function sign(rawBody, secret) {
  return crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
}

const SECRET = "whsec_123456789012345678";

/* H — webhook signature verification */
(async () => {
  await assert.doesNotReject(() => verifyRazorpaySignature(JSON.stringify({ event: "payment.captured" }), sign(JSON.stringify({ event: "payment.captured" }), SECRET), SECRET));
  await assert.rejects(() => verifyRazorpaySignature(JSON.stringify({ event: "payment.captured" }), "forged-signature", SECRET), /Invalid Razorpay webhook signature/);
  await assert.rejects(() => verifyRazorpaySignature(JSON.stringify({}), "abc", ""), /webhook secret is not configured/);
  await assert.rejects(() => verifyRazorpaySignature("", "abc", SECRET), /rawBody is required/);

  /* J — fake/unverified payment cannot become revenue (signature is the gate) */
  await assert.rejects(
    () => verifyRazorpaySignature(JSON.stringify({ event: "payment.captured", amount: 5000 }), sign("tampered-body", SECRET), SECRET),
    /Invalid Razorpay webhook signature/
  );

  /* F/H — event extraction: payment.captured carries pay_* id, notes carry mission:candidate */
  const capturedEvent = {
    event: "payment.captured",
    id: "event_captured_001",
    payload: {
      payment: {
        entity: {
          id: "pay_PAY0001",
          amount: 50000,
          currency: "INR",
          captured_at: 1750000000,
          notes: { missionId: "507f1f77bcf86cd799439011", candidateId: "507f1f77bcf86cd799439012" }
        }
      }
    }
  };
  const captured = extractPaymentDetails(capturedEvent);
  assert.strictEqual(captured.paymentId, "pay_PAY0001");
  assert.strictEqual(captured.providerEventId, "event_captured_001");
  assert.strictEqual(captured.paymentCaptured, true);
  assert.strictEqual(captured.isRefund, false);
  assert.strictEqual(captured.referenceId, "507f1f77bcf86cd799439011:507f1f77bcf86cd799439012");

  /* I — payment_link.paid must resolve the SAME canonical pay_* id (prevents double count) */
  const linkPaidEvent = {
    event: "payment_link.paid",
    id: "event_link_paid_002",
    payload: {
      payment_link: {
        entity: {
          id: "plink_XYZ0001",
          amount: 50000,
          currency: "INR",
          notes: { missionId: "507f1f77bcf86cd799439011", candidateId: "507f1f77bcf86cd799439012" },
          payments: { items: [{ id: "pay_PAY0001" }] }
        }
      }
    }
  };
  const linkPaid = extractPaymentDetails(linkPaidEvent);
  assert.strictEqual(linkPaid.paymentId, "pay_PAY0001", "payment_link.paid must resolve inner pay_* id so dedupe matches payment.captured");
  assert.strictEqual(linkPaid.paymentCaptured, true);

  /* Q — refund events detected */
  const refundEvent = { event: "payment.refunded", id: "event_refund_003", payload: { payment: { entity: { id: "pay_PAY0001", amount: 50000, currency: "INR" } } } };
  assert.strictEqual(extractPaymentDetails(refundEvent).isRefund, true);

  /* non-capture events are never treated as payment */
  assert.strictEqual(extractPaymentDetails({ event: "order.paid", payload: { payment: { entity: { id: "ord_1" } } } }).paymentCaptured, false);
  assert.strictEqual(extractPaymentDetails({ event: "payment.failed", payload: { payment: { entity: { id: "pay_PAY0001" } } } }).paymentCaptured, false);

  /* reference parsing */
  assert.deepStrictEqual(parseReferenceId("abc:def"), { missionId: "abc", candidateId: "def" });
  assert.deepStrictEqual(parseReferenceId("nonsense"), { missionId: null, candidateId: null });
  assert.strictEqual(hasValidReference("507f1f77bcf86cd799439011:507f1f77bcf86cd799439012"), true);
  assert.strictEqual(hasValidReference("not-an-id:507f1f77bcf86cd799439012"), false);
  assert.strictEqual(hasValidReference(""), false);

  /* settlement amount math (K: captured != settled — fee computed separately) */
  assert.deepStrictEqual(calculateSettlementAmounts(1000, 2), { grossAmount: 1000, feeRatePercent: 2, feeAmount: 20, netAmount: 980 });
  assert.throws(() => calculateSettlementAmounts(-1, 2), /non-negative/);

  /* T — provider mode detection (test vs live) */
  assert.strictEqual(getProviderMode({ RAZORPAY_LIVE_ENABLED: "true" }), "live");
  assert.strictEqual(getProviderMode({ RAZORPAY_LIVE_ENABLED: "false" }), "test");
  assert.strictEqual(getProviderMode({}), "test");

  console.log("Payment webhook truth unit tests passed.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});