/**
 * 🦅 GARUDA OS — FINTECH ORCHESTRATION CONTROLLER
 * REST Endpoints for Sovereign Multi-Rail Payments, Treasury & Part 6 Commercial Revenue Engine (2%)
 * Spec: GARUDA-FINTECH-SPEC-V2.0 Section 15 & 26 + Part 5 (#1-#2) + Part 6 (6.1-6.8)
 *
 * Security Invariants:
 * - Zero hardcoded webhook fallback secret (fail-closed if env secret absent).
 * - Preserves exact raw request bytes (req.rawBody) for HMAC-SHA256 verification.
 * - Derives tenantId strictly from verified req.garudaContext (never untrusted headers).
 * - Requires verified Platform Founder role for contract activation & rate modification.
 */

const { defaultOrchestrationService } = require("../fintech/orchestrationService");
const { defaultFeeEngine } = require("../fintech/feeEngine");
const { defaultFuelTank } = require("../fintech/fuelTankService");
const { defaultCommercialAgreementService } = require("../fintech/commercialAgreementService");
const { defaultCommissionProtectionService } = require("../fintech/commissionProtectionService");
const { defaultBankReceiptRegistry } = require("../fintech/bankReceiptVerifier");
const { defaultAuditLogger } = require("../fintech/auditLogger");
const { defaultIntegrationRegistryService } = require("../fintech/integrationRegistryService");
const { defaultFintechSimulationService } = require("../fintech/fintechSimulationService");
const { listProviders, checkAllProvidersHealth } = require("../fintech/adapters");
const { defaultObservability, redactSecrets } = require("../fintech/observability");

function resolveTenantId(req) {
  return req.garudaContext && req.garudaContext.tenantId ? String(req.garudaContext.tenantId) : null;
}

function resolveRawPayload(req) {
  if (typeof req.rawBody === "string") return req.rawBody;
  if (Buffer.isBuffer(req.body)) return req.body.toString("utf8");
  if (typeof req.body === "string") return req.body;
  return req.body ? JSON.stringify(req.body) : "";
}

function resolveWebhookSecret(providerId) {
  const id = String(providerId || "").toLowerCase();
  if (id.includes("wio") && process.env.WIO_WEBHOOK_SECRET) return process.env.WIO_WEBHOOK_SECRET;
  if (id.includes("icici") && process.env.ICICI_WEBHOOK_SECRET) return process.env.ICICI_WEBHOOK_SECRET;
  if (id.includes("modulr") && process.env.MODULR_WEBHOOK_SECRET) return process.env.MODULR_WEBHOOK_SECRET;
  return process.env.FINTECH_WEBHOOK_SECRET || null;
}

async function createPayment(req, res) {
  try {
    const tenantId = resolveTenantId(req);
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
    } = req.body || {};

    // Server-side approved agreement enforcement is unconditional (no client override flag allowed)
    const intent = await defaultOrchestrationService.createPaymentIntent({
      tenantId,
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
    res.status(error.httpStatus || 400).json({
      success: false,
      error: error.message,
      errorCode: error.errorCode || "PAYMENT_INTENT_CREATE_FAILED"
    });
  }
}

async function getPaymentInstructions(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    const { intentId } = req.body || {};
    const instructions = await defaultOrchestrationService.provisionPaymentInstructions(intentId, tenantId);
    res.json({
      success: true,
      data: redactSecrets(instructions)
    });
  } catch (error) {
    res.status(error.httpStatus || 400).json({
      success: false,
      error: error.message
    });
  }
}

