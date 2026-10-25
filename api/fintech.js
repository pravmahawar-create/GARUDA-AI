/**
 * 🦅 GARUDA OS — VERCEL SERVERLESS FINTECH ORCHESTRATION API
 * Serverless Handler for Sovereign Multi-Rail Treasury, Virtual Accounts, and Webhook Telemetry.
 * Zero-Custody Invariant: Funds clear directly to corporate beneficiary bank accounts ($0.00 GARUDA custody).
 */

const { defaultOrchestrationService } = require("../src/fintech/orchestrationService");
const { defaultFeeEngine } = require("../src/fintech/feeEngine");
const { defaultAuditLogger } = require("../src/fintech/auditLogger");
const { defaultObservability, redactSecrets } = require("../src/fintech/observability");
const { checkAllProvidersHealth, listProviders } = require("../src/fintech/adapters");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Parse path & parameters
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathParts = url.pathname.replace(/^\/api\/fintech\/?/, "").split("/").filter(Boolean);
  const resource = pathParts[0] || (req.query && req.query.resource) || "health";
  const subAction = pathParts[1];

  try {
    // 1. POST /api/fintech/payments/create or ?resource=createPayment
    if (req.method === "POST" && (resource === "payments" && subAction === "create" || resource === "createPayment")) {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      const intent = await defaultOrchestrationService.createPaymentIntent({
        merchantId: body.merchantId || "MERCHANT-ENTERPRISE-01",
        merchantLegalName: body.merchantLegalName || "Enterprise Corporate Client",
        destinationBankIban: body.destinationBankIban || "IN-YESB-000492817294",
        amount: Number(body.amount) || 500000,
        currency: body.currency || "USD",
        originCountry: body.originCountry || "IN",
        destinationCountry: body.destinationCountry || "IN",
        selectedRail: body.selectedRail || "in",
        preferredProvider: body.preferredProvider || "mock_bank",
        idempotencyKey: body.idempotencyKey || `IDEMP-${Date.now()}`
      });

      return res.status(201).json({
        success: true,
        data: redactSecrets(intent)
      });
    }

    // 2. POST /api/fintech/payments/instructions or ?resource=instructions
    if (req.method === "POST" && (resource === "payments" && subAction === "instructions" || resource === "instructions")) {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      const instructions = await defaultOrchestrationService.provisionPaymentInstructions(body.intentId);
      return res.status(200).json({
        success: true,
        data: redactSecrets(instructions)
      });
    }

    // 3. POST /api/fintech/webhooks/:provider_id or ?resource=webhook
    if (req.method === "POST" && (resource === "webhooks" || resource === "webhook")) {
      const providerId = subAction || "mock_bank";
      const rawPayload = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
      const signature = req.headers["x-provider-signature"] || req.headers["x-mock-signature"] || "";
      const timestamp = req.headers["x-timestamp"] || "";
      const nonce = req.headers["x-nonce"] || "";

      const result = await defaultOrchestrationService.handleProviderWebhook(
        providerId,
        rawPayload,
        signature,
        timestamp,
        nonce
      );

      return res.status(200).json({
        success: true,
        data: redactSecrets(result)
      });
    }

    // 4. GET /api/fintech/treasury/metrics or ?resource=metrics
    if (req.method === "GET" && (resource === "treasury" && subAction === "metrics" || resource === "metrics")) {
      const metrics = defaultObservability.getMetrics();
      const providers = listProviders();
      return res.status(200).json({
        success: true,
        data: {
          metrics,
          providers,
          zeroCustodyEnforced: true,
          custodyBalanceUSD: 0,
          timestamp: new Date().toISOString()
        }
      });
    }

    // 5. GET /api/fintech/fees/estimate or ?resource=fees
    if (req.method === "GET" && (resource === "fees" || resource === "fees/estimate")) {
      const amount = Number(req.query.amount) || 500000;
      const rail = req.query.rail || "in";
      const estimate = defaultFeeEngine.estimateFee({
        amount,
        currency: req.query.currency || "USD",
        selectedRail: rail
      });
      return res.status(200).json({ success: true, data: estimate });
    }

    // 6. Default Health Check
    const health = await checkAllProvidersHealth();
    return res.status(200).json({
      success: true,
      service: "GARUDA OS Sovereign Fintech Engine",
      status: "OPERATIONAL",
      zeroCustody: true,
      custodyBalance: "$0.00",
      providers: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      error: error.message
    });
  }
};
