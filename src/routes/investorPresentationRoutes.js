/**
 * 🦅 GARUDA AI — Investor Presentation API Routes
 * Phase: Investor Autonomous Presentation Experience
 *
 * Endpoints:
 * - POST /api/investor/presentation/start
 * - POST /api/investor/presentation/next
 * - POST /api/investor/chat
 * - POST /api/investor/demonstrate
 * - GET  /api/investor/capabilities
 * - GET  /api/investor/presentation/session/:sessionId
 */

const express = require("express");
const router = express.Router();
const { presentationEngine } = require("../services/presentationEngine");
const { investorConversationEngine } = require("../services/investorConversationEngine");
const { demonstrationOrchestrator } = require("../services/demonstrationOrchestrator");
const garudaIdentityKnowledge = require("../knowledge/garudaIdentityKnowledge");

// POST /api/investor/presentation/start
router.post("/presentation/start", (req, res) => {
  try {
    const sessionId = req.body?.sessionId || null;
    const presentation = presentationEngine.startPresentation(sessionId, {
      metadata: req.body?.metadata || {}
    });

    return res.status(200).json({
      success: true,
      data: presentation
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to start investor presentation"
    });
  }
});

// POST /api/investor/presentation/next
router.post("/presentation/next", (req, res) => {
  try {
    const sessionId = req.body?.sessionId;
    if (!sessionId) {
      return res.status(400).json({ success: false, error: "sessionId is required" });
    }

    const nextStep = presentationEngine.nextModule(sessionId);
    return res.status(200).json({
      success: true,
      data: nextStep
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to advance presentation module"
    });
  }
});

// POST /api/investor/chat
router.post("/chat", async (req, res) => {
  try {
    const question = String(req.body?.question || req.body?.message || "").trim();
    const sessionId = req.body?.sessionId || null;

    if (!question) {
      return res.status(400).json({ success: false, error: "Question is required" });
    }

    if (sessionId) {
      presentationEngine.interruptWithQuestion(sessionId, question);
    }

    const answer = await investorConversationEngine.processInquiry(question, {
      sessionId,
      garudaContext: req.garudaContext || null
    });

    return res.status(200).json({
      success: true,
      data: {
        sessionId,
        ...answer
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to process investor inquiry"
    });
  }
});

// POST /api/investor/demonstrate
router.post("/demonstrate", async (req, res) => {
  try {
    const demoKey = String(req.body?.demoKey || req.body?.demo || "creative_artifact").trim().toLowerCase();
    const sessionId = req.body?.sessionId || null;
    const options = req.body?.options || {};

    if (sessionId) {
      presentationEngine.transitionToDemonstration(sessionId, demoKey);
    }

    const demoResult = await demonstrationOrchestrator.executeDemonstration(demoKey, options);

    if (sessionId && demoResult.success) {
      presentationEngine.completeDemonstrationAndReturn(sessionId, demoResult);
    }

    return res.status(demoResult.success ? 200 : 400).json({
      success: demoResult.success,
      data: demoResult
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Demonstration execution error"
    });
  }
});

// GET /api/investor/capabilities
router.get("/capabilities", (_req, res) => {
  try {
    const availableDemos = demonstrationOrchestrator.getAvailableDemonstrations();
    const taxonomy = garudaIdentityKnowledge.getCapabilityTaxonomy();

    return res.status(200).json({
      success: true,
      data: {
        demonstrations: availableDemos,
        taxonomy
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to retrieve capability taxonomy"
    });
  }
});

// GET /api/investor/presentation/session/:sessionId
router.get("/presentation/session/:sessionId", (req, res) => {
  try {
    const session = presentationEngine.getSession(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: "Session not found" });
    }

    return res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to retrieve session"
    });
  }
});

module.exports = router;
