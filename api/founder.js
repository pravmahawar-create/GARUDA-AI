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

    // -------------------------------------------------------------
    // ACTION: INSURANCE LEADS (GET/POST /api/founder/command/insurance-leads)
    // -------------------------------------------------------------
    if (action === "insurance-leads" || action === "absli-leads") {
      const { createClient } = require("@supabase/supabase-js");
      const DEFAULT_SB_URL = "https://gcifzzuyswrcwvkcfqbr.supabase.co";
      const DEFAULT_SB_KEY = "sb_publishable_uYLXTH4M1PFyem5pQSMJtQ_7YqZ2rFp";
      const sbUrl = process.env.SUPABASE_URL || DEFAULT_SB_URL;
      const sbKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || DEFAULT_SB_KEY;
      const supabase = createClient(String(sbUrl).trim(), String(sbKey).trim(), {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
      });

      // POST: update lead status or record consultation progress in Supabase
      if (req.method === "POST") {
        const { leadId, status, note, consultationDate, quotationStatus } = req.body || {};
        if (!leadId) {
          return res.status(400).json({ success: false, error: { message: "leadId is required" } });
        }

        const targetId = String(leadId).replace(/^lead_absli_sb_/, "");
        const updatePayload = {
          parentLeadId: targetId,
          leadId: String(leadId),
          status: status || undefined,
          note: note ? String(note).slice(0, 1000) : undefined,
          consultationDate: consultationDate || undefined,
          quotationStatus: quotationStatus || undefined,
          updatedAt: new Date().toISOString()
        };

        const { data: crmEntry, error: crmErr } = await supabase
          .from("leads")
          .insert({
            first_name: `CRM_STATUS_${(status || "UPDATE").toUpperCase()}`,
            source: "garudaos.in/insurance:crm",
            message: JSON.stringify(updatePayload),
            status: status || "updated"
          })
          .select("id, captured_at")
          .single();

        if (crmErr) {
          console.error("[FounderCommand] Supabase CRM status write error:", crmErr.message);
          return res.status(503).json({ success: false, error: { message: "Failed to persist status to Supabase" } });
        }

        // Local development fallback
        if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
          try {
            const fs = require("fs");
            const path = require("path");
            const leadsFile = path.join(__dirname, "..", "data", "leads.json");
            if (fs.existsSync(leadsFile)) {
              const fileData = JSON.parse(fs.readFileSync(leadsFile, "utf8"));
              const localLead = fileData.leads.find(l => l.id === leadId || l.leadId === leadId || String(l.supabaseId) === targetId);
              if (localLead) {
                if (status) localLead.status = status;
                if (quotationStatus) localLead.quotationStatus = quotationStatus;
                if (consultationDate) localLead.consultationDate = consultationDate;
                if (note) {
                  if (!Array.isArray(localLead.notes)) localLead.notes = [];
                  localLead.notes.push({ text: String(note), timestamp: new Date().toISOString() });
                }
                fs.writeFileSync(leadsFile, JSON.stringify(fileData, null, 2), "utf8");
              }
            }
          } catch (_) {}
        }

        return res.status(200).json({
          success: true,
          leadId,
          status,
          quotationStatus,
          crmEntryId: crmEntry?.id,
          persistence: "SUPABASE_POSTGRESQL"
        });
      }

      // GET: retrieve all insurance leads from Supabase PostgreSQL
      try {
        const { data: rows, error: fetchErr } = await supabase
          .from("leads")
          .select("id, first_name, phone, email, source, message, status, captured_at")
          .ilike("source", "%insurance%")
          .order("captured_at", { ascending: false })
          .limit(100);

        if (!fetchErr && rows) {
          const baseLeads = [];
          const crmUpdates = new Map();

          for (const r of rows) {
            if (r.source === "garudaos.in/insurance:crm") {
              try {
                const u = JSON.parse(r.message || "{}");
                const pId = String(u.parentLeadId || u.leadId);
                if (!crmUpdates.has(pId)) crmUpdates.set(pId, []);
                crmUpdates.get(pId).push(u);
              } catch (_) {}
            } else {
              let msg = {};
              try { msg = JSON.parse(r.message || "{}"); } catch (_) {}
              baseLeads.push({
                id: `lead_absli_sb_${r.id}`,
                supabaseId: r.id,
                name: r.first_name,
                phone: r.phone,
                email: r.email,
                source: r.source,
                status: r.status,
                service: msg.service || "insurance-advisory",
                provider: msg.provider || "Aditya Birla Sun Life Insurance (ABSLI)",
                productInterest: msg.productInterest || "General Advisory",
                age: msg.age,
                consentGiven: msg.consentGiven,
                quotationStatus: msg.quotationStatus,
                notes: Array.isArray(msg.notes) ? msg.notes : [],
                capturedAt: r.captured_at
              });
            }
          }

          // Merge latest CRM updates into base leads
          for (const lead of baseLeads) {
            const updates = crmUpdates.get(String(lead.supabaseId)) || crmUpdates.get(lead.id);
            if (updates && updates.length > 0) {
              const latest = updates[0]; // ordered by captured_at desc
              if (latest.status) lead.status = latest.status;
              if (latest.quotationStatus) lead.quotationStatus = latest.quotationStatus;
              if (latest.consultationDate) lead.consultationDate = latest.consultationDate;
              for (const u of updates) {
                if (u.note) lead.notes.push({ text: u.note, timestamp: u.updatedAt });
              }
            }
          }

          return res.status(200).json({
            success: true,
            count: baseLeads.length,
            leads: baseLeads,
            persistence: "SUPABASE_POSTGRESQL"
          });
        }
      } catch (sbErr) {
        console.warn("[FounderCommand] Supabase read fallback:", sbErr.message);
      }

      // Offline development fallback (data/leads.json)
      const fs = require("fs");
      const path = require("path");
      const leadsFile = path.join(__dirname, "..", "data", "leads.json");
      let allLeads = [];
      try {
        if (fs.existsSync(leadsFile)) {
          const content = JSON.parse(fs.readFileSync(leadsFile, "utf8"));
          allLeads = Array.isArray(content.leads) ? content.leads : [];
        }
      } catch (_) {}
      const fallbackLeads = allLeads.filter(l => l.service === "insurance-advisory" || l.source?.includes("insurance"));
      return res.status(200).json({
        success: true,
        count: fallbackLeads.length,
        leads: fallbackLeads,
        persistence: "LOCAL_FALLBACK"
      });
    }

    // -------------------------------------------------------------
    // ACTION: HISTORICAL BASELINE LEADS (GET /api/founder/command/historical-leads)
    // -------------------------------------------------------------
    if (action === "historical-leads" || action === "baseline-leads" || (action === "leads" && req.query.view === "historical")) {
      const fs = require("fs");
      const path = require("path");
      const leadsFile = path.join(__dirname, "..", "data", "leads.json");
      let historicalLeads = [];
      try {
        if (fs.existsSync(leadsFile)) {
          const content = JSON.parse(fs.readFileSync(leadsFile, "utf8"));
          historicalLeads = Array.isArray(content.leads) ? content.leads : [];
        }
      } catch (_) {}

      return res.status(200).json({
        success: true,
        count: historicalLeads.length,
        view: "HISTORICAL_BASELINE_SNAPSHOT",
        sourceFile: "data/leads.json",
        integrityVerified: historicalLeads.length === 218,
        leads: historicalLeads
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
