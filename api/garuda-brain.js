/**
 * GARUDA Brain API
 *
 * Endpoints:
 * POST /api/brain/chat — Talk to GARUDA
 * GET /api/brain/context — Current context
 * GET /api/brain/history/:sessionId — Conversation history
 * POST /api/brain/think — Ask GARUDA to think about something
 * POST /api/brain/decide — Ask GARUDA to make a decision
 * POST /api/brain/debug — Ask GARUDA to debug code
 */

const brain = require("../src/services/garudaBrain");
const conversation = require("../src/services/garudaConversation");
const contextTracker = require("../src/services/contextTrackerService");

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const sessionId = req.headers["x-session-id"] || "default";

  try {
    // ─── POST /api/brain/chat — Talk to GARUDA ───
    if (path === "/api/brain/chat" && req.method === "POST") {
      const body = await readBody(req);
      const { message } = body;
      if (!message) return res.status(400).json({ ok: false, error: "Message required" });

      const result = await conversation.chat(sessionId, message);

      // Track context
      const understanding = await brain.understand(message);
      contextTracker.trackFromMessage(message, result.response, understanding);

      return res.status(200).json({
        ok: true,
        response: result.response,
        provider: result.provider,
        latencyMs: result.latencyMs,
        understanding
      });
    }

    // ─── GET /api/brain/context — Current context ───
    if (path === "/api/brain/context" && req.method === "GET") {
      const context = contextTracker.getCurrentContext();
      return res.status(200).json({ ok: true, context });
    }

    // ─── GET /api/brain/history/:sessionId ───
    if (path.startsWith("/api/brain/history/") && req.method === "GET") {
      const sid = path.split("/api/brain/history/")[1];
      const history = conversation.getHistory(sid);
      return res.status(200).json({ ok: true, history });
    }

    // ─── POST /api/brain/think — Ask GARUDA to think ───
    if (path === "/api/brain/think" && req.method === "POST") {
      const body = await readBody(req);
      const { prompt, systemPrompt } = body;
      if (!prompt) return res.status(400).json({ ok: false, error: "Prompt required" });

      const result = await brain.think(prompt, { systemPrompt });
      return res.status(200).json({ ok: true, ...result });
    }

    // ─── POST /api/brain/decide — Ask GARUDA to decide ───
    if (path === "/api/brain/decide" && req.method === "POST") {
      const body = await readBody(req);
      const { situation, options, constraints, context } = body;
      if (!situation || !options) return res.status(400).json({ ok: false, error: "Situation and options required" });

      const decision = await brain.decide({ situation, options, constraints, context });
      return res.status(200).json({ ok: true, decision });
    }

    // ─── POST /api/brain/debug — Ask GARUDA to debug ───
    if (path === "/api/brain/debug" && req.method === "POST") {
      const body = await readBody(req);
      const { code, error } = body;
      if (!code || !error) return res.status(400).json({ ok: false, error: "Code and error required" });

      const result = await brain.debug(code, error);
      return res.status(200).json({ ok: true, result });
    }

    // ─── GET /api/brain/health — Brain health check ───
    if (path === "/api/brain/health" && req.method === "GET") {
      const provider = brain.getProvider();
      return res.status(200).json({
        ok: true,
        provider: provider || "none configured",
        gemini: !!process.env.GEMINI_API_KEY,
        nvidia: !!process.env.NVIDIA_API_KEY,
        groq: !!process.env.GROQ_API_KEY
      });
    }

    return res.status(404).json({ ok: false, error: "Not found" });

  } catch (err) {
    console.error("[Brain API] Error:", err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
};

async function readBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
  });
}
