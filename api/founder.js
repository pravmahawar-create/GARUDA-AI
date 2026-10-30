/**
 * 🦅 GARUDA Founder Command API Handler
 * Phase 4 — Founder Command API
 *
 * Endpoints:
 * - GET /api/founder/command/status
 * - GET /api/founder/command/attention
 * - GET /api/founder/command/projects
 * - GET /api/founder/command/projects/:projectId
 * - GET /api/founder/command/events
 * - GET /api/founder/command/commercial
 */

const founderCommandService = require("../src/services/founderCommandService");

function cors(res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-founder-key, x-garuda-founder-key");
}

module.exports = async function handler(req, res) {
  cors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Parse Routing & Actions
  const host = (req.headers && req.headers.host) || "garudaos.in";
  const url = new URL(req.url, `https://${host}`);
  let pathStr = (req.query && (Array.isArray(req.query.path) ? req.query.path.join("/") : req.query.path)) || url.searchParams.get("path") || "";
  const cleanPath = url.pathname.replace(/^\/api\/founder(-command)?(\/command)?\/?/, "");
  const combinedPath = (pathStr || cleanPath || "").toLowerCase();

  // -------------------------------------------------------------
  // 24/7 SOVEREIGN MOBILE GATEWAY (CHAT, STATE, KEYS, DISPATCH)
  // -------------------------------------------------------------
  if (combinedPath.startsWith("gateway")) {
    const subPath = combinedPath.replace(/^gateway\/?/, "").toLowerCase();
    const founderGatewayService = require("../src/services/founderGatewayService");

    try {
      if (subPath.startsWith("chat") && req.method === "POST") {
        const { message, history } = req.body || {};
        if (!message) {
          return res.status(400).json({ success: false, error: "Message is required" });
        }
        const reply = await founderGatewayService.chatWithFounder({ message, history });
        return res.status(200).json(reply);
      }
      if (subPath.startsWith("state")) {
        const state = await founderGatewayService.getGatewayState();
        return res.status(200).json(state);
      }
      if (subPath.startsWith("keys")) {
        if (req.method === "POST") {
          const { provider, key } = req.body || {};
          const reg = founderGatewayService.registerKey({ provider, key });
          return res.status(200).json(reg);
        }
        const keys = founderGatewayService.getKeyHealth();
        return res.status(200).json({ success: true, ...keys });
      }
      if (subPath.startsWith("dispatch") && req.method === "POST") {
        const { leadId, customNote } = req.body || {};
        const disp = await founderGatewayService.dispatchLeadOutreach({ leadId, customNote });
        return res.status(200).json(disp);
      }
      if (subPath.startsWith("quant-dispatch") && req.method === "POST") {
        const { generateAndDispatchPulse } = require("../scripts/dispatch-daily-quant-pulse");
        const pulseRes = await generateAndDispatchPulse();
        return res.status(200).json({ success: true, pulse: pulseRes });
      }
      if (subPath.startsWith("quant-pulse")) {
        const { MarketDataFeed } = require("../src/services/alphaQuant/marketDataFeed");
        const { AlphaPotentialAgent } = require("../src/services/alphaQuant/alphaPotentialAgent");
        const dataFeed = new MarketDataFeed();
        const potentialAgent = new AlphaPotentialAgent();
        const [vix, macro, crypto, moonshots] = await Promise.all([
          dataFeed.fetchIndiaVix().catch(() => ({ vix: "15.3", regime: "Normal Volatility" })),
          dataFeed.fetchMacro15mTrend().catch(() => ({ macroTrend: "Bullish Accumulation" })),
          potentialAgent.scanPotentialOpportunities().catch(() => []),
          potentialAgent.scanSubRupeeMoonshots().catch(() => [])
        ]);
        return res.status(200).json({
          success: true,
          vixInfo: vix ? `${vix.vix || "15.3"} (${vix.regime || "Normal"})` : "15.3 (Normal)",
          macroTrend: macro?.macroTrend || "Bullish Accumulation",
          crypto: (crypto || []).slice(0, 3),
          moonshots: (moonshots || []).slice(0, 3),
          goldPrice: "$3,925 / oz",
          timestamp: new Date().toISOString()
        });
      }
    } catch (gwErr) {
      return res.status(500).json({ success: false, error: gwErr.message });
    }
  }

  // 1. Mandatory Founder Authentication & Authorization Gate (Command Center)
  try {
    founderCommandService.verifyFounderAuth(req);
  } catch (authErr) {
    const statusCode = authErr.statusCode || 401;
    return res.status(statusCode).json({
      success: false,
      error: {
        code: authErr.code || "UNAUTHORIZED",
        message: authErr.message || "Founder authentication required"
      }
    });
  }
  const pathParts = combinedPath.split(/[/,]+/).filter(Boolean);

  // If routing /api/founder/command/projects/proj_123
  // pathParts could be ["projects", "proj_123"] or ["command", "projects", "proj_123"]
  if (pathParts[0] === "command") {
    pathParts.shift();
  }

  const action = String(req.query.action || pathParts[0] || "status").toLowerCase();
  const targetId = req.query.projectId || req.query.id || pathParts[1] || "";

  try {
    // -------------------------------------------------------------
    // ACTION: COMMAND CENTER (GET /api/founder/command-center OR /api/founder/command/center)
    // -------------------------------------------------------------
    if (action === "command-center" || action === "center" || action === "snapshot" || action === "cockpit") {
      const snapshot = await founderCommandService.getCommandCenterSnapshot();
      return res.status(200).json({
        success: true,
        generatedAt: snapshot.generatedAt,
        data: snapshot
      });
    }

    // -------------------------------------------------------------
    // ACTION: STATUS (GET /api/founder/command/status)
    // -------------------------------------------------------------
    if (action === "status" || action === "kingdom" || action === "") {
      const data = await founderCommandService.getKingdomStatus();
      return res.status(200).json({
        success: true,
        generatedAt: new Date().toISOString(),
        data
      });
    }

    // -------------------------------------------------------------
    // ACTION: ATTENTION (GET /api/founder/command/attention)
    // -------------------------------------------------------------
    if (action === "attention" || action === "queue") {
      const attentionItems = await founderCommandService.getAttentionQueue();
      return res.status(200).json({
        success: true,
        generatedAt: new Date().toISOString(),
        data: {
          count: attentionItems.length,
          items: attentionItems
        }
      });
    }

    // -------------------------------------------------------------
    // ACTION: PROJECTS (GET /api/founder/command/projects OR /:projectId OR POST execute)
    // -------------------------------------------------------------
    if (action === "projects" || action === "project" || action === "execute-project") {
      if (req.method === "POST" && (pathParts[2] === "execute" || action === "execute-project" || req.query.execute === "true")) {
        const governedDelivery = require("../src/services/governedProjectDeliveryService");
        const executeProjectId = targetId || req.body?.projectId || pathParts[1];
        if (!executeProjectId) {
          return res.status(400).json({ success: false, error: { message: "projectId is required for execution" } });
        }
        const result = await governedDelivery.executeAndValidateDelivery(executeProjectId);
        return res.status(200).json({
          success: true,
          generatedAt: new Date().toISOString(),
          execution: result
        });
      }

      if (targetId) {
        const detail = await founderCommandService.getProjectCommandTimeline(targetId);
        return res.status(200).json({
          success: true,
          generatedAt: new Date().toISOString(),
          data: detail
        });
      }

      const projectsData = await founderCommandService.getProjects({
        limit: req.query.limit,
        status: req.query.status
      });

      return res.status(200).json({
        success: true,
        generatedAt: new Date().toISOString(),
        data: projectsData
      });
    }

    // -------------------------------------------------------------
    // ACTION: EVENTS (GET /api/founder/command/events)
    // -------------------------------------------------------------
    if (action === "events" || action === "event") {
      const eventsData = await founderCommandService.getRecentKingdomEvents({
        limit: req.query.limit,
        eventType: req.query.eventType,
        projectId: req.query.projectId,
        entityType: req.query.entityType,
        since: req.query.since
      });

      return res.status(200).json({
        success: true,
        generatedAt: new Date().toISOString(),
        data: eventsData
      });
    }

    // -------------------------------------------------------------
    // ACTION: COMMERCIAL (GET /api/founder/command/commercial)
    // -------------------------------------------------------------
    if (action === "commercial" || action === "revenue" || action === "pipeline") {
      const commercialData = await founderCommandService.getCommercialSnapshot();
      return res.status(200).json({
        success: true,
        generatedAt: new Date().toISOString(),
        data: commercialData
      });
    }

    // -------------------------------------------------------------
    // ACTION: WORKFORCE (GET /api/founder/command/workforce)
    // -------------------------------------------------------------
    if (action === "workforce" || action === "agents") {
      const workforceRouterService = require("../src/services/workforceRouterService");
      const telemetry = workforceRouterService.getWorkforceTelemetry();
      return res.status(200).json({
        success: true,
        generatedAt: new Date().toISOString(),
        data: telemetry
      });
    }

    // -------------------------------------------------------------
    // ACTION: DISPATCH (POST /api/founder/command/dispatch)
    // -------------------------------------------------------------
    if (action === "dispatch" || action === "agent-task") {
      const workforceRouterService = require("../src/services/workforceRouterService");
      const { agentId, input, goal } = req.body || {};
      if (!agentId && !goal) {
        return res.status(400).json({ success: false, error: { message: "agentId or goal is required" } });
      }
      const targetAgentId = agentId || "agent.lead_qualifier_pitcher";
      const result = await workforceRouterService.dispatchAgentTask(targetAgentId, input || { goal });
      return res.status(200).json({
        success: true,
        generatedAt: new Date().toISOString(),
        execution: result
      });
    }

    // Unknown action
    return res.status(404).json({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: `Unknown command action: ${action}`
      }
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: {
        code: err.code || "COMMAND_ERROR",
        message: err.message || "Founder command execution failure"
      }
    });
  }
};
