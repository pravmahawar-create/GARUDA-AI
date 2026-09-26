/**
 * GARUDA FOUNDER INTELLIGENCE — Routes (Phase 2)
 *
 * SECURITY: every endpoint sits behind requireFounderOrAdmin().
 * Meeting endpoints return TWO SEPARATE server-side structures
 * (customerView / founderPrivate) — never a filtered single object.
 */

const express = require("express");
const router = express.Router();

const { requireFounderOrAdmin } = require("../middleware/capabilityGateMiddleware");
const founderIntelligenceService = require("../services/founderIntelligence/founderIntelligenceService");
const pricingEngine = require("../services/founderIntelligence/pricingIntelligenceEngine");
const pricingEvidenceStore = require("../services/founderIntelligence/pricingEvidenceStore");
const negotiationAdvisor = require("../services/founderIntelligence/negotiationAdvisor");
const businessCalculator = require("../services/founderIntelligence/businessCalculator");
const clientMemoryService = require("../services/founderIntelligence/clientMemoryService");
const meetingModeService = require("../services/founderIntelligence/meetingModeService");
const proposalCopilot = require("../services/founderIntelligence/proposalCopilot");
const learningLoopService = require("../services/founderIntelligence/learningLoopService");
const { LABELS } = require("../services/founderIntelligence/evidenceLabels");

const founderGate = requireFounderOrAdmin();

// §10 explicit calculator allowlist — proto-chain functions (constructor/toString)
// can never pass this gate (K4 hardening).
const ALLOWED_CALCULATORS = new Set([
  "margin",
  "discountImpact",
  "milestoneSplit",
  "breakEven",
  "recurringRevenue",
  "acv",
  "supportCost",
  "setupRecurring",
  "monthlyVsAnnual",
  "infrastructureCost",
]);

function sendError(res, err, status = 500) {
  return res.status(status).json({
    success: false,
    error: {
      code: err.code || "FOUNDER_INTELLIGENCE_ERROR",
      message: String(err.message || err).slice(0, 400),
    },
  });
}

// ---------------- ORCHESTRATION ----------------

router.post("/chat", founderGate, async (req, res) => {
  try {
    const response = await founderIntelligenceService.handle(req.body || {});
    return res.json({ success: true, data: response, ...response });
  } catch (err) {
    return sendError(res, err);
  }
});

// ---------------- PRICING (deterministic) ----------------

router.post("/analysis", founderGate, async (req, res) => {
  try {
    const response = await founderIntelligenceService.handle({
      ...(req.body || {}),
      intentHint: "analyze",
    });
    return res.json({ success: true, data: response });
  } catch (err) {
    return sendError(res, err);
  }
});

router.post("/pricing", founderGate, (req, res) => {
  try {
    const result = pricingEngine.quote(req.body || {}, { nowMs: req.body?.nowMs });
    return res.json({ success: result.success, data: result, ...result });
  } catch (err) {
    return sendError(res, err);
  }
});

router.get("/pricing/subscription-tiers", founderGate, (req, res) => {
  try {
    const result = pricingEngine.subscriptionTiers();
    return res.json({ success: true, data: result });
  } catch (err) {
    return sendError(res, err);
  }
});

router.get("/pricing/snapshot", founderGate, (req, res) => {
  try {
    const status = pricingEvidenceStore.getSnapshotStatus();
    return res.json({ success: true, data: status });
  } catch (err) {
    return sendError(res, err);
  }
});

// ---------------- NEGOTIATION ----------------

router.post("/negotiation", founderGate, (req, res) => {
  try {
    const body = req.body || {};
    const quote =
      body.quote ||
      (body.serviceType
        ? pricingEngine.quote(
            { serviceType: body.serviceType, scope: body.scope, complexity: body.complexity },
            { nowMs: body.nowMs }
          )
        : null);
    const result = negotiationAdvisor.analyze({ ...body, quote });
    return res.json({ success: true, data: result });
  } catch (err) {
    return sendError(res, err);
  }
});