async function getPayment(req, res) {
  const tenantId = resolveTenantId(req);
  const intent = defaultOrchestrationService.getPaymentIntent(req.params.id, tenantId);
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
    const { amount, currency, clearingRail, rail } = req.query;
    const breakdown = defaultFeeEngine.calculateFees({
      amount: Number(amount || 100000),
      currency: String(currency || "INR"),
      clearingRail: String(clearingRail || rail || "RTGS")
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
    // Strictly preserve raw request bytes captured prior to JSON parsing for HMAC verification
    const rawPayload =
      typeof req.rawBody === "string"
        ? req.rawBody
        : Buffer.isBuffer(req.body)
        ? req.body.toString("utf8")
        : typeof req.body === "string"
        ? req.body
        : req.body
        ? JSON.stringify(req.body)
        : "";

    const signatureHeader =
      req.headers["x-webhook-signature"] ||
      req.headers["x-wio-signature"] ||
      req.headers["x-icici-signature"] ||
      req.headers["x-modulr-signature"] ||
      req.headers["x-signature"] ||
      "";

    const secretKey = resolveWebhookSecret(providerId);
    const nonce =
      req.headers["x-webhook-id"] ||
      req.headers["x-event-id"] ||
      req.headers["x-wio-event-id"] ||
      req.headers["x-icici-reqid"] ||
      req.headers["x-modulr-event-id"] ||
      null;

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

async function getProviders(_req, res) {
  res.json({
    success: true,
    data: redactSecrets(listProviders())
  });
}

async function getProvidersHealth(_req, res) {
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

async function getTreasuryMetrics(_req, res) {
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

// ============================================================================
// PART 6: COMMERCIAL AGREEMENTS, 2% FUEL TANK (MODE A) & COMMISSION PROTECTION
// ============================================================================

async function createAgreement(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    const agreement = defaultCommercialAgreementService.createAgreement({
      tenantId,
      merchantId: req.body?.merchantId,
      merchantLegalName: req.body?.merchantLegalName,
      contractVersion: req.body?.contractVersion,
      billingMode: req.body?.billingMode,
      commissionRate: req.body?.commissionRate,
      taxRate: req.body?.taxRate,
      sacCode: req.body?.sacCode,
      terms: req.body?.terms || {},
      actor: req.garudaContext?.actorId || "TENANT_USER"
    });
    res.status(201).json({ success: true, data: redactSecrets(agreement) });
  } catch (err) {
    res.status(err.httpStatus || 400).json({ success: false, error: err.message, errorCode: err.errorCode || "AGREEMENT_CREATE_FAILED" });
  }
}

async function approveAgreement(req, res) {
  try {
    // Resolve tenant ownership strictly from stored server agreement (never req.body.tenantId)
    const existing = defaultCommercialAgreementService.getAgreementById(req.params.contractId);
    if (!existing) {
      return res.status(404).json({ success: false, error: "Agreement not found", errorCode: "AGREEMENT_NOT_FOUND" });
    }
    const agreement = defaultCommercialAgreementService.approveAgreement(req.params.contractId, {
      tenantId: existing.tenantId,
      founderApproved: true,
      approvedBy: req.garudaContext?.actorId || "founder_praveen",
      signedRef: req.body?.signedRef
    });
    res.json({ success: true, data: redactSecrets(agreement) });
  } catch (err) {
    res.status(err.httpStatus || 400).json({ success: false, error: err.message, errorCode: err.errorCode || "AGREEMENT_APPROVE_FAILED" });
  }
}

async function updateAgreementRate(req, res) {
  try {
    // Resolve tenant ownership strictly from stored server agreement (never req.body.tenantId)
    const existing = defaultCommercialAgreementService.getAgreementById(req.params.contractId);
    if (!existing) {
      return res.status(404).json({ success: false, error: "Agreement not found", errorCode: "AGREEMENT_NOT_FOUND" });
    }
    const updated = defaultCommercialAgreementService.updateCommissionRate(req.params.contractId, {
      tenantId: existing.tenantId,
      newRate: req.body?.newRate,
      newVersion: req.body?.newVersion,
      reason: req.body?.reason,
      founderContext: req.garudaContext || {}
    });
    res.json({ success: true, data: redactSecrets(updated) });
  } catch (err) {
    res.status(err.httpStatus || 403).json({ success: false, error: err.message, errorCode: err.errorCode || "RATE_UPDATE_REJECTED" });
  }
}

async function getActiveAgreement(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    const agreement = defaultCommercialAgreementService.getActiveAgreement(tenantId, req.params.merchantId);
    if (!agreement) {
      return res.status(404).json({ success: false, error: "No approved commercial agreement found for merchant" });
    }
    res.json({ success: true, data: redactSecrets(agreement) });
  } catch (err) {
    res.status(err.httpStatus || 400).json({ success: false, error: err.message });
  }
}

async function ingestVerifiedBankReceiptFeed(req, res) {
  try {
    const rawFeedPayload = resolveRawPayload(req);
    const feedSignatureHeader =
      req.headers["x-bank-feed-signature"] ||
      req.headers["x-webhook-signature"] ||
      req.headers["x-signature"] ||
      "";
    const parsed = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const receipt = defaultBankReceiptRegistry.ingestAuthenticatedReceipt({
      rawFeedPayload,
      feedSignatureHeader,
      tenantId: resolveTenantId(req) || parsed.tenantId,
      merchantId: parsed.merchantId,
      purpose: parsed.purpose,
      bankTransactionRef: parsed.bankTransactionRef,
      payerCorporateAccount: parsed.payerCorporateAccount,
      amount: parsed.amount,
      currency: parsed.currency || "INR",
      settledAt: parsed.settledAt
    });
    res.status(201).json({ success: true, data: redactSecrets(receipt) });
  } catch (err) {
    res.status(err.httpStatus || 400).json({ success: false, error: err.message, errorCode: err.errorCode || "BANK_RECEIPT_INGEST_FAILED" });
  }
}

async function topUpFuelTank(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    const { merchantId, amount, invoiceRef, bankReceiptId, bankTransactionRef, lowBalanceThreshold } = req.body || {};
    defaultCommercialAgreementService.requireActiveAgreement(tenantId, merchantId);
    const result = defaultFuelTank.topUp(merchantId, amount, {
      tenantId,
      invoiceRef,
      bankReceiptId,
      bankTransactionRef,
      lowBalanceThreshold
    });
    res.status(201).json({ success: true, data: redactSecrets(result) });
  } catch (err) {
    res.status(err.httpStatus || 400).json({ success: false, error: err.message, errorCode: err.errorCode || "FUEL_TOPUP_FAILED" });
  }
}

async function getFuelTankStatement(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    const statement = defaultFuelTank.getLedgerStatement(req.params.merchantId, tenantId);
    res.json({ success: true, data: redactSecrets(statement) });
  } catch (err) {
    res.status(err.httpStatus || 400).json({ success: false, error: err.message });
  }
}

async function accrueCommission(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    const result = defaultCommissionProtectionService.accrueCommissionFromSettlement({
      tenantId,
      ...(req.body || {})
    });
    res.status(201).json({ success: true, data: redactSecrets(result) });
  } catch (err) {
    res.status(err.httpStatus || 400).json({ success: false, error: err.message, errorCode: err.errorCode || "COMMISSION_ACCRUAL_FAILED" });
  }
}

