const assert = require("assert");

const relay = require("./emailRelayService");

let passed = 0;
let failed = 0;
function test(name, fn) {
  Promise.resolve()
    .then(fn)
    .then(() => {
      passed += 1;
      console.log(`  ok  ${name}`);
    })
    .catch((error) => {
      failed += 1;
      console.log(`  xx  ${name}: ${error.message}`);
    });
}

async function main() {
  test("unconfigured relay is not ready", () => {
    assert.strictEqual(relay.isRelayConfigured({}), false);
    const cfg = relay.getRelayConfig({});
    assert.strictEqual(cfg.ready, false);
  });

  test("brevo config detected from env", () => {
    const cfg = relay.getRelayConfig({
      GARUDA_EMAIL_RELAY_PROVIDER: "brevo",
      GARUDA_EMAIL_RELAY_KEY: "x-api-key",
      GARUDA_EMAIL_USER: "garudaos.ai@gmail.com"
    });
    assert.strictEqual(cfg.ready, true);
    assert.strictEqual(cfg.config.provider, "brevo");
    assert.strictEqual(cfg.config.from, "garudaos.ai@gmail.com");
  });

  test("invalid provider rejected", () => {
    const cfg = relay.getRelayConfig({
      GARUDA_EMAIL_RELAY_PROVIDER: "mailchimp",
      GARUDA_EMAIL_RELAY_KEY: "x"
    });
    assert.strictEqual(cfg.ready, false);
  });

  test("sendViaRelay returns accepted result (mocked fetch)", async () => {
    const originalFetch = global.fetch;
    global.fetch = async (url, opts) => {
      assert.strictEqual(url, "https://api.brevo.com/v3/smtp/email");
      assert.ok(opts.headers["api-key"], "api-key header");
      const body = JSON.parse(opts.body);
      assert.strictEqual(body.to[0].email, "test@example.com");
      assert.strictEqual(body.subject, "Hello");
      assert.ok(body.textContent.includes("body"));
      return { ok: true, status: 201, json: async () => ({ messageId: "msg_123" }) };
    };
    try {
      const cfg = relay.getRelayConfig({
        GARUDA_EMAIL_RELAY_PROVIDER: "brevo",
        GARUDA_EMAIL_RELAY_KEY: "x-api-key",
        GARUDA_EMAIL_USER: "garudaos.ai@gmail.com"
      });
      const result = await relay.sendViaRelay(cfg.config, {
        to: "test@example.com",
        subject: "Hello",
        body: "body"
      });
      assert.strictEqual(result.accepted, true);
      assert.strictEqual(result.providerResponseId, "msg_123");
      assert.strictEqual(result.relayProvider, "brevo");
    } finally {
      global.fetch = originalFetch;
    }
  });

  test("sendViaRelay surfaces HTTP errors", async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => ({ ok: false, status: 401, json: async () => ({ message: "Unauthorized" }) });
    try {
      const cfg = relay.getRelayConfig({
        GARUDA_EMAIL_RELAY_PROVIDER: "brevo",
        GARUDA_EMAIL_RELAY_KEY: "bad",
        GARUDA_EMAIL_USER: "garudaos.ai@gmail.com"
      });
      await assert.rejects(() => relay.sendViaRelay(cfg.config, { to: "a@b.com", subject: "s", body: "b" }), /401/);
    } finally {
      global.fetch = originalFetch;
    }
  });

  test("resend config maps to resend endpoint", async () => {
    const originalFetch = global.fetch;
    let capturedUrl = null;
    global.fetch = async (url) => {
      capturedUrl = url;
      return { ok: true, status: 200, json: async () => ({ id: "re_abc" }) };
    };
    try {
      const cfg = relay.getRelayConfig({
        GARUDA_EMAIL_RELAY_PROVIDER: "resend",
        GARUDA_EMAIL_RELAY_KEY: "re_key",
        GARUDA_EMAIL_USER: "garudaos.ai@gmail.com"
      });
      const result = await relay.sendViaRelay(cfg.config, { to: "a@b.com", subject: "s", body: "b" });
      assert.strictEqual(capturedUrl, "https://api.resend.com/emails");
      assert.strictEqual(result.providerResponseId, "re_abc");
    } finally {
      global.fetch = originalFetch;
    }
  });

  setTimeout(() => {
    console.log(`\nemailRelayService.test: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
  }, 100);
}

main();