// ---------------- BUSINESS CALCULATOR ----------------

router.post("/calculator/:calcType", founderGate, (req, res) => {
  try {
    const calcType = req.params.calcType;
    if (!ALLOWED_CALCULATORS.has(calcType)) {
      return res.status(404).json({ success: false, error: { code: "CALC_NOT_FOUND", message: `Unknown calculator: ${calcType}` } });
    }
    const fn = businessCalculator[calcType];
    const result = fn(req.body || {});
    return res.json({ success: result.success !== false, data: result });
  } catch (err) {
    return sendError(res, err);
  }
});

// ---------------- CLIENT MEMORY ----------------

router.post("/memory/clients", founderGate, async (req, res) => {
  try {
    const result = await clientMemoryService.createClientProfile(req.body || {});
    return res.status(result.success ? 201 : 422).json({ success: result.success, data: result });
  } catch (err) {
    return sendError(res, err);
  }
});

router.get("/memory/clients", founderGate, async (req, res) => {
  try {
    const clients = await clientMemoryService.listClients();
    return res.json({ success: true, data: { clients } });
  } catch (err) {
    return sendError(res, err);
  }
});

router.get("/memory/clients/:clientId", founderGate, async (req, res) => {
  try {
    const view = await clientMemoryService.getClientFounderView(req.params.clientId);
    return res.status(view.success ? 200 : 404).json({ success: view.success, data: view });
  } catch (err) {
    return sendError(res, err);
  }
});

router.get("/memory/clients/:clientId/customer-view", founderGate, async (req, res) => {
  try {
    const view = await clientMemoryService.getClientCustomerView(req.params.clientId);
    return res.status(view.success ? 200 : 404).json({ success: view.success, data: view });
  } catch (err) {
    return sendError(res, err);
  }
});

router.post("/memory/clients/:clientId/statements", founderGate, async (req, res) => {
  try {
    const result = await clientMemoryService.recordClientStatement({
      clientId: req.params.clientId,
      text: req.body?.text,
      source: req.body?.source,
      type: req.body?.type,
      at: req.body?.at,
    });
    return res.status(result.success ? 200 : 422).json({ success: result.success, data: result });
  } catch (err) {
    return sendError(res, err);
  }
});

router.post("/memory/clients/:clientId/interactions", founderGate, async (req, res) => {
  try {
    const result = await clientMemoryService.recordInteraction({
      clientId: req.params.clientId,
      summary: req.body?.summary,
      outcome: req.body?.outcome,
    });
    return res.status(result.success ? 200 : 422).json({ success: result.success, data: result });
  } catch (err) {
    return sendError(res, err);
  }
});

// §8 generic chain recorder — contact/requirement/question/proposal/quote/
// negotiation/agreement/project/payment (whitelisted types only).
router.post("/memory/clients/:clientId/records", founderGate, async (req, res) => {
  try {
    const result = await clientMemoryService.recordChain(
      req.params.clientId,
      req.body?.type,
      req.body?.data || {}
    );
    return res.status(result.success ? 200 : 422).json({ success: result.success, data: result });
  } catch (err) {
    return sendError(res, err);
  }
});

// ---------------- LEARNING LOOP (§16 — read-only evidence) ----------------

router.post("/learning/events", founderGate, (req, res) => {
  try {
    const result = learningLoopService.recordEvent(req.body || {});
    return res.status(result.success ? 201 : 422).json({ success: result.success, data: result });
  } catch (err) {
    return sendError(res, err);
  }
});

router.get("/learning/events", founderGate, (req, res) => {
  try {
    const result = learningLoopService.listEvents({
      limit: Number(req.query.limit) || 50,
      proposalId: req.query.proposalId || null,
      stage: req.query.stage || null,
    });
    return res.json({ success: true, data: result });
  } catch (err) {
    return sendError(res, err);
  }
});

