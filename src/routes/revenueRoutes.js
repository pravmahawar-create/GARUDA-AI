const express = require("express");
const revenueController = require("../controllers/revenueController");
const paymentLinkController = require("../controllers/paymentLinkController");

const router = express.Router();

// Payment Link Routes
router.get("/payment-link/config", paymentLinkController.config);
router.post("/payment-link", paymentLinkController.generate);

router.get("/", revenueController.list);
router.post("/", revenueController.create);
router.post("/conversion/:opportunityId/preview", revenueController.previewConversion);
router.post("/conversion/:opportunityId/execute", revenueController.executeConversion);
router.get("/settlements", revenueController.listSettlements);
router.post("/settlements/:revenueRecordId/preview", revenueController.previewSettlement);
router.post("/settlements/:revenueRecordId", revenueController.createSettlement);
router.patch("/settlements/:id/status", revenueController.updateSettlementStatus);
router.patch("/settlements/:id/bank-reconciliation", revenueController.recordBankReconciliation);
router.get("/reconciliation", revenueController.listReconciliation);
router.patch("/reconciliation/:id", revenueController.resolveReconciliation);
router.get("/command-center", revenueController.commandCenter);
router.patch("/:id", revenueController.update);
router.delete("/:id", revenueController.remove);

router.get("/metrics", revenueController.metrics);
router.get("/analytics", revenueController.analytics);
router.get("/settlement", revenueController.settlement);

// Mission Candidate Review Routes
router.get("/candidates", revenueController.listCandidates);
router.get("/candidates/:id", revenueController.getCandidate);
router.post("/candidates/:id/decision", revenueController.recordCandidateDecision);
router.get("/candidates/:id/audit", revenueController.getCandidateAuditTrail);
router.get("/candidates/:id/readiness", revenueController.getMissionConnectorReadiness);
router.get("/candidates/:id/smtp-prepare", revenueController.prepareSmtpAction);
router.post("/candidates/:id/smtp-execute", revenueController.executeSmtpAction);

// Connector Authentication Routes
router.get("/connectors/:id/requirements", revenueController.getConnectorRequirements);
router.get("/connectors/:id/auth", revenueController.getConnectorAuthStatus);
router.post("/connectors/:id/validate", revenueController.validateConnectorCredentials);

// Empirical Deal Tracker Routes
// Retainer & Post-Delivery Recurring Revenue Routes
const revenueRetainerService = require("../services/revenueRetainerService");
router.get("/retainers/tiers", (_req, res) => {
  return res.json({ success: true, data: revenueRetainerService.RETAINER_TIERS });
});
router.post("/retainers/scan", async (_req, res) => {
  try {
    const results = await revenueRetainerService.scanForRetainerOpportunities();
    return res.json({ success: true, data: results });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
router.post("/retainers/confirm", async (req, res) => {
  try {
    const { proposalId, tierKey } = req.body || {};
    const agreement = await revenueRetainerService.confirmRetainerAgreement(proposalId, tierKey);
    return res.json({ success: true, data: agreement });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
