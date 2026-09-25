/**
 * 🦅 GARUDA INTELLIGENCE API ROUTES
 * Exposes Phase 5.2 Sovereign Intelligence, Nazar 11-Lens Forensics,
 * ReviewerSystem, and Memory Trust Pipeline to production HTTP callers.
 */

const express = require("express");
const router = express.Router();
const { getGarudaIntelligence } = require("../services/garudaIntelligence");

const gi = getGarudaIntelligence();

/**
 * GET /api/intelligence/stats
 * Subsystem telemetry across bus, nazar, reviewers, conflicts, and learning promoter
 */
router.get("/stats", (req, res) => {
  try {
    const stats = gi.getStats();
    res.json({ success: true, stats, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/intelligence/rules
 * Retrieve active verified constitutional rules and canons
 */
router.get("/rules", (req, res) => {
  try {
    const domain = req.query.domain;
    const rules = gi.getRules(domain) || [];
    res.json({ success: true, count: rules.length, rules });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/intelligence/search
 * Search intelligence bus across experiences, lessons, rules, capabilities, canons
 */
router.get("/search", (req, res) => {
  try {
    const query = req.query.q || req.query.query || "";
    const minConfidence = req.query.minConfidence ? parseFloat(req.query.minConfidence) : 0.0;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;

    const results = gi.retrieve({
      query,
      minConfidence,
      limit
    });

    res.json({ success: true, count: results.length, query, minConfidence, results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/intelligence/investigate
 * Run Nazar 11-Lens adaptive forensic investigation
 */
router.post("/investigate", (req, res) => {
  try {
    const { mission, context } = req.body;
    if (!mission) {
      return res.status(400).json({ success: false, error: "mission description is required" });
    }

    const investigation = gi.investigate(mission, context || {});
    res.json({ success: true, investigation });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/intelligence/review
 * Run ReviewerSystem on target artifact
 */
router.post("/review", (req, res) => {
  try {
    const { target, context, riskLevel } = req.body;
    if (!target) {
      return res.status(400).json({ success: false, error: "target is required" });
    }

    const review = gi.runSelectiveReview(target, context || {}, riskLevel || "MEDIUM");
    res.json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/intelligence/evaluate
 * Submit raw learning through ValidationPipeline & ConfidenceEngine
 */
router.post("/evaluate", (req, res) => {
  try {
    const learningData = req.body;
    if (!learningData || !learningData.content) {
      return res.status(400).json({ success: false, error: "learning content is required" });
    }

    const evaluation = gi.submitAndEvaluate(learningData);
    res.json({ success: true, evaluation });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
