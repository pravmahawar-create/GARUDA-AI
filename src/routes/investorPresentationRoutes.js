/**
 * 🦅 GARUDA AI — Investor Presentation API Routes
 * Phase: Investor Autonomous Presentation Experience (Cinematic Director V2)
 *
 * Endpoints:
 * - POST /api/investor/presentation/start
 * - POST /api/investor/presentation/next
 * - POST /api/investor/chat
 * - POST /api/investor/director/turn
 * - POST /api/investor/demonstrate
 * - GET  /api/investor/capabilities
 * - GET  /api/investor/presentation/session/:sessionId
 */

const express = require("express");
const router = express.Router();
const { presentationEngine } = require("../services/presentationEngine");
const { investorConversationEngine } = require("../services/investorConversationEngine");
const { cinematicPresentationDirector } = require("../services/cinematicPresentationDirector");
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
    const participant = req.body?.participant || "Investor";
    const businessData = req.body?.businessData || null;

    if (!question) {
      return res.status(400).json({ success: false, error: "Question is required" });
    }

    if (sessionId) {
      presentationEngine.interruptWithQuestion(sessionId, question);
    }

    const directorResult = await cinematicPresentationDirector.directTurn(question, {
      sessionId,
      participant,
      businessData,
      garudaContext: req.garudaContext || null,
      executionOptions: req.body?.options || {},
      executeDirectly: Boolean(req.body?.executeDirectly)
    });

    const d = directorResult.data;

    return res.status(200).json({
      success: true,
      data: {
        sessionId,
        answer: d.answer,
        speechText: d.speechText,
        confidence: d.confidence,
        topic: d.topic,
        title: d.topic ? `GARUDA — ${d.topic.toUpperCase().replace(/_/g, " ")}` : "GARUDA Sovereign Response",
        presentationMode: d.cinematic?.scene === "EXECUTION_THEATRE" ? "DEMO" : (d.cinematic?.scene === "ARCHITECTURE_STAGE" ? "ARCHITECTURE" : "CONVERSATION"),
        capabilityMentioned: d.suggestedDemo,
        demonstrationAvailable: d.demonstrationAvailable,
        suggestedDemo: d.suggestedDemo,
        truthStatus: d.truthStatus,
        keyTakeaway: `Sovereign response: ${d.topic || "general"}`,
        intent: d.intent,
        evidence: d.evidence,
        executionResult: d.executionResult,
        cinematic: d.cinematic,
        lifecycleState: d.lifecycleState,
        canResumePresentation: d.canResumePresentation,
        observability: d.observability
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to process investor inquiry"
    });
  }
});

// POST /api/investor/director/turn
router.post("/director/turn", async (req, res) => {
  try {
    const question = String(req.body?.question || req.body?.message || "").trim();
    const sessionId = req.body?.sessionId || null;
    const participant = req.body?.participant || "Investor";
    const businessData = req.body?.businessData || null;

    const turnResult = await cinematicPresentationDirector.directTurn(question, {
      sessionId,
      participant,
      businessData,
      garudaContext: req.garudaContext || null,
      executionOptions: req.body?.options || {},
      executeDirectly: Boolean(req.body?.executeDirectly)
    });

    return res.status(200).json(turnResult);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to direct cinematic presentation turn"
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
