const crypto = require("crypto");

const MAX_ATTEMPTS = 3;
const DEFAULT_TIMEOUT_MS = 8000;

function fail(message, statusCode = 400) { throw Object.assign(new Error(message), { statusCode }); }
function configured(env = process.env) {
  const enabled = env.GARUDA_WEBHOOK_ENABLED === "true";
  const endpoint = String(env.GARUDA_WEBHOOK_ENDPOINT || "");
  const secretPresent = Boolean(env.GARUDA_WEBHOOK_SECRET);
  let endpointValid = false;
  try { endpointValid = new URL(endpoint).protocol === "https:"; } catch (_) {}
  return { enabled: enabled && endpointValid && secretPresent, requested: enabled, endpointValid, secretPresent };
}
function sign(body, secret, timestamp) {
  return crypto.createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}
function receiptValid(receipt, requestHash) {
  return Boolean(receipt && receipt.accepted === true && receipt.requestHash === requestHash && typeof receipt.providerReference === "string" && receipt.providerReference.length > 0);
}
async function send(validation, options = {}) {
  const env = options.env || process.env;
  const health = configured(env);
  if (!health.enabled) fail("Production webhook is disabled or incompletely configured", 503);
  const transport = options.transport || global.fetch;
  if (typeof transport !== "function") fail("Webhook transport is unavailable", 503);
  const body = JSON.stringify(validation.payload);
  const timestamp = new Date(options.now || Date.now()).toISOString();
  const timeoutMs = Math.max(250, Math.min(Number(env.GARUDA_WEBHOOK_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS, 30000));
  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await transport(env.GARUDA_WEBHOOK_ENDPOINT, { method: "POST", signal: controller.signal, headers: { "content-type": "application/json", "x-garuda-timestamp": timestamp, "x-garuda-signature": sign(body, env.GARUDA_WEBHOOK_SECRET, timestamp), "idempotency-key": validation.idempotencyKey }, body });
      if (!response.ok) throw new Error(`Provider returned HTTP ${response.status}`);
      const receipt = await response.json();
      if (!receiptValid(receipt, validation.requestHash)) fail("Provider receipt verification failed", 502);
      return { ...receipt, attempts: attempt, simulated: false, verified: true, receivedAt: new Date().toISOString() };
    } catch (error) { lastError = error; }
    finally { clearTimeout(timer); }
  }
  fail(`Webhook dispatch failed after ${MAX_ATTEMPTS} attempts: ${lastError?.message || "unknown error"}`, 502);
}

module.exports = { MAX_ATTEMPTS, configured, receiptValid, send, sign };