async function recordCommissionAdjustment(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    const result = defaultCommissionProtectionService.recordRefundOrReversalAdjustment({
      tenantId,
      ...(req.body || {})
    });
    res.status(201).json({ success: true, data: redactSecrets(result) });
  } catch (err) {
    res.status(err.httpStatus || 400).json({ success: false, error: err.message, errorCode: err.errorCode || "ADJUSTMENT_FAILED" });
  }
}

async function generateDailyStatement(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    const stmt = defaultCommissionProtectionService.generateDailyStatement({
      tenantId,
      merchantId: req.body?.merchantId,
      dateKey: req.body?.dateKey
    });
    res.status(201).json({ success: true, data: redactSecrets(stmt) });
  } catch (err) {
    res.status(err.httpStatus || 400).json({ success: false, error: err.message, errorCode: err.errorCode || "STATEMENT_FAILED" });
  }
}

async function generateDailyInvoice(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    const invoice = defaultCommissionProtectionService.generateDailyInvoice({
      tenantId,
      merchantId: req.body?.merchantId,
      billingDate: req.body?.billingDate
    });
    res.status(201).json({ success: true, data: redactSecrets(invoice) });
  } catch (err) {
    res.status(err.httpStatus || 400).json({ success: false, error: err.message, errorCode: err.errorCode || "INVOICE_FAILED" });
  }
}

