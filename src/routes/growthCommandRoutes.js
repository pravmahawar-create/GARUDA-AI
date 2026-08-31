/**
 * 🦅 GARUDA Growth Command API
 * Growth Stage Phase 4 — Cross-Universe Campaign Command Surface
 *
 * Mounted at /api/growth BEFORE the legacy /api router so these explicit routes win.
 *
 * Endpoints:
 *   POST /api/growth/strategy                          brief -> GrowthStrategy
 *   GET  /api/growth/strategies                        list strategies
 *   GET  /api/growth/strategy/:id                      get strategy
 *   POST /api/growth/campaign                          brief|strategyId -> Campaign
 *   GET  /api/growth/campaigns                         list campaigns
 *   GET  /api/growth/campaign/:id                      get campaign
 *   POST /api/growth/campaign/:id/ready-for-approval   STRATEGIZED -> READY_FOR_APPROVAL
 *   POST /api/growth/campaign/:id/approve              founder approval gate (token required)
 *   POST /api/growth/campaign/:id/execution-pending    APPROVED -> EXECUTION_PENDING (staging)
 *   GET  /api/growth/campaign/:id/plan/:universe       per-universe plan slice
 *   POST /api/growth/packs/:packType                   run a universe pack (brand|content|creative|presence)
 *
 * Conventions: { success: true, data } / { success: false, error }, statusCode-aware.
 * No fake success responses: every failure returns an honest error.
 */

const express = require("express");
const router = express.Router();

const growthStrategyService = require("../services/growthStrategyService");
const campaignOrchestratorService = require("../services/campaignOrchestratorService");
const growthUniverseAdapters = require("../services/growthUniverseAdapters");

const UNIVERSE_PLAN_KEYS = {
  U21: "brandContext",
  U20: "contentPlan",
  U19: "creativeBriefs",
  U22: "presencePlan",
  U07: "communicationPlan",
  U10: "revenueHandoff"
};

function sendError(res, err) {
  const status = Number(err && err.statusCode) || 500;
  return res.status(status).json({ success: false, error: err.message || "Internal error" });
}

// ===========================================================================
// STRATEGY
// ===========================================================================

router.post("/strategy", async (req, res) => {
  try {
    const strategy = await growthStrategyService.generateStrategy(req.body || {});
    res.json({ success: true, data: strategy });
  } catch (err) {
    sendError(res, err);
  }
});

router.get("/strategies", (req, res) => {
  try {
    const limit = Number(req.query.limit) || 50;
    res.json({ success: true, data: growthStrategyService.listStrategies(limit) });
  } catch (err) {
    sendError(res, err);
  }
});

router.get("/strategy/:id", (req, res) => {
  try {
    const strategy = growthStrategyService.getStrategy(req.params.id);
    if (!strategy) return res.status(404).json({ success: false, error: `Strategy not found: ${req.params.id}` });
    res.json({ success: true, data: strategy });
  } catch (err) {
    sendError(res, err);
  }
});

// ===========================================================================
// CAMPAIGN LIFECYCLE
// ===========================================================================

router.post("/campaign", async (req, res) => {
  try {
    const body = req.body || {};
    const campaign = await campaignOrchestratorService.createCampaign({
      briefInput: body.briefInput || (body.strategyId ? undefined : body),
      strategyId: body.strategyId
    });
    res.json({ success: true, data: campaign });
  } catch (err) {
    sendError(res, err);
  }
});

router.get("/campaigns", (req, res) => {
  try {
    const limit = Number(req.query.limit) || 50;
    res.json({ success: true, data: campaignOrchestratorService.listCampaigns(limit) });
  } catch (err) {
    sendError(res, err);
  }
});

router.get("/campaign/:id", (req, res) => {
  try {
    const campaign = campaignOrchestratorService.getCampaign(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, error: `Campaign not found: ${req.params.id}` });
    res.json({ success: true, data: campaign });
  } catch (err) {
    sendError(res, err);
  }
});

router.post("/campaign/:id/ready-for-approval", (req, res) => {
  try {
    const campaign = campaignOrchestratorService.markReadyForApproval(req.params.id);
    res.json({ success: true, data: campaign });
  } catch (err) {
    sendError(res, err);
  }
});

router.post("/campaign/:id/approve", (req, res) => {
  try {
    const campaign = campaignOrchestratorService.approveCampaign(req.params.id, req.body || {});
    res.json({ success: true, data: campaign });
  } catch (err) {
    sendError(res, err);
  }
});

router.post("/campaign/:id/execution-pending", (req, res) => {
  try {
    const campaign = campaignOrchestratorService.markExecutionPending(req.params.id, req.body || {});
    res.json({ success: true, data: campaign });
  } catch (err) {
    sendError(res, err);
  }
});

router.get("/campaign/:id/plan/:universe", (req, res) => {
  try {
    const campaign = campaignOrchestratorService.getCampaign(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, error: `Campaign not found: ${req.params.id}` });
    const universe = String(req.params.universe).toUpperCase();
    const planKey = UNIVERSE_PLAN_KEYS[universe];
    if (!planKey) {
      return res.status(400).json({
        success: false,
        error: `Unknown universe '${req.params.universe}'. Cross-universe plans exist for: ${Object.keys(UNIVERSE_PLAN_KEYS).join(", ")}`
      });
    }
    res.json({
      success: true,
      data: {
        campaignId: campaign.campaignId,
        campaignStatus: campaign.status,
        universe,
        plan: campaign[planKey]
      }
    });
  } catch (err) {
    sendError(res, err);
  }
});

// ===========================================================================
// UNIVERSE PACKS (live engine invocations via adapters)
// ===========================================================================

const PACK_HANDLERS = {
  brand: (input) => growthUniverseAdapters.generateBrandContextPack(input),
  content: (input) => growthUniverseAdapters.generateContentPack(input),
  creative: (input) => growthUniverseAdapters.generateCreativePack(input),
  presence: (input) => growthUniverseAdapters.generatePresencePack(input)
};

router.post("/packs/:packType", async (req, res) => {
  try {
    const packType = String(req.params.packType || "").toLowerCase();
    const handler = PACK_HANDLERS[packType];
    if (!handler) {
      return res.status(400).json({
        success: false,
        error: `Unknown pack type '${req.params.packType}'. Available: ${Object.keys(PACK_HANDLERS).join(", ")}`
      });
    }
    const pack = await handler(req.body || {});
    res.json({ success: true, data: pack });
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;
module.exports.UNIVERSE_PLAN_KEYS = UNIVERSE_PLAN_KEYS;
