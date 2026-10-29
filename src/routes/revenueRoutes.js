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
const dealTrackerService = require("../services/dealTrackerService");

router.get("/deals/metrics", (_req, res) => {
  try {
    const data = dealTrackerService.getRealityMetrics();
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/deals/submit", (req, res) => {
  try {
    const data = dealTrackerService.recordDealSubmission(req.body);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/deals/response", (req, res) => {
  try {
    const data = dealTrackerService.recordClientResponse(req.body);
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

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

// 🦅 Mission M38: 12-Stage Autonomous Commercial Revenue Pipeline Routes
const commercialPipelineService = require("../services/unifiedCommercialPipelineService");

router.post("/pipeline/ingest", (req, res) => {
  try {
    const result = commercialPipelineService.ingestLead(req.body);
    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

router.get("/pipeline/metrics", (_req, res) => {
  try {
    const metrics = commercialPipelineService.getPipelineMetrics();
    return res.json({ success: true, data: metrics });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/pipeline/status/:id", (req, res) => {
  try {
    const record = commercialPipelineService.getPipelineRecord(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: "Pipeline record not found" });
    return res.json({ success: true, data: record });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/pipeline/qualify/:id", (req, res) => {
  try {
    const result = commercialPipelineService.qualifyLead(req.params.id, req.body);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/pipeline/demonstrate/:id", (req, res) => {
  try {
    const result = commercialPipelineService.prepareDemonstration(req.params.id);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/pipeline/propose/:id", (req, res) => {
  try {
    const result = commercialPipelineService.generateProposal(req.params.id, req.body);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/pipeline/checkout/:id", (req, res) => {
  try {
    const result = commercialPipelineService.initiateCheckout(req.params.id);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/pipeline/verify-payment/:id", (req, res) => {
  try {
    const result = commercialPipelineService.verifyPayment(req.params.id, req.body);
    if (!result.success) return res.status(400).json(result);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/pipeline/deliver/:id", (req, res) => {
  try {
    const result = commercialPipelineService.deliverProduct(req.params.id);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/pipeline/onboard/:id", (req, res) => {
  try {
    const result = commercialPipelineService.completeOnboarding(req.params.id, req.body);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/pipeline/retain/:id", (req, res) => {
  try {
    const result = commercialPipelineService.scheduleRetention(req.params.id);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/pipeline/upsell/:id", (req, res) => {
  try {
    const result = commercialPipelineService.triggerUpsell(req.params.id, req.body?.upsellType);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