async function verifyInvoicePayment(req, res) {
  try {
    // Reject tenantId body overrides; resolve strictly from server-owned invoice record or authenticated tenant context
    const inv = defaultCommissionProtectionService.invoices.get(req.params.invoiceId);
    if (!inv) {
      return res.status(404).json({ success: false, error: "Invoice not found", errorCode: "INVOICE_NOT_FOUND" });
    }
    const result = defaultCommissionProtectionService.recordInvoicePayment({
      tenantId: inv.tenantId,
      invoiceId: req.params.invoiceId,
      paidAmount: req.body?.paidAmount,
      bankReceiptId: req.body?.bankReceiptId || null,
      paymentReference: req.body?.paymentReference,
      payerCorporateAccount: req.body?.payerCorporateAccount,
      verifiedBy: req.garudaContext?.actorId || "founder_praveen"
    });
    res.json({ success: true, data: redactSecrets(result) });
  } catch (err) {
    res.status(err.httpStatus || 400).json({ success: false, error: err.message, errorCode: err.errorCode || "PAYMENT_VERIFY_FAILED" });
  }
}

async function recordAccountFreezeEvent(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    const record = defaultCommissionProtectionService.recordMerchantAccountFreeze({
      tenantId,
      ...(req.body || {})
    });
    res.status(201).json({ success: true, data: redactSecrets(record) });
  } catch (err) {
    res.status(err.httpStatus || 400).json({ success: false, error: err.message, errorCode: err.errorCode || "FREEZE_EVENT_FAILED" });
  }
}

async function getCommissionAging(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    const aging = defaultCommissionProtectionService.getReceivableAging(
      tenantId,
      req.params.merchantId,
      req.query.asOfDate
    );
    res.json({ success: true, data: redactSecrets(aging) });
  } catch (err) {
    res.status(err.httpStatus || 400).json({ success: false, error: err.message });
  }
}

async function exportCommissionEvidence(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    const evidence = defaultCommissionProtectionService.exportAccountingEvidence(
      tenantId,
      req.params.merchantId
    );
    res.json({ success: true, data: redactSecrets(evidence) });
  } catch (err) {
    res.status(err.httpStatus || 400).json({ success: false, error: err.message });
  }
}

async function getCommercialDashboards(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    const merchantId = req.query.merchantId || req.params.merchantId || null;
    const dashboards = defaultCommissionProtectionService.getCommercialDashboards({
      tenantId,
      merchantId,
      orchestrationService: defaultOrchestrationService,
      fuelTankService: defaultFuelTank
    });
    res.json({ success: true, data: redactSecrets(dashboards) });
  } catch (err) {
    res.status(err.httpStatus || 400).json({ success: false, error: err.message });
  }
}

// ============================================================================
// PHASE 8: TENANT-SCOPED ENTERPRISE LIST / QUERY / OVERVIEW / INTEGRATION APIs
// ============================================================================

function paginateAndFilter(items, { search = "", status = "", merchantId = "", dateFrom = "", dateTo = "", page = 1, limit = 25, searchFields = [] }) {
  const q = String(search || "").trim().toLowerCase();
  const st = String(status || "").trim().toUpperCase();
  const mId = String(merchantId || "").trim();

  let filtered = items.filter((item) => {
    if (st && st !== "ALL" && String(item.status || item.paymentStatus || "").toUpperCase() !== st) return false;
    if (mId && String(item.merchantId || "") !== mId) return false;
    const ts = item.createdAt || item.settledAt || item.settlementDate || item.billingDate || item.timestamp || "";
    const dayStr = ts ? String(ts).slice(0, 10) : "";
    if (dateFrom && dayStr && dayStr < dateFrom) return false;
    if (dateTo && dayStr && dayStr > dateTo) return false;
    if (q) {
      const hay = searchFields.map((f) => String(item[f] || "")).join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  filtered.sort((a, b) => String(b.updatedAt || b.createdAt || b.timestamp || "").localeCompare(String(a.updatedAt || a.createdAt || a.timestamp || "")));

  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 25));
  const total = filtered.length;
  const start = (safePage - 1) * safeLimit;
  return {
    items: filtered.slice(start, start + safeLimit),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit))
    }
  };
}