router.get("/learning/summary", founderGate, (req, res) => {
  try {
    return res.json({ success: true, data: learningLoopService.summarize() });
  } catch (err) {
    return sendError(res, err);
  }
});

// ---------------- MEETING MODE (strict server-side split) ----------------

router.post("/meeting/start", founderGate, (req, res) => {
  try {
    const result = meetingModeService.startSession(req.body || {});
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    return sendError(res, err);
  }
});

router.post("/meeting/:sessionId/utterance", founderGate, (req, res) => {
  try {
    const result = meetingModeService.recordUtterance(req.params.sessionId, {
      speaker: req.body?.speaker,
      text: req.body?.text,
    });
    return res.status(result.success ? 200 : 404).json({ success: result.success, data: result });
  } catch (err) {
    return sendError(res, err);
  }
});

router.post("/meeting/:sessionId/split", founderGate, async (req, res) => {
  try {
    const response = await founderIntelligenceService.handle({
      ...(req.body || {}),
      intentHint: "meeting",
      meetingSessionId: req.params.sessionId,
    });
    if (!response.customerView || !response.founderPrivate) {
      return res.status(422).json({ success: false, error: { code: "SPLIT_NOT_BUILT", message: "Meeting split structures were not produced" } });
    }
    return res.json({
      success: true,
      customerView: response.customerView,
      founderPrivate: response.founderPrivate,
      label: response.label,
      evidence: response.evidence,
    });
  } catch (err) {
    return sendError(res, err);
  }
});

router.get("/meeting/:sessionId/customer-view", founderGate, (req, res) => {
  try {
    const result = meetingModeService.getCustomerView(req.params.sessionId);
    return res.status(result.success ? 200 : 404).json(result);
  } catch (err) {
    return sendError(res, err, err.message && String(err.message).includes("LEAK") ? 500 : 500);
  }
});

router.get("/meeting/:sessionId/founder-private", founderGate, (req, res) => {
  try {
    const result = meetingModeService.getFounderPrivate(req.params.sessionId);
    return res.status(result.success ? 200 : 404).json(result);
  } catch (err) {
    return sendError(res, err);
  }
});

// ---------------- PROPOSAL COPILOT ----------------

router.post("/proposal/draft", founderGate, async (req, res) => {
  try {
    const result = await proposalCopilot.draftFromBrief(req.body || {}, {
      founderApproved: req.body?.founderApproved !== false,
    });
    return res.status(result.created ? 201 : 422).json({ success: result.success, data: result });
  } catch (err) {
    return sendError(res, err);
  }
});

router.get("/proposal/:proposalId", founderGate, async (req, res) => {
  try {
    const result = await proposalCopilot.getProposal(req.params.proposalId, { isPublicView: false });
    return res.status(result.success ? 200 : 404).json({ success: result.success, data: result });
  } catch (err) {
    return sendError(res, err);
  }
});

// §11 — proposal → PDF via existing pdfGenerationService (facade)
router.post("/proposal/:proposalId/pdf", founderGate, async (req, res) => {
  try {
    const result = await proposalCopilot.exportPdf(req.params.proposalId, req.body || {});
    return res.status(result.success ? 200 : (result.reason === "NOT_FOUND" ? 404 : 422)).json({ success: result.success, data: result });
  } catch (err) {
    return sendError(res, err);
  }
});

// ---------------- EVIDENCE SYSTEM ----------------

router.get("/evidence/labels", founderGate, (req, res) => {
  try {
    return res.json({
      success: true,
      data: {
        labels: Object.values(LABELS),
        rules: {
          unknownNotInvented: "If a value cannot be verified, label = UNKNOWN. Never invent.",
          staleDetectable: "Snapshots carry retrievedAt; stale → PRICE_SNAPSHOT_STALE warning.",
          privateSeparation: "founderPrivate never serialized into customerView (server-side).",
        },
      },
    });
  } catch (err) {
    return sendError(res, err);
  }
});

module.exports = router;
