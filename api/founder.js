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

  // 1. Mandatory Founder Authentication & Authorization Gate
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

  // 2. Parse Routing & Actions
  let pathStr = "";
  if (Array.isArray(req.query.path)) {
    pathStr = req.query.path.join("/");
  } else if (typeof req.query.path === "string") {
    pathStr = req.query.path;
  }

  const url = new URL(req.url, `https://${req.headers.host || "garudaos.in"}`);
  const cleanPath = url.pathname.replace(/^\/api\/founder(-command)?(\/command)?\/?/, "");
  const combinedPath = pathStr || cleanPath;
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
    // ACTION: PROJECTS (GET /api/founder/command/projects OR /:projectId)
    // -------------------------------------------------------------
    if (action === "projects" || action === "project") {
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
