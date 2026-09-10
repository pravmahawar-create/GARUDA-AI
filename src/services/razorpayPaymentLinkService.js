const crypto = require("crypto");
const mongoose = require("mongoose");

const { RevenueExecutionMission } = require("../models/RevenueExecutionMission");
const { RevenueWorkIntake } = require("../models/RevenueWorkIntake");
const { DiscoveryCandidate } = require("../models/DiscoveryCandidate");
const settlementFeeConfigService = require("./settlementFeeConfigService");

function fail(message, statusCode = 400) {
  throw Object.assign(new Error(message), { statusCode });
}

function hash(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function getProviderConfig(env = process.env) {
  const liveEnabled = String(env.RAZORPAY_LIVE_ENABLED || "").toLowerCase() === "true";
  const keyId = liveEnabled ? env.RAZORPAY_KEY_ID_LIVE : env.RAZORPAY_KEY_ID_TEST;
  const keySecret = liveEnabled ? env.RAZORPAY_KEY_SECRET_LIVE : env.RAZORPAY_KEY_SECRET_TEST;
  const webhookSecret = liveEnabled ? env.RAZORPAY_WEBHOOK_SECRET_LIVE : env.RAZORPAY_WEBHOOK_SECRET_TEST;
  const feeRatePercent = settlementFeeConfigService.getProviderFeeRate("razorpay", env);

  const MIN_WEBHOOK_SECRET_LENGTH = 12;
  const configured = Boolean(keyId && keySecret && String(webhookSecret || "").length >= MIN_WEBHOOK_SECRET_LENGTH);
  return {
    mode: liveEnabled ? "live" : "test",
    liveEnabled,
    keyId,
    keySecret,
    webhookSecret,
    feeRatePercent,
    configured,
    ready: configured && /^rzp_(live|test)_/.test(String(keyId || ""))
  };
}

function buildIdempotencyKey(input) {
  return hash({
    missionId: input.missionId,
    candidateId: input.candidateId,
    amount: Number(input.amount),
    currency: String(input.currency || "INR").toUpperCase()
  });
}

function buildPaymentLinkPayload(input, config) {
  const MAX_AMOUNT_PAISE = 100000 * 100; // 1 lakh INR upper bound to prevent overflow/fraud
  const amountPaise = Math.round(Number(input.amount) * 100);
  if (!Number.isSafeInteger(amountPaise) || amountPaise < 100 || amountPaise > MAX_AMOUNT_PAISE) {
    fail(`amount must be between 1.00 and 100000.00 (got ${input.amount})`);
  }
  const currency = String(input.currency || "INR").toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) fail("currency must be a valid 3-letter ISO code");
  if (!input.missionId || !mongoose.Types.ObjectId.isValid(String(input.missionId))) fail("Invalid missionId");
  if (!input.candidateId || !mongoose.Types.ObjectId.isValid(String(input.candidateId))) fail("Invalid candidateId");

  const referenceId = `${String(input.missionId)}:${String(input.candidateId)}`;

  return {
    amount: amountPaise,
    currency,
    reference_id: referenceId,
    description: String(input.description || "GARUDA service payment").slice(0, 255),
    notes: {
      missionId: String(input.missionId),
      candidateId: String(input.candidateId),
      garudaReference: hash({ missionId: input.missionId, candidateId: input.candidateId, amount: amountPaise })
    },
    callback_method: "get",
    callback_url: String(input.callbackUrl || process.env.RAZORPAY_CALLBACK_URL || "").trim() || undefined,
    customer: input.customer && typeof input.customer === "object"
      ? {
          name: String(input.customer.name || "GARUDA Client").slice(0, 120),
          email: String(input.customer.email || "").slice(0, 120),
          contact: String(input.customer.contact || "").slice(0, 15)
        }
      : undefined
  };
}

async function requireMissionContext(missionId, candidateId) {
  const mission = await RevenueExecutionMission.findById(missionId).lean();
  if (!mission) fail("Execution mission not found", 404);
  if (mission.candidateId && String(mission.candidateId) !== String(candidateId)) {
    fail("candidateId does not match the mission", 409);
  }
  return mission;
}

