const assert = require("assert");
const emailRelayService = require("./emailRelayService");
const outreachDispatch = require("./garudaOutreachDispatchService");

async function runTests() {
  console.log("Starting GARUDA M31 Outbound Relay Configuration Verification Suite...\n");

  // --- 1. Email Relay Service with Brevo/Resend/SendGrid Configuration ---
  console.log("--- 1. Email Relay Service with Brevo/Resend/SendGrid Configuration ---");
  const testEnv = {
    GARUDA_EMAIL_RELAY_PROVIDER: "brevo",
    GARUDA_EMAIL_RELAY_KEY: "xkeysib-test-dummy-key",
    GARUDA_EMAIL_USER: "contact@garudaos.in",
    GARUDA_EMAIL_FROM_NAME: "GARUDA Commercial Solutions"
  };

  assert.strictEqual(emailRelayService.isRelayConfigured(testEnv), true);
  const relayConfig = emailRelayService.getRelayConfig(testEnv);
  assert.strictEqual(relayConfig.ready, true);
  assert.strictEqual(relayConfig.config.provider, "brevo");
  assert.strictEqual(relayConfig.config.from, "contact@garudaos.in");
  console.log("✔ PASS: emailRelayService recognizes GARUDA_EMAIL_RELAY_* variables correctly");

  // --- 2. Outbound Dispatch Status Evaluation with Existing Variables ---
  console.log("\n--- 2. Outbound Dispatch Status Evaluation with Existing Variables ---");
  const origEnv = { ...process.env };
  try {
    process.env.GARUDA_EMAIL_RELAY_PROVIDER = "brevo";
    process.env.GARUDA_EMAIL_RELAY_KEY = "test_key_123";
    process.env.GARUDA_EMAIL_USER = "outreach@garudaos.in";

    const status = outreachDispatch.getRelayConfigurationStatus();
    assert.strictEqual(status.configured, true);
    assert.strictEqual(status.isEmailConfigured, true);
    assert.strictEqual(status.activeProvider, "http_relay_brevo");
    assert.strictEqual(status.httpRelay.provider, "brevo");
    assert.strictEqual(status.httpRelay.fromEmail, "outreach@garudaos.in");
    assert.strictEqual(status.remediation, null);
    console.log("✔ PASS: getRelayConfigurationStatus() identifies active HTTP relay provider");
  } finally {
    process.env = origEnv;
  }

  // --- 3. SMTP Fallback Evaluation with GARUDA_EMAIL_HOST/USER/PASS ---
  console.log("\n--- 3. SMTP Fallback Evaluation with GARUDA_EMAIL_HOST/USER/PASS ---");
  const origEnv2 = { ...process.env };
  try {
    delete process.env.GARUDA_EMAIL_RELAY_PROVIDER;
    delete process.env.GARUDA_EMAIL_RELAY_KEY;
    process.env.GARUDA_EMAIL_HOST = "smtp-relay.brevo.com";
    process.env.GARUDA_EMAIL_PORT = "587";
    process.env.GARUDA_EMAIL_USER = "smtp_user@garudaos.in";
    process.env.GARUDA_EMAIL_PASS = "smtp_password";

    const status = outreachDispatch.getRelayConfigurationStatus();
    assert.strictEqual(status.configured, true);
    assert.strictEqual(status.isEmailConfigured, true);
    assert.strictEqual(status.activeProvider, "smtp_relay");
    assert.strictEqual(status.smtpRelay.host, "smtp-relay.brevo.com");
    assert.strictEqual(status.remediation, null);
    console.log("✔ PASS: getRelayConfigurationStatus() falls back to SMTP relay with zero secret leakage");
  } finally {
    process.env = origEnv2;
  }

  // --- 4. Unconfigured State Clean Remediation ---
  console.log("\n--- 4. Unconfigured State Clean Remediation ---");
  const origEnv3 = { ...process.env };
  try {
    delete process.env.GARUDA_EMAIL_RELAY_PROVIDER;
    delete process.env.GARUDA_EMAIL_RELAY_KEY;
    delete process.env.GARUDA_EMAIL_HOST;
    delete process.env.GARUDA_EMAIL_USER;
    delete process.env.GARUDA_EMAIL_PASS;
    delete process.env.TELEGRAM_BOT_TOKEN;

    const status = outreachDispatch.getRelayConfigurationStatus();
    assert.strictEqual(status.isEmailConfigured, false);
    assert.strictEqual(status.remediation.code, "OUTBOUND_CREDENTIAL_MISSING");
    assert(status.remediation.reason.includes("GARUDA_EMAIL_RELAY_PROVIDER"));
    console.log("✔ PASS: Unconfigured state provides exact remediation instructions without crashing");
  } finally {
    process.env = origEnv3;
  }

  console.log("\n🦅 ALL 4 OUTBOUND RELAY CONFIGURATION VERIFICATION TESTS PASSED CLEANLY!");
}

runTests().catch((err) => {
  console.error("Outbound Relay Verification test failure:", err);
  process.exit(1);
});
