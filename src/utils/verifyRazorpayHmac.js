const crypto = require("crypto");

function fail(message, statusCode = 400) {
  throw Object.assign(new Error(message), { statusCode });
}

/**
 * Single source of truth for Razorpay HMAC verification — timingSafeEqual.
 * Replaces triple duplication in api/proposals.js, razorpayPaymentLinkService.js, paymentWebhookService.js.
 */
function verifyRazorpayHmac(rawBody, signature, secret) {
  if (!secret || String(secret).length < 12) fail("Razorpay webhook secret is not configured", 503);
  if (typeof rawBody !== "string" || !rawBody) fail("rawBody is required for signature verification", 400);
  const expected = crypto.createHmac("sha256", String(secret)).update(rawBody).digest("hex");
  const provided = String(signature || "");
  if (provided.length !== expected.length) fail("Invalid Razorpay webhook signature", 401);
  if (!crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) fail("Invalid Razorpay webhook signature", 401);
  return true;
}

module.exports = { verifyRazorpayHmac };
