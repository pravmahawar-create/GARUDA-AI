/**
 * GARUDA Production Deployment & Environment Config Evaluator
 */
function getProductionConfigStatus(env = process.env) {
  const isLiveMode = String(env.RAZORPAY_LIVE_ENABLED || "").toLowerCase() === "true";
  const webhookSecret = isLiveMode ? env.RAZORPAY_WEBHOOK_SECRET_LIVE : (env.RAZORPAY_WEBHOOK_SECRET_TEST || env.RAZORPAY_WEBHOOK_SECRET);
  const keyId = isLiveMode ? env.RAZORPAY_KEY_ID_LIVE : env.RAZORPAY_KEY_ID_TEST;

  const checks = {
    webhookSecretConfigured: Boolean(webhookSecret && webhookSecret.length >= 12),
    razorpayKeyConfigured: Boolean(keyId && keyId.length >= 8),
    discoveryIntervalMs: Number(env.DISCOVERY_INTERVAL_MS || 900000),
    acquisitionIntervalMs: Number(env.REVENUE_ACQUISITION_INTERVAL_MS || 1200000),
    mode: isLiveMode ? "live" : "test"
  };

  const isProductionReady = checks.webhookSecretConfigured && checks.razorpayKeyConfigured;

  return {
    isProductionReady,
    checks,
    webhookEndpoint: "https://garuda-ai-xfif.onrender.com/api/webhook/payment/razorpay",
    recommendedEnvVars: {
      RAZORPAY_WEBHOOK_SECRET_TEST: "Minimum 12-char HMAC secret set in Razorpay Dashboard",
      RAZORPAY_KEY_ID_TEST: "rzp_test_xxxxxxxx",
      DISCOVERY_INTERVAL_MS: "900000",
      REVENUE_ACQUISITION_INTERVAL_MS: "1200000"
    }
  };
}

module.exports = { getProductionConfigStatus };
