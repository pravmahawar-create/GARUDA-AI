const express = require("express");
const router = express.Router();
const acquisitionEngine = require("../services/garudaAcquisitionEngineService");
const selfMarketing = require("../services/garudaSelfMarketingService");

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

module.exports = router;