async function getExecutiveOverview(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    const merchantId = req.query.merchantId || null;
    const dashboards = defaultCommissionProtectionService.getCommercialDashboards({
      tenantId,
      merchantId,
      orchestrationService: defaultOrchestrationService,
      fuelTankService: defaultFuelTank
    });
    const merchants = defaultOrchestrationService.listMerchants(tenantId);
    const agreements = Array.from(defaultCommercialAgreementService.agreements.values()).filter((a) => a.tenantId === tenantId);
    const intents = defaultOrchestrationService.listPaymentIntents(tenantId);
    const metrics = defaultObservability.getMetrics();
    const alerts = defaultObservability.getAlerts();
    let chainValid = false;
    try { chainValid = defaultAuditLogger.verifyChainIntegrity(); } catch { chainValid = false; }

    res.json({
      success: true,
      data: redactSecrets({
        environmentMode: "LIVE_TENANT_WORKSPACE",
        isSimulated: false,
        tenantId,
        zeroCustodyPrincipalHeld: 0,
        merchantsCount: merchants.length,
        activeAgreementsCount: agreements.filter((a) => a.status === "APPROVED_ACTIVE").length,
        totalIntentsCount: intents.length,
        dashboards,
        webhookMetrics: {
          settledCount: intents.filter((i) => i.status === "SETTLED").length,
          duplicateEventsBlocked: metrics.duplicateEvents || 0,
          invalidHmacRejected: metrics.webhookFailures?.invalidSignature || 0,
          manualReviewCount: metrics.manualReviewCount || 0
        },
        openAlertsCount: alerts.filter((a) => !a.acknowledged).length,
        auditChainIntegrityValid: chainValid
      })
    });
  } catch (err) {
    res.status(err.httpStatus || 400).json({ success: false, error: err.message });
  }
}

async function listMerchants(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    const base = defaultOrchestrationService.listMerchants(tenantId);
    const agreements = Array.from(defaultCommercialAgreementService.agreements.values()).filter((a) => a.tenantId === tenantId);
    const enriched = base.map((m) => {
      const activeAgr = agreements.find((a) => a.merchantId === m.merchantId && a.status === "APPROVED_ACTIVE");
      const anyAgr = agreements.find((a) => a.merchantId === m.merchantId);
      const { destinationBankIban, ...safeMerchant } = m;
      return {
        ...safeMerchant,
        agreementStatus: activeAgr ? "APPROVED_ACTIVE" : anyAgr ? anyAgr.status : "NONE",
        contractVersion: activeAgr?.contractVersion || anyAgr?.contractVersion || null,
        appliedRateBps: activeAgr?.commissionBps || null,
        fuelBalance: defaultFuelTank.getBalance(m.merchantId, tenantId)
      };
    });
    const paged = paginateAndFilter(enriched, {
      search: req.query.search,
      status: req.query.status,
      page: req.query.page,
      limit: req.query.limit,
      searchFields: ["merchantId", "legalName", "corporateBankName", "maskedIban"]
    });
    res.json({ success: true, data: redactSecrets(paged) });
  } catch (err) {
    res.status(err.httpStatus || 400).json({ success: false, error: err.message });
  }
}

