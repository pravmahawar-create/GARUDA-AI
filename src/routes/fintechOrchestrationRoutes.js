/**
 * 🦅 GARUDA OS — FINTECH ORCHESTRATION ROUTES
 * Express router for Sovereign Payment Orchestration, Treasury & Part 6 Commercial Revenue Engine
 * Spec: GARUDA-FINTECH-SPEC-V2.0 Section 15 & 26 + Part 5 Security + Part 6 Commercial Engine
 */

const express = require("express");
const router = express.Router();
const fintechController = require("../controllers/fintechController");
const authContextService = require("../services/authContextService");

/**
 * Enforces authenticated Tenant or Platform Founder context.
 * Rejects unauthenticated anonymous callers to prevent cross-tenant spoofing.
 */
async function requireFintechAuth(req, res, next) {
  try {
    let context = req.garudaContext;
    if (!context) {
      context = await authContextService.resolveRequestContext(req);
      req.garudaContext = context;
    }
    if (!context || context.actorType === "anonymous") {
      return res.status(401).json({
        success: false,
        error: "AUTHENTICATION_REQUIRED",
        message: "Verified tenant or founder credentials required."
      });
    }
    return next();
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Enforces strict Platform Founder authority (blocks tenant_admin / tenant_member escalation).
 */
async function requireFounderOnly(req, res, next) {
  try {
    let context = req.garudaContext;
    if (!context) {
      context = await authContextService.resolveRequestContext(req);
      req.garudaContext = context;
    }
    if (context && context.role === "platform_founder" && context.isFounderApproved === true) {
      return next();
    }
    return res.status(403).json({
      success: false,
      error: "FOUNDER_APPROVAL_REQUIRED",
      message: "Action strictly restricted to verified Platform Founder approval."
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// Public Sanitized Diagnostics & Fee Estimation (default 2.00%)
router.get("/fees/estimate", fintechController.estimateFees);
router.get("/providers", fintechController.getProviders);
router.get("/providers/health", fintechController.getProvidersHealth);

// Isolated Operational Simulation Environment (explicit SIMULATED sandbox; zero live data access)
router.get("/simulation/state", fintechController.getSimulationState);
router.post("/simulation/reset", fintechController.resetSimulationState);
router.post("/simulation/actions/:action", fintechController.runSimulationAction);

// Bank Settlement Webhooks & Authenticated Bank Receipt Feeds (HMAC-SHA256 Raw Body)
router.post("/webhooks/:provider_id", express.text({ type: "*/*" }), fintechController.handleWebhook);
router.post("/bank-receipts/ingest", express.text({ type: "*/*" }), requireFintechAuth, fintechController.ingestVerifiedBankReceiptFeed);

// Authenticated Multi-Tenant Executive Overview, Merchants, Payments & Settlements
router.get("/overview", requireFintechAuth, fintechController.getExecutiveOverview);
router.get("/merchants", requireFintechAuth, fintechController.listMerchants);
router.post("/merchants", requireFintechAuth, fintechController.registerMerchant);
router.get("/payments", requireFintechAuth, fintechController.listPayments);
router.post("/payments/create", requireFintechAuth, fintechController.createPayment);
router.post("/payments/instructions", requireFintechAuth, fintechController.getPaymentInstructions);
router.get("/payments/:id", requireFintechAuth, fintechController.getPayment);
router.get("/settlements", requireFintechAuth, fintechController.listSettlements);

// Authenticated Treasury Observability, Risk & Forensic Audit
router.get("/risk", requireFintechAuth, fintechController.getRiskOverview);
router.get("/treasury/metrics", requireFintechAuth, fintechController.getTreasuryMetrics);
router.get("/treasury/alerts", requireFintechAuth, fintechController.getTreasuryAlerts);
router.post("/treasury/alerts/:id/ack", requireFintechAuth, fintechController.acknowledgeAlert);
router.get("/audit", requireFintechAuth, fintechController.listAuditLogs);
router.get("/audit/:id", requireFintechAuth, fintechController.getAuditLogs);

// Bank & CRM Integration Readiness (NOT CONNECTED / AWAITING CUSTOMER ACCESS)
router.get("/integrations", requireFintechAuth, fintechController.listIntegrations);
router.post("/integrations/:providerId/stage", requireFintechAuth, fintechController.stageIntegrationConfig);
router.post("/integrations/:providerId/activate", requireFintechAuth, fintechController.activateIntegrationBlocked);

// Part 6 (6.1 & 6.6): Commercial Agreements & Rate Governance
router.get("/agreements", requireFintechAuth, fintechController.listAgreements);
router.post("/agreements", requireFintechAuth, fintechController.createAgreement);
router.post("/agreements/:contractId/approve", requireFounderOnly, fintechController.approveAgreement);
router.post("/agreements/:contractId/rate", requireFounderOnly, fintechController.updateAgreementRate);
router.get("/agreements/:merchantId", requireFintechAuth, fintechController.getActiveAgreement);

// Part 6 (6.2): Mode A — Prepaid SaaS Fuel Tank Ledger
router.get("/fuel-tank", requireFintechAuth, fintechController.listFuelTanks);
router.post("/fuel-tank/topup", requireFintechAuth, fintechController.topUpFuelTank);
router.get("/fuel-tank/:merchantId/statement", requireFintechAuth, fintechController.getFuelTankStatement);

// Part 6 (6.3 & 6.4): Mode B — Postpaid Receivables & Commission Protection Engine
router.get("/commissions/receivables", requireFintechAuth, fintechController.listReceivables);
router.get("/commissions/statements", requireFintechAuth, fintechController.listStatements);
router.get("/commissions/invoices", requireFintechAuth, fintechController.listInvoices);
router.get("/commissions/disputes", requireFintechAuth, fintechController.listDisputesAndAdjustments);
router.post("/commissions/accrue", requireFintechAuth, fintechController.accrueCommission);
router.post("/commissions/adjustments", requireFintechAuth, fintechController.recordCommissionAdjustment);
router.post("/commissions/daily-statement", requireFintechAuth, fintechController.generateDailyStatement);
router.post("/commissions/invoices", requireFintechAuth, fintechController.generateDailyInvoice);
router.post("/commissions/invoices/:invoiceId/verify-payment", requireFounderOnly, fintechController.verifyInvoicePayment);
router.post("/commissions/freeze-events", requireFintechAuth, fintechController.recordAccountFreezeEvent);
router.get("/commissions/aging/:merchantId", requireFintechAuth, fintechController.getCommissionAging);
router.get("/commissions/evidence/:merchantId", requireFintechAuth, fintechController.exportCommissionEvidence);

// Part 6 (6.5): 3-Part Commercial Dashboard (Merchant Tx / GARUDA 2% Revenue / Commission Reconciliation)
router.get("/dashboards/commercial", requireFintechAuth, fintechController.getCommercialDashboards);

module.exports = router;
