/**
 * GARUDA Feedback Dashboard API
 * GET /api/feedback/dashboard — Full analytics dashboard
 * GET /api/feedback/performance — Performance metrics only
 * GET /api/feedback/recommendations — Strategy recommendations
 * POST /api/feedback/record-reply — Record a reply
 * POST /api/feedback/import-logs — Import existing dispatch logs
 * POST /api/feedback/auto-adapt — Run auto-adaptation
 */

const feedbackLoop = require("../src/services/feedbackLoopService");
const analytics = require("../src/services/outreachAnalyticsService");
const decisions = require("../src/services/autonomousDecisionEngine");
const memory = require("../src/services/semanticMemoryService");
const selfAnalytics = require("../src/services/selfAnalyticsService");
const strategyEngine = require("../src/services/strategyEngineService");

module.exports = async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // ─── GET /api/feedback/dashboard ───
    if (path === "/api/feedback/dashboard" && req.method === "GET") {
      const dashboard = feedbackLoop.getDashboard();
      const fullReport = analytics.generateFullReport();
      return res.status(200).json({ ok: true, dashboard, report: fullReport });
    }

    // ─── GET /api/feedback/performance ───
    if (path === "/api/feedback/performance" && req.method === "GET") {
      const performance = feedbackLoop.analyzePerformance();
      return res.status(200).json({ ok: true, performance });
    }

    // ─── GET /api/feedback/recommendations ───
    if (path === "/api/feedback/recommendations" && req.method === "GET") {
      const recommendations = feedbackLoop.getStrategyRecommendations();
      return res.status(200).json({ ok: true, recommendations });
    }

    // ─── GET /api/feedback/templates ───
    if (path === "/api/feedback/templates" && req.method === "GET") {
      const templates = analytics.getTemplatePerformance();
      return res.status(200).json({ ok: true, templates });
    }

    // ─── GET /api/feedback/timing ───
    if (path === "/api/feedback/timing" && req.method === "GET") {
      const timing = analytics.analyzeSendTimes();
      return res.status(200).json({ ok: true, timing });
    }

    // ─── POST /api/feedback/record-reply ───
    if (path === "/api/feedback/record-reply" && req.method === "POST") {
      const body = await readBody(req);
      const { outreachId, replyText, sentiment } = body;
      if (!outreachId) {
        return res.status(400).json({ ok: false, error: "outreachId required" });
      }
      const result = feedbackLoop.recordReply(outreachId, { replyText, sentiment });
      return res.status(200).json({ ok: true, recorded: result });
    }

    // ─── POST /api/feedback/import-logs ───
    if (path === "/api/feedback/import-logs" && req.method === "POST") {
      const imported = feedbackLoop.importAllExistingLogs();
      return res.status(200).json({ ok: true, imported });
    }

    // ─── POST /api/feedback/auto-adapt ───
    if (path === "/api/feedback/auto-adapt" && req.method === "POST") {
      const adaptation = analytics.autoAdaptStrategy();
      return res.status(200).json({ ok: true, adaptation });
    }

    // ─── GET /api/feedback/strategy — Master strategy ───
    if (path === "/api/feedback/strategy" && req.method === "GET") {
      const strategy = strategyEngine.generateStrategy();
      return res.status(200).json({ ok: true, strategy });
    }

    // ─── GET /api/feedback/master — Full dashboard ───
    if (path === "/api/feedback/master" && req.method === "GET") {
      const master = strategyEngine.getMasterDashboard();
      return res.status(200).json({ ok: true, master });
    }

    // ─── GET /api/feedback/decisions — Decision summary ───
    if (path === "/api/feedback/decisions" && req.method === "GET") {
      const summary = decisions.getDecisionSummary();
      return res.status(200).json({ ok: true, summary });
    }

    // ─── POST /api/feedback/decisions/auto-run — Run auto decisions ───
    if (path === "/api/feedback/decisions/auto-run" && req.method === "POST") {
      const autoDecisions = decisions.runAutoDecisions();
      return res.status(200).json({ ok: true, autoDecisions });
    }

    // ─── GET /api/feedback/memory — Memory stats ───
    if (path === "/api/feedback/memory" && req.method === "GET") {
      const stats = memory.getMemoryStats();
      return res.status(200).json({ ok: true, stats });
    }

    // ─── POST /api/feedback/memory/store — Store a memory ───
    if (path === "/api/feedback/memory/store" && req.method === "POST") {
      const body = await readBody(req);
      const id = memory.storeMemory(body);
      return res.status(200).json({ ok: true, id });
    }

    // ─── GET /api/feedback/health — System health ───
    if (path === "/api/feedback/health" && req.method === "GET") {
      const health = selfAnalytics.healthCheck();
      return res.status(200).json({ ok: true, health });
    }

    // ─── GET /api/feedback/self — Self analytics ───
    if (path === "/api/feedback/self" && req.method === "GET") {
      const dashboard = selfAnalytics.getDashboard();
      return res.status(200).json({ ok: true, dashboard });
    }

    // ─── 404 ───
    return res.status(404).json({ ok: false, error: "Unknown endpoint" });

  } catch (e) {
    console.error("[FeedbackDashboard] Error:", e.message);
    return res.status(500).json({ ok: false, error: e.message });
  }
};

function readBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
}