async function registerMerchant(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    const created = defaultOrchestrationService.registerMerchant({
      tenantId,
      merchantId: req.body?.merchantId,
      legalName: req.body?.legalName,
      corporateBankName: req.body?.corporateBankName,
      destinationBankIban: req.body?.destinationBankIban,
      bankCode: req.body?.bankCode,
      country: req.body?.country,
      currency: req.body?.currency,
      preferredBillingMode: req.body?.preferredBillingMode
    });
    const { destinationBankIban, ...safeRecord } = created;
    res.status(201).json({ success: true, data: redactSecrets(safeRecord) });
  } catch (err) {
    res.status(err.httpStatus || 400).json({ success: false, error: err.message, errorCode: err.errorCode || "MERCHANT_REGISTER_FAILED" });
  }
}

async function listPayments(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    let intents = defaultOrchestrationService.listPaymentIntents(tenantId).map((i) => ({
      ...i,
      maskedDestinationIban: i.destinationBankIban ? `****${String(i.destinationBankIban).slice(-4)}` : "****"
    }));
    if (req.query.rail && req.query.rail !== "ALL") {
      const targetRail = String(req.query.rail).toUpperCase();
      intents = intents.filter((i) => String(i.selectedRail || "").toUpperCase() === targetRail);
    }
    const paged = paginateAndFilter(intents, {
      search: req.query.search,
      status: req.query.status,
      merchantId: req.query.merchantId,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      page: req.query.page,
      limit: req.query.limit,
      searchFields: ["id", "merchantId", "merchantLegalName", "paymentReference", "bankSettlementRef", "selectedRail"]
    });
    res.json({ success: true, data: redactSecrets(paged) });
  } catch (err) {
    res.status(err.httpStatus || 400).json({ success: false, error: err.message });
  }
}

async function listSettlements(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    const intents = defaultOrchestrationService.listPaymentIntents(tenantId);
    const rows = intents.map((i) => ({
      settlementId: `stl_${i.id}`,
      paymentIntentId: i.id,
      merchantId: i.merchantId,
      merchantLegalName: i.merchantLegalName,
      amount: i.amount,
      currency: i.currency,
      selectedRail: i.selectedRail,
      preferredProvider: i.preferredProvider,
      bankSettlementRef: i.bankSettlementRef || null,
      providerTxId: i.providerTxId || null,
      status: i.status,
      reconciliationOutcome: i.status === "SETTLED" ? "MATCHED_EXACT" : i.status === "MANUAL_REVIEW" ? "MANUAL_REVIEW_REQUIRED" : i.status,
      reconciliationNotes: i.reconciliationNotes || null,
      appliedRateBps: i.appliedRateBps || 200,
      saasFeeDeducted: i.saasDeduction?.feeDeducted || i.commissionRecord?.commissionFee || 0,
      settledAt: i.settledAt || i.updatedAt
    }));
    const paged = paginateAndFilter(rows, {
      search: req.query.search,
      status: req.query.status,
      merchantId: req.query.merchantId,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      page: req.query.page,
      limit: req.query.limit,
      searchFields: ["paymentIntentId", "merchantId", "bankSettlementRef", "providerTxId", "reconciliationNotes"]
    });
    res.json({ success: true, data: redactSecrets(paged) });
  } catch (err) {
    res.status(err.httpStatus || 400).json({ success: false, error: err.message });
  }
}

async function listAgreements(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    let rows = Array.from(defaultCommercialAgreementService.agreements.values()).filter((a) => a.tenantId === tenantId);
    if (req.query.billingMode && req.query.billingMode !== "ALL") {
      rows = rows.filter((a) => a.billingMode === String(req.query.billingMode).toUpperCase());
    }
    const paged = paginateAndFilter(rows, {
      search: req.query.search,
      status: req.query.status,
      merchantId: req.query.merchantId,
      page: req.query.page,
      limit: req.query.limit,
      searchFields: ["contractId", "merchantId", "merchantLegalName", "contractVersion", "signedRef"]
    });
    res.json({ success: true, data: redactSecrets(paged) });
  } catch (err) {
    res.status(err.httpStatus || 400).json({ success: false, error: err.message });
  }
}

