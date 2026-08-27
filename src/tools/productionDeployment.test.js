const crypto = require("crypto");
const { getProductionConfigStatus } = require("../services/productionConfigService");
const paymentWebhookService = require("../services/paymentWebhookService");
const { getOperatingCycleTelemetry, initRevenueOperatingCycle, stopRevenueOperatingCycle } = require("../services/revenueOperatingCycleInitializer");

async function runProductionDeploymentTests() {
  console.log("🧪 Starting GARUDA Mission 14 Production Deployment & Webhook Suite...\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // 1. PRODUCTION ENVIRONMENT CONFIG EVALUATOR
  // -------------------------------------------------------------
  console.log("--- 1. PRODUCTION ENVIRONMENT CONFIG EVALUATOR ---");
  const testEnv = {
    RAZORPAY_WEBHOOK_SECRET_TEST: "test_secret_1234567890",
    RAZORPAY_KEY_ID_TEST: "rzp_test_1234567890",
    DISCOVERY_INTERVAL_MS: "900000"
  };

  const configStatus = getProductionConfigStatus(testEnv);
  assert(
    configStatus &&
    configStatus.isProductionReady === true &&
    configStatus.checks.webhookSecretConfigured === true,
    "Production config evaluator validates environment variables correctly"
  );

  // -------------------------------------------------------------
  // 2. WEBHOOK SIGNATURE VERIFICATION
  // -------------------------------------------------------------
  console.log("\n--- 2. WEBHOOK SIGNATURE VERIFICATION ---");
  const secret = "test_webhook_secret_key_123";
  const rawBody = JSON.stringify({ event: "payment.captured", id: "evt_12345" });
  const validSignature = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  const isVerified = await paymentWebhookService.verifyRazorpaySignature(rawBody, validSignature, secret);
  assert(isVerified === true, "Valid HMAC SHA-256 webhook signature verified cleanly");

  let signatureError = null;
  try {
    await paymentWebhookService.verifyRazorpaySignature(rawBody, "invalid_signature_string", secret);
  } catch (err) {
    signatureError = err;
  }
  assert(signatureError && signatureError.statusCode === 401, "Invalid HMAC signature rejected with 401 Unauthorized");

  // -------------------------------------------------------------
  // 3. 24x7 SCHEDULER BOOT & TELEMETRY
  // -------------------------------------------------------------
  console.log("\n--- 3. 24x7 SCHEDULER BOOT & TELEMETRY ---");
  initRevenueOperatingCycle();
  const telemetry = getOperatingCycleTelemetry();

  assert(
    telemetry && telemetry.isInitialized === true && telemetry.discoveryWorkerActive === true,
    "24x7 Background Revenue Operating Cycle booted with active discovery telemetry"
  );

  stopRevenueOperatingCycle();

  console.log(`\n📊 Mission 14 Production Deployment Test Results: ${passed} Passed, ${failed} Failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runProductionDeploymentTests();
}

module.exports = runProductionDeploymentTests;
