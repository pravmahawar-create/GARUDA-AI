const assert = require("assert"); const crypto = require("crypto");
const service = require("./razorpayTestPaymentService");
const prepared = service.prepareTestPaymentLink({ amount: 100, referenceId: "pilot-1" }, { founderApproved: "true" });
assert.equal(prepared.mode, "test"); assert.equal(prepared.execute, false); assert.equal(prepared.payload.amount, 10000);
const secret = "test_secret_123456789"; const raw = JSON.stringify({ event: "payment_link.paid" }); const sig = crypto.createHmac("sha256", secret).update(raw).digest("hex");
assert.equal(service.verifyWebhook(raw, sig, secret).ledgerEligible, true);
assert.throws(() => service.verifyWebhook(raw, "bad", secret), /Invalid/);
assert.equal(service.readiness({ RAZORPAY_KEY_ID_TEST: "rzp_test_abc", RAZORPAY_WEBHOOK_SECRET_TEST: secret }).ready, true);
console.log("Razorpay test-mode preparation, signature verification, and live-mode safety passed.");