async function listFuelTanks(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    const merchantFilter = req.query.merchantId ? String(req.query.merchantId) : null;
    const merchantIds = new Set();
    for (const m of defaultOrchestrationService.listMerchants(tenantId)) merchantIds.add(m.merchantId);
    for (const key of defaultFuelTank.balancesMinor.keys()) {
      const parts = key.split("::");
      if (parts.length === 2 && parts[0] === tenantId) merchantIds.add(parts[1]);
    }
    const statements = Array.from(merchantIds)
      .filter((id) => !merchantFilter || id === merchantFilter)
      .map((mId) => defaultFuelTank.getLedgerStatement(mId, tenantId));
    res.json({ success: true, data: redactSecrets({ tanks: statements }) });
  } catch (err) {
    res.status(err.httpStatus || 400).json({ success: false, error: err.message });
  }
}

async function listReceivables(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    const rows = Array.from(defaultCommissionProtectionService.receivables.values()).filter((r) => r.tenantId === tenantId);
    const paged = paginateAndFilter(rows, {
      search: req.query.search,
      status: req.query.status,
      merchantId: req.query.merchantId,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      page: req.query.page,
      limit: req.query.limit,
      searchFields: ["commissionId", "merchantId", "transactionId", "bankSettlementRef", "invoiceNumber"]
    });
    res.json({ success: true, data: redactSecrets(paged) });
  } catch (err) {
    res.status(err.httpStatus || 400).json({ success: false, error: err.message });
  }
}

async function listInvoices(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    const rows = Array.from(defaultCommissionProtectionService.invoices.values()).filter((i) => i.tenantId === tenantId);
    const paged = paginateAndFilter(rows, {
      search: req.query.search,
      status: req.query.status,
      merchantId: req.query.merchantId,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      page: req.query.page,
      limit: req.query.limit,
      searchFields: ["invoiceId", "invoiceNumber", "merchantId", "statementId"]
    });
    res.json({ success: true, data: redactSecrets(paged) });
  } catch (err) {
    res.status(err.httpStatus || 400).json({ success: false, error: err.message });
  }
}

async function listStatements(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    const rows = Array.from(defaultCommissionProtectionService.dailyStatements.values()).filter((s) => s.tenantId === tenantId);
    const paged = paginateAndFilter(rows, {
      search: req.query.search,
      merchantId: req.query.merchantId,
      page: req.query.page,
      limit: req.query.limit,
      searchFields: ["statementId", "merchantId", "statementDate"]
    });
    res.json({ success: true, data: redactSecrets(paged) });
  } catch (err) {
    res.status(err.httpStatus || 400).json({ success: false, error: err.message });
  }
}

async function listDisputesAndAdjustments(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    const freezeEvents = (defaultCommissionProtectionService.freezeRecords || []).filter((f) => f.tenantId === tenantId);
    const adjustments = (defaultCommissionProtectionService.adjustments || []).filter((a) => a.tenantId === tenantId);
    res.json({ success: true, data: redactSecrets({ freezeEvents, adjustments }) });
  } catch (err) {
    res.status(err.httpStatus || 400).json({ success: false, error: err.message });
  }
}

async function getRiskOverview(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    const metrics = defaultObservability.getMetrics();
    const alerts = defaultObservability.getAlerts(req.query.severity || null);
    const freezeEvents = (defaultCommissionProtectionService.freezeRecords || []).filter((f) => f.tenantId === tenantId);
    res.json({
      success: true,
      data: redactSecrets({
        zeroCustodyInvariant: "ACTIVE ($0.00 Principal Held)",
        metrics,
        alerts,
        freezeEvents
      })
    });
  } catch (err) {
    res.status(err.httpStatus || 400).json({ success: false, error: err.message });
  }
}

