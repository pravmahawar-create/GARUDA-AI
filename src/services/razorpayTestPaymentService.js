const crypto = require("crypto");
function fail(message, statusCode = 400) { throw Object.assign(new Error(message), { statusCode }); }
function founderApproved(value) { return value === true || value === "true" || value === "approved"; }
function readiness(env = process.env) {
  const testKeyConfigured = /^rzp_test_/.test(String(env.RAZORPAY_KEY_ID_TEST || ""));
  const webhookSecretConfigured = String(env.RAZORPAY_WEBHOOK_SECRET_TEST || "").length >= 16;
  return { mode: "test", ready: testKeyConfigured && webhookSecretConfigured, checks: { testKeyConfigured, webhookSecretConfigured, liveModeDisabled: env.RAZORPAY_LIVE_ENABLED !== "true" }, livePaymentsEnabled: false, truth: "This connector prepares test-mode requests only. It never transfers money or calls Razorpay automatically." };
}
function prepareTestPaymentLink(input = {}, context = {}, now = new Date()) {
  if (!founderApproved(context.founderApproved)) fail("Founder approval is required to prepare a test payment link", 403);
  const amount = Math.round(Number(input.amount) * 100);
  if (!Number.isSafeInteger(amount) || amount < 100) fail("amount must be at least INR 1.00");
  const currency = String(input.currency || "INR").toUpperCase(); if (currency !== "INR") fail("Phase 41-43 supports INR test links only");
  const referenceId = String(input.referenceId || "").trim(); if (!referenceId) fail("referenceId is required");
  return { mode: "test", endpoint: "https://api.razorpay.com/v1/payment_links", execute: false, payload: { amount, currency, reference_id: referenceId, description: String(input.description || "GARUDA test invoice").slice(0, 255), callback_method: "get" }, governance: { preparedOnly: true, networkCallPerformed: false, liveCredentialsAccepted: false, founderApprovalRequiredForFutureDispatch: true } };
}
function verifyWebhook(rawBody, signature, secret) {
  if (!secret || String(secret).length < 16) fail("Test webhook secret is not configured", 503);
  if (typeof rawBody !== "string" || !rawBody) fail("rawBody is required");
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const provided = String(signature || "");
  const valid = provided.length === expected.length && crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  if (!valid) fail("Invalid Razorpay webhook signature", 401);
  const event = JSON.parse(rawBody); const type = String(event.event || "");
  return { verified: true, mode: "test", event: type, paymentCaptured: type === "payment.captured" || type === "payment_link.paid", settlementStatus: type.startsWith("settlement.") ? type.split(".")[1] : "not_reported", ledgerEligible: type === "payment.captured" || type === "payment_link.paid", payloadHash: crypto.createHash("sha256").update(rawBody).digest("hex") };
}
module.exports = { prepareTestPaymentLink, readiness, verifyWebhook };
