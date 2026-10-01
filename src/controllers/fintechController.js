/**
 * 🦅 GARUDA OS — FINTECH ORCHESTRATION CONTROLLER
 * REST Endpoints for Sovereign Multi-Rail Payments & Treasury
 * Spec: GARUDA-FINTECH-SPEC-V2.0 Section 15 & 26
 * Controlled Pilot Mandate: Observability, Provider Health, Alerting & Secret Redaction
 */

const { defaultOrchestrationService } = require("../fintech/orchestrationService");
const { defaultFeeEngine } = require("../fintech/feeEngine");
const { defaultAuditLogger } = require("../fintech/auditLogger");
const { listProviders, checkAllProvidersHealth } = require("../fintech/adapters");
const { defaultObservability, redactSecrets } = require("../fintech/observability");

async function createPayment(req, res) {
  try {
    const {
      merchantId,
      merchantLegalName,
      destinationBankIban,
      amount,
      currency,
      originCountry,
      destinationCountry,
      selectedRail,
      preferredProvider,
      idempotencyKey
    } = req.body;

    const intent = await defaultOrchestrationService.createPaymentIntent({
      merchantId,
      merchantLegalName,
      destinationBankIban,
      amount,
      currency,
      originCountry,
      destinationCountry,
      selectedRail,
      preferredProvider,
      idempotencyKey
    });

    res.status(201).json({
      success: true,
      data: redactSecrets(intent)
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

async function getPaymentInstructions(req, res) {
  try {
    const { intentId } = req.body;
    const instructions = await defaultOrchestrationService.provisionPaymentInstructions(intentId);
    res.json({
      success: true,
      data: redactSecrets(instructions)
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

async function getPayment(req, res) {
  const intent = defaultOrchestrationService.getPaymentIntent(req.params.id);
  if (!intent) {
    return res.status(404).json({ success: false, error: "Payment intent not found" });
  }
  res.json({
    success: true,
    data: redactSecrets(intent)
  });
}

async function estimateFees(req, res) {
  try {
    const { amount, currency, clearingRail } = req.query;
    const breakdown = defaultFeeEngine.calculateFees({
      amount: Number(amount || 100000),
      currency: String(currency || "USD"),
      clearingRail: String(clearingRail || "FEDWIRE")
    });
    res.json({
      success: true,
      data: breakdown
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

async function handleWebhook(req, res) {
  try {
    const providerId = req.params.provider_id;
    const rawPayload = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    const signatureHeader = req.headers["x-webhook-signature"] || req.headers["x-signature"] || "";
    const secretKey = process.env.FINTECH_WEBHOOK_SECRET || "default_test_secret_key_garuda_2026";
    const nonce = req.headers["x-webhook-id"] || req.headers["x-event-id"] || null;

    let eventPayload = req.body;
    if (typeof eventPayload === "string") {
      eventPayload = JSON.parse(eventPayload);
    }

    const result = await defaultOrchestrationService.handleBankWebhook(providerId, {
      rawPayload,
      signatureHeader,
      secretKey,
      nonce,
      eventPayload
    });

    res.json(redactSecrets(result));
  } catch (error) {
    const statusCode = error.httpStatus || 400;
    res.status(statusCode).json({
      success: false,
      error: error.message,
      errorCode: error.errorCode || "WEBHOOK_FAILED"
    });
  }
}

async function getAuditLogs(req, res) {
  const logs = defaultAuditLogger.getLogs(req.params.id);
  res.json({
    success: true,
    data: redactSecrets(logs)
  });
}

async function getProviders(req, res) {
  res.json({
    success: true,
    data: redactSecrets(listProviders())
  });
}

async function getProvidersHealth(req, res) {
  try {
    const healthData = await checkAllProvidersHealth();
    res.json({
      success: true,
      data: redactSecrets(healthData)
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
}

async function getTreasuryMetrics(req, res) {
  res.json({
    success: true,
    data: redactSecrets(defaultObservability.getMetrics())
  });
}

async function getTreasuryAlerts(req, res) {
  const severity = req.query.severity || null;
  res.json({
    success: true,
    data: redactSecrets(defaultObservability.getAlerts(severity))
  });
}

async function acknowledgeAlert(req, res) {
  const success = defaultObservability.acknowledgeAlert(req.params.id);
  res.json({
    success,
    alertId: req.params.id
  });
}

module.exports = {
  createPayment,
  getPaymentInstructions,
  getPayment,
  estimateFees,
  handleWebhook,
  getAuditLogs,
  getProviders,
  getProvidersHealth,
  getTreasuryMetrics,
  getTreasuryAlerts,
  acknowledgeAlert
};