async function listAuditLogs(req, res) {
  try {
    const q = String(req.query.search || "").trim().toLowerCase();
    let logs = defaultAuditLogger.getLogs(req.query.transactionId || null).slice().reverse();
    if (q) {
      logs = logs.filter((l) =>
        `${l.eventId} ${l.transactionId} ${l.action} ${l.actor} ${l.newState}`.toLowerCase().includes(q)
      );
    }
    let chainIntegrityValid = false;
    try { chainIntegrityValid = defaultAuditLogger.verifyChainIntegrity(); } catch { chainIntegrityValid = false; }
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
    res.json({
      success: true,
      data: redactSecrets({
        chainIntegrityValid,
        items: logs.slice((page - 1) * limit, page * limit),
        pagination: { page, limit, total: logs.length, totalPages: Math.max(1, Math.ceil(logs.length / limit)) }
      })
    });
  } catch (err) {
    res.status(err.httpStatus || 400).json({ success: false, error: err.message });
  }
}

async function listIntegrations(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    const items = defaultIntegrationRegistryService.listIntegrations(tenantId);
    res.json({ success: true, data: redactSecrets({ connectors: items }) });
  } catch (err) {
    res.status(err.httpStatus || 400).json({ success: false, error: err.message });
  }
}

async function stageIntegrationConfig(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    const result = defaultIntegrationRegistryService.stageCredentials({
      tenantId,
      providerId: req.params.providerId,
      payload: req.body || {},
      actorId: req.garudaContext?.actorId || "TENANT_ADMIN"
    });
    res.status(200).json({ success: true, data: redactSecrets(result) });
  } catch (err) {
    res.status(err.httpStatus || 400).json({ success: false, error: err.message, errorCode: err.errorCode || "INTEGRATION_STAGE_FAILED" });
  }
}

async function activateIntegrationBlocked(req, res) {
  try {
    const tenantId = resolveTenantId(req);
    defaultIntegrationRegistryService.attemptActivate({
      tenantId,
      providerId: req.params.providerId
    });
    res.status(403).json({ success: false, error: "CUSTOMER_ACCESS_REQUIRED" });
  } catch (err) {
    res.status(err.httpStatus || 403).json({ success: false, error: err.message, errorCode: err.errorCode || "CUSTOMER_ACCESS_REQUIRED" });
  }
}

// Isolated SIMULATED Sandbox Routes
function resolveSimSessionId(req) {
  return String(req.get("x-sim-session-id") || req.query.sessionId || "default_sim").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48) || "default_sim";
}

async function getSimulationState(req, res) {
  try {
    const snap = defaultFintechSimulationService.getFullSnapshot(resolveSimSessionId(req));
    res.json({ success: true, data: redactSecrets(snap) });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

async function resetSimulationState(req, res) {
  try {
    const snap = defaultFintechSimulationService.resetWorkspace(resolveSimSessionId(req));
    res.json({ success: true, data: redactSecrets(snap) });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

async function runSimulationAction(req, res) {
  try {
    const result = await defaultFintechSimulationService.runScenario(
      resolveSimSessionId(req),
      req.params.action,
      req.body || {}
    );
    res.json({ success: true, data: redactSecrets(result) });
  } catch (err) {
    res.status(err.httpStatus || 400).json({ success: false, error: err.message, errorCode: err.errorCode || "SIMULATION_ACTION_FAILED" });
  }
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
  acknowledgeAlert,
  createAgreement,
  approveAgreement,
  updateAgreementRate,
  getActiveAgreement,
  topUpFuelTank,
  ingestVerifiedBankReceiptFeed,
  getFuelTankStatement,
  accrueCommission,
  recordCommissionAdjustment,
  generateDailyStatement,
  generateDailyInvoice,
  verifyInvoicePayment,
  recordAccountFreezeEvent,
  getCommissionAging,
  exportCommissionEvidence,
  getCommercialDashboards,
  // Phase 8 Queries, Integrations & Isolated Simulation
  getExecutiveOverview,
  listMerchants,
  registerMerchant,
  listPayments,
  listSettlements,
  listAgreements,
  listFuelTanks,
  listReceivables,
  listStatements,
  listInvoices,
  listDisputesAndAdjustments,
  getRiskOverview,
  listAuditLogs,
  listIntegrations,
  stageIntegrationConfig,
  activateIntegrationBlocked,
  getSimulationState,
  resetSimulationState,
  runSimulationAction
};
