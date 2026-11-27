/**
 * 🦅 GARUDA OS — VERCEL SERVERLESS FINTECH ORCHESTRATION API
 * Serverless Handler for Sovereign Multi-Rail Treasury, Virtual Accounts, and Webhook Telemetry.
 * Zero-Custody Invariant: Funds clear directly to corporate beneficiary bank accounts ($0.00 GARUDA custody).
 * Preserves fail-closed webhook security and tenant isolation.
 */

const { defaultOrchestrationService } = require("../src/fintech/orchestrationService");
const { defaultFeeEngine } = require("../src/fintech/feeEngine");
const { defaultObservability, redactSecrets } = require("../src/fintech/observability");
const { checkAllProvidersHealth, listProviders } = require("../src/fintech/adapters");
const authContextService = require("../src/services/authContextService");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-API-Key, X-Founder-Key"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathParts = url.pathname.replace(/^\/api\/fintech\/?/, "").split("/").filter(Boolean);
  const resource = pathParts[0] || (req.query && req.query.resource) || "health";
  const subAction = pathParts[1];

  try {
    // Public read-only Fee Estimate (default 2.00% / 200 bps)
    if (req.method === "GET" && (resource === "fees" || resource === "fees/estimate")) {
      const amount = Number(req.query.amount) || 500000;
      const rail = req.query.rail || "RTGS";
      const estimate = defaultFeeEngine.calculateFees({
        amount,
        currency: req.query.currency || "INR",
        clearingRail: rail
      });
      return res.status(200).json({ success: true, data: estimate });
    }

    // Cryptographically authenticated Bank Settlement Webhooks (fail-closed if secret unconfigured)
    if (req.method === "POST" && (resource === "webhooks" || resource === "webhook")) {
      const providerId = subAction || "mock_sovereign_bank";
      const rawPayload = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
      const signatureHeader = req.headers["x-webhook-signature"] || req.headers["x-signature"] || "";
      const nonce = req.headers["x-webhook-id"] || req.headers["x-event-id"] || req.headers["x-nonce"] || "";
      const secretKey = process.env.FINTECH_WEBHOOK_SECRET || null;
      const eventPayload = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});

      const result = await defaultOrchestrationService.handleBankWebhook(providerId, {
        rawPayload,
        signatureHeader,
        secretKey,
        nonce,
        eventPayload
      });

      return res.status(200).json({
        success: true,
        data: redactSecrets(result)
      });
    }

    // Default Health Check (public sanitized diagnostics)
    if (req.method === "GET" && (resource === "health" || pathParts.length === 0)) {
      const health = await checkAllProvidersHealth();
      return res.status(200).json({
        success: true,
        service: "GARUDA OS Sovereign Fintech Engine",
        status: "OPERATIONAL",
        zeroCustody: true,
        custodyBalance: "$0.00",
        defaultCommercialRateBps: 200,
        providers: redactSecrets(health),
        timestamp: new Date().toISOString()
      });
    }

    // All remaining routes require verified tenant or founder context
    const context = await authContextService.resolveRequestContext(req);
    if (!context || context.actorType === "anonymous") {
      return res.status(401).json({
        success: false,
        error: "AUTHENTICATION_REQUIRED",
        message: "Verified tenant or founder credentials required for fintech orchestration operations."
      });
    }

    // POST /api/fintech/payments/create
    if (req.method === "POST" && ((resource === "payments" && subAction === "create") || resource === "createPayment")) {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      const intent = await defaultOrchestrationService.createPaymentIntent({
        tenantId: context.tenantId,
        merchantId: body.merchantId || "MERCHANT-ENTERPRISE-01",
        merchantLegalName: body.merchantLegalName || "Enterprise Corporate Client",
        destinationBankIban: body.destinationBankIban || "IN-YESB-000492817294",
        amount: Number(body.amount) || 500000,
        currency: body.currency || "INR",
        originCountry: body.originCountry || "IN",
        destinationCountry: body.destinationCountry || "IN",
        selectedRail: body.selectedRail || "RTGS",
        preferredProvider: body.preferredProvider || "mock_sovereign_bank",
        idempotencyKey: body.idempotencyKey || `IDEMP-${Date.now()}`
      });

      return res.status(201).json({
        success: true,
        data: redactSecrets(intent)
      });
    }

    // POST /api/fintech/payments/instructions
    if (req.method === "POST" && ((resource === "payments" && subAction === "instructions") || resource === "instructions")) {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      const instructions = await defaultOrchestrationService.provisionPaymentInstructions(body.intentId, context.tenantId);
      return res.status(200).json({
        success: true,
        data: redactSecrets(instructions)
      });
    }

    // GET /api/fintech/treasury/metrics
    if (req.method === "GET" && ((resource === "treasury" && subAction === "metrics") || resource === "metrics")) {
      const metrics = defaultObservability.getMetrics();
      const providers = listProviders();
      return res.status(200).json({
        success: true,
        data: redactSecrets({
          metrics,
          providers,
          zeroCustodyEnforced: true,
          custodyBalanceUSD: 0,
          timestamp: new Date().toISOString()
        })
      });
    }

    return res.status(404).json({ success: false, error: "FINTECH_ENDPOINT_NOT_FOUND" });
  } catch (error) {
    return res.status(error.httpStatus || error.statusCode || 400).json({
      success: false,
      error: error.message,
      errorCode: error.errorCode || "FINTECH_REQUEST_ERROR"
    });
  }
};
