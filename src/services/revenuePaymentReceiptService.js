const crypto = require("crypto");

function fail(message, statusCode = 400) {
  throw Object.assign(new Error(message), { statusCode });
}

function text(value, name, max = 300, required = true) {
  const result = String(value || "").trim();
  if (required && !result) fail(`${name} is required`);
  if (result.length > max) fail(`${name} exceeds ${max} characters`);
  return result;
}

function hash(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function parseCurrencies(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter((item) => /^[A-Z]{3}$/.test(item));
}

function accountReadiness(env = process.env) {
  const provider = String(env.GARUDA_PAYMENT_PROVIDER || "").trim().toLowerCase();
  const accountReference = String(env.GARUDA_PAYMENT_ACCOUNT_REFERENCE || "").trim();
  const supportedCurrencies = parseCurrencies(env.GARUDA_PAYMENT_SUPPORTED_CURRENCIES);
  const checks = {
    providerConfigured: Boolean(provider),
    accountReferenceConfigured: Boolean(accountReference),
    providerKycVerified: env.GARUDA_PAYMENT_KYC_VERIFIED === "true",
    eligibleAccountHolderConfirmed: env.GARUDA_PAYMENT_ACCOUNT_HOLDER_ELIGIBLE === "true",
    payoutsEnabledByProvider: env.GARUDA_PAYMENT_PAYOUTS_ENABLED === "true",
    supportedCurrenciesConfigured: supportedCurrencies.length > 0,
    signedWebhookConfigured: String(env.GARUDA_PAYMENT_WEBHOOK_SECRET || "").length >= 16
  };
  const ready = Object.values(checks).every(Boolean);
  return {
    ready,
    provider: provider || null,
    accountReferenceHash: accountReference ? hash(accountReference) : null,
    supportedCurrencies,
    checks,
    livePaymentInitiationEnabled: false,
    rawKycDataStored: false,
    truth: ready
      ? "An eligible provider account is configured for signed receipt verification. GARUDA still cannot initiate or move money."
      : "Payment receipt verification remains locked until an eligible account, provider KYC, payouts, currencies, and signed webhook are configured."
  };
}

function safeEqualHex(provided, expected) {
  const left = String(provided || "").toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(left) || left.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(expected, "hex"));
}

function verifySignedWebhook(rawBody, signature, env = process.env, now = new Date()) {
  const readiness = accountReadiness(env);
  if (!readiness.ready) fail("Eligible payment account is not ready for signed receipt verification", 503);
  if (typeof rawBody !== "string" || !rawBody.trim()) fail("Raw payment webhook body is required");
  const expected = crypto.createHmac("sha256", env.GARUDA_PAYMENT_WEBHOOK_SECRET).update(rawBody).digest("hex");
  if (!safeEqualHex(signature, expected)) fail("Invalid payment provider webhook signature", 401);

  let event;
  try { event = JSON.parse(rawBody); } catch (_) { fail("Payment webhook body must be valid JSON"); }
  if (event.event !== "payment.received") fail("Only payment.received events can verify revenue", 409);
  if (!event.payment || typeof event.payment !== "object") fail("payment payload is required");
  const payment = event.payment;
  const provider = text(event.provider, "provider", 80).toLowerCase();
  if (provider !== readiness.provider) fail("Payment provider does not match the configured eligible account", 409);
  const accountReference = text(event.accountReference, "accountReference", 300);
  if (hash(accountReference) !== readiness.accountReferenceHash) fail("Payment account reference does not match the configured eligible account", 409);
  const amount = Number(payment.amount);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000000) fail("payment.amount is outside the supported range");
  const currency = text(payment.currency, "payment.currency", 3).toUpperCase();
  if (!readiness.supportedCurrencies.includes(currency)) fail("Payment currency is not enabled for the configured account", 409);
  if (!["captured", "paid"].includes(String(payment.status || "").toLowerCase())) fail("Payment is not captured or paid", 409);
  const receivedAt = new Date(payment.receivedAt);
  if (Number.isNaN(receivedAt.getTime()) || receivedAt.getTime() > new Date(now).getTime() + 5 * 60 * 1000) fail("payment.receivedAt is invalid");

  const eventId = text(event.eventId, "eventId", 200);
  const missionId = text(event.missionId, "missionId", 100);
  const providerReference = text(payment.providerReference, "payment.providerReference", 300);
  const payloadHash = hash(rawBody);
  return {
    verified: true,
    verificationMethod: "signed_provider_webhook",
    eventId,
    eventKey: hash(`${provider}:${eventId}`),
    missionId,
    provider,
    accountReferenceHash: readiness.accountReferenceHash,
    providerReference,
    amount: Math.round(amount * 100) / 100,
    currency,
    receivedAt: receivedAt.toISOString(),
    payloadHash,
    signatureHash: hash(String(signature).toLowerCase()),
    verifiedAt: new Date(now).toISOString(),
    livePaymentInitiatedByGaruda: false
  };
}

module.exports = { accountReadiness, hash, parseCurrencies, safeEqualHex, verifySignedWebhook };
