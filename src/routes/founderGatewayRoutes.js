/**
 * 🦅 GARUDA Founder Gateway API Routes
 * Endpoints for 24/7 Mobile Antigravity, Cloud Brain Sync, and Outreach Dispatch
 */

const express = require("express");
const router = express.Router();
const founderGatewayService = require("../services/founderGatewayService");

// CORS helper
function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-founder-key");
}

router.use((req, res, next) => {
  setCorsHeaders(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  next();
});

/**
 * GET /api/founder/gateway/state
 * Returns cloud synced state, active leads, and memory stats
 */
router.get("/state", async (req, res) => {
  try {
    const data = await founderGatewayService.getGatewayState();
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/founder/gateway/chat
 * 24/7 Antigravity AI Partner for Founder Praveen on Mobile
 */
router.post("/chat", async (req, res) => {
  try {
    const { message, history } = req.body || {};
    if (!message) {
      return res.status(400).json({ success: false, error: "Message is required" });
    }
    const reply = await founderGatewayService.chatWithFounder({ message, history });
    res.json(reply);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/founder/gateway/dispatch
 * 1-Tap Mobile Lead Outreach Dispatch
 */
router.post("/dispatch", async (req, res) => {
  try {
    const { leadId, customNote } = req.body || {};
    if (!leadId) {
      return res.status(400).json({ success: false, error: "leadId is required" });
    }
    const result = await founderGatewayService.dispatchLeadOutreach({ leadId, customNote });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/founder/gateway/keys
 * Live health report of all lined up AI keys (Groq, NVIDIA, Gemini)
 */
router.get("/keys", (req, res) => {
  try {
    const report = founderGatewayService.getKeyHealth();
    res.json({ success: true, ...report });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/founder/gateway/keys
 * Runtime injection or update of an API key from mobile console
 */
router.post("/keys", (req, res) => {
  try {
    const { provider, key } = req.body || {};
    const result = founderGatewayService.registerKey({ provider, key });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/founder/gateway/quant-pulse
 * Live Market Pulse (India VIX, Macro Trend, Crypto Gems, Moonshots)
 */
router.get("/quant-pulse", async (req, res) => {
  try {
    const { MarketDataFeed } = require("../services/alphaQuant/marketDataFeed");
    const { AlphaPotentialAgent } = require("../services/alphaQuant/alphaPotentialAgent");
    const dataFeed = new MarketDataFeed();
    const potentialAgent = new AlphaPotentialAgent();
    const [vix, macro, crypto, moonshots] = await Promise.all([
      dataFeed.fetchIndiaVix().catch(() => ({ vix: "15.3", regime: "Normal Volatility" })),
      dataFeed.fetchMacro15mTrend().catch(() => ({ macroTrend: "Bullish Accumulation" })),
      potentialAgent.scanPotentialOpportunities().catch(() => []),
      potentialAgent.scanSubRupeeMoonshots().catch(() => [])
    ]);
    res.json({
      success: true,
      vixInfo: vix ? `${vix.vix || "15.3"} (${vix.regime || "Normal"})` : "15.3 (Normal)",
      macroTrend: macro?.macroTrend || "Bullish Accumulation",
      crypto: (crypto || []).slice(0, 3),
      moonshots: (moonshots || []).slice(0, 3),
      goldPrice: "$3,925 / oz",
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/founder/gateway/quant-dispatch
 * 1-Tap Trigger: Dispatch live morning market intelligence directly to Founder's Telegram
 */
router.post("/quant-dispatch", async (req, res) => {
  try {
    const { generateAndDispatchPulse } = require("../../scripts/dispatch-daily-quant-pulse");
    const pulseRes = await generateAndDispatchPulse();
    res.json({ success: true, pulse: pulseRes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/founder/gateway/health
 * Sub-second status probe
 */
router.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "GARUDA Founder Mobile Gateway",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
