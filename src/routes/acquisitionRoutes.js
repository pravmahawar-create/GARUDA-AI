const express = require("express");
const router = express.Router();
const acquisitionEngine = require("../services/garudaAcquisitionEngineService");
const selfMarketing = require("../services/garudaSelfMarketingService");
const outreachDispatch = require("../services/garudaOutreachDispatchService");

/**
 * GET /api/acquisition/command-center
 * Returns real-time acquisition funnel, demand analysis, revenue truth, and bottleneck insights.
 */
router.get("/command-center", async (req, res) => {
  try {
    const isTest = req.headers["x-garuda-test"] === "true" || req.query.test === "true";
    const metrics = await acquisitionEngine.getAcquisitionMetrics({ isTest });
    return res.status(200).json(metrics);
  } catch (err) {
    console.error("[AcquisitionRoutes] Error getting command center metrics:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error fetching acquisition metrics" });
  }
});

/**
 * GET /api/acquisition/self-marketing/topics
 * Returns list of programmatic SEO and marketing topics.
 */
router.get("/self-marketing/topics", (req, res) => {
  try {
    const topics = selfMarketing.getTopics();
    return res.status(200).json({ success: true, count: topics.length, topics });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/acquisition/self-marketing/brief/:slug
 * Returns programmatic SEO blueprint and content brief.
 */
router.get("/self-marketing/brief/:slug", (req, res) => {
  try {
    const brief = selfMarketing.generateContentBrief(req.params.slug);
    return res.status(200).json({ success: true, brief });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/acquisition/leads
 * Ingests and processes a prospective commercial lead through the acquisition state machine.
 */
router.post("/leads", async (req, res) => {
  try {
    const isTest = req.headers["x-garuda-test"] === "true" || req.body.isTest === true;
    const record = await acquisitionEngine.processInboundLead(req.body, { isTest });
    return res.status(201).json({ success: true, lead: record });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/acquisition/outreach/qualify
 * Prepares a qualified lead for governed outreach.
 */
router.post("/outreach/qualify", async (req, res) => {
  try {
    const isTest = req.headers["x-garuda-test"] === "true" || req.body.isTest === true;
    const record = await outreachDispatch.qualifyProspectForOutreach(req.body, { isTest });
    return res.status(201).json({ success: true, prospect: record });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/acquisition/outreach/:id/approve
 * Approves an outreach draft for dispatch.
 */
router.post("/outreach/:id/approve", async (req, res) => {
  try {
    const record = await outreachDispatch.approveOutreach(req.params.id, req.body);
    return res.status(200).json({ success: true, prospect: record });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/acquisition/outreach/:id/dispatch
 * Dispatches an approved outreach communication.
 */
router.post("/outreach/:id/dispatch", async (req, res) => {
  try {
    const result = await outreachDispatch.dispatchOutreach(req.params.id, req.body);
    return res.status(200).json(result);
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/acquisition/outreach/:id/response
 * Records inbound response from prospect.
 */
router.post("/outreach/:id/response", async (req, res) => {
  try {
    const record = await outreachDispatch.recordResponse(req.params.id, req.body);
    return res.status(200).json({ success: true, prospect: record });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/acquisition/outreach/metrics
 */
router.get("/outreach/metrics", (req, res) => {
  try {
    const metrics = outreachDispatch.getOutreachPipelineMetrics();
    return res.status(200).json({ success: true, metrics });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Customer Conversion Endpoints
 */
const conversionService = require("../services/customerConversionService");
const failureIntel = require("../services/conversionFailureIntelligenceService");

router.post("/conversions/initiate", async (req, res) => {
  try {
    const isTest = req.headers["x-garuda-test"] === "true" || req.body.isTest === true;
    const result = await conversionService.initiateConversionFromOpportunity(req.body, { isTest });
    return res.status(result.success ? 201 : 422).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/conversions/:id/outreach/dispatch", async (req, res) => {
  try {
    const result = await conversionService.approveAndDispatchOutreach(req.params.id, req.body);
    return res.status(200).json(result);
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
});

router.post("/conversions/:id/response", async (req, res) => {
  try {
    const result = await conversionService.handleProspectResponse(req.params.id, req.body);
    return res.status(200).json(result);
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
});

router.post("/conversions/:id/scope", async (req, res) => {
  try {
    const result = await conversionService.scopeAndCreateProposal(req.params.id, req.body);
    return res.status(200).json(result);
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
});

router.post("/conversions/:id/accept", async (req, res) => {
  try {
    const result = await conversionService.clientAcceptProposal(req.params.id, req.body);
    return res.status(200).json(result);
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
});

router.post("/conversions/:id/verify-deposit", async (req, res) => {
  try {
    const result = await conversionService.processAuthoritativeDeposit(req.params.id, req.body);
    return res.status(result.verified ? 200 : 422).json(result);
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
});

router.post("/conversions/:id/deliver-settle", async (req, res) => {
  try {
    const result = await conversionService.deliverAndSettleProject(req.params.id, req.body);
    return res.status(200).json(result);
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
});

router.get("/conversions/telemetry", (req, res) => {
  try {
    const telemetry = conversionService.getConversionTelemetry();
    return res.status(200).json({ success: true, telemetry });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/failure-intelligence", (req, res) => {
  try {
    const blockers = failureIntel.getAllBlockerDefinitions();
    return res.status(200).json({ success: true, count: blockers.length, blockers });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/prospect-queue", async (req, res) => {
  try {
    const prospectQueueService = require("../services/realCommercialProspectQueueService");
    const result = await prospectQueueService.prepareTopOutreachDrafts();
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/acquisition/opportunities/classified
 * Returns complete commercial opportunity inventory categorized with contact paths.
 */
router.get("/opportunities/classified", async (req, res) => {
  try {
    const prospectQueueService = require("../services/realCommercialProspectQueueService");
    const result = await prospectQueueService.curateCommercialQueue();
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