async function dispatchPaymentLinkRequest(payload, config, options = {}) {
  const transport = options.transport || global.fetch;
  if (typeof transport !== "function") fail("Payment link transport is unavailable", 503);
  const endpoint = "https://api.razorpay.com/v1/payment_links";
  const auth = Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64");
  const timeoutMs = Math.max(2000, Math.min(Number(options.timeoutMs || process.env.RAZORPAY_API_TIMEOUT_MS || 15000), 30000));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await transport(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        authorization: `Basic ${auth}`,
        "idempotency-key": payload.idempotencyKey
      },
      body: JSON.stringify(payload.body)
    });
    if (!response.ok) {
      const text = await response.text();
      fail(`Razorpay payment link creation failed with HTTP ${response.status}: ${text.slice(0, 300)}`, 502);
    }
    return await response.json();
  } catch (error) {
    if (error && error.statusCode) throw error;
    fail(`Razorpay payment link request failed: ${error.message}`, 502);
  } finally {
    clearTimeout(timer);
  }
}

async function generatePaymentLink(input = {}, options = {}) {
  const env = options.env || process.env;
  const config = getProviderConfig(env);
  if (!config.ready) fail("Razorpay credentials are not configured for payment link generation", 503);

  await requireMissionContext(input.missionId, input.candidateId);

  const idempotencyKey = buildIdempotencyKey(input);
  const body = buildPaymentLinkPayload(input, config);
  const payload = { idempotencyKey, body };

  const response = await dispatchPaymentLinkRequest(payload, config, options);

  const paymentUrl = String(response.short_url || response.url || "");
  if (!paymentUrl) fail("Razorpay response did not include a payment URL", 502);

  return {
    mode: config.mode,
    paymentUrl,
    paymentId: String(response.id || ""),
    referenceId: String(response.reference_id || ""),
    amountPaise: Number(response.amount || body.amount),
    amount: Number(response.amount || body.amount) / 100,
    currency: String(response.currency || body.currency || "INR"),
    description: String(response.description || body.description || ""),
    status: String(response.status || "created"),
    createdAt: response.created_at ? new Date(response.created_at * 1000).toISOString() : new Date().toISOString(),
    idempotencyKey,
    notes: response.notes || body.notes || {},
    governance: {
      founderApprovalRequired: false,
      livePaymentsEnabled: config.liveEnabled,
      externalSideEffectPerformed: true
    }
  };
}

function verifyWebhookSignature(rawBody, signature, env = process.env) {
  const config = getProviderConfig(env);
  const { verifyRazorpayHmac } = require("../utils/verifyRazorpayHmac");
  verifyRazorpayHmac(rawBody, signature, config.webhookSecret);
  return { verified: true, mode: config.mode };
}

async function fetchPaymentLinkStatus(linkId, options = {}) {
  const env = options.env || process.env;
  const config = getProviderConfig(env);
  if (!config.ready || !linkId) return null;

  const transport = options.transport || global.fetch;
  if (typeof transport !== "function") return null;

  const endpoint = `https://api.razorpay.com/v1/payment_links/${encodeURIComponent(String(linkId))}`;
  const auth = Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await transport(endpoint, {
      method: "GET",
      signal: controller.signal,
      headers: { authorization: `Basic ${auth}` }
    });
    if (!response.ok) { console.warn("[razorpay] fetchPaymentLinkStatus HTTP", response.status); return { status: "unknown", error: `HTTP ${response.status}` }; }
    const body = await response.json();
    return {
      status: String(body.status || "created"),
      paymentId: String(body.id || ""),
      amount: Number(body.amount || 0) / 100,
      currency: String(body.currency || "INR")
    };
  } catch (err) { console.warn("[razorpay] fetchPaymentLinkStatus failed:", String(err.message).slice(0,120)); return { status: "unknown", error: String(err.message).slice(0,120) };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = {
  buildIdempotencyKey,
  buildPaymentLinkPayload,
  dispatchPaymentLinkRequest,
  fetchPaymentLinkStatus,
  generatePaymentLink,
  getProviderConfig,
  verifyWebhookSignature
};