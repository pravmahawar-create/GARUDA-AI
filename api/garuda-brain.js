/**
 * GARUDA Brain API — All 6 Phases
 *
 * POST /api/brain/chat — Talk to GARUDA
 * POST /api/brain/think — Ask GARUDA to think
 * POST /api/brain/decide — Make a decision
 * POST /api/brain/chain-of-thought — Step-by-step reasoning
 * POST /api/brain/solve — Solve a problem
 * POST /api/brain/prioritize — Prioritize tasks
 * POST /api/brain/predict — Predict outcomes
 * POST /api/brain/explain-code — Explain code
 * POST /api/brain/generate-code — Generate code
 * POST /api/brain/review-code — Review code
 * POST /api/brain/debug-code — Debug code
 * POST /api/brain/generate-email — Generate cold email
 * POST /api/brain/generate-proposal — Generate proposal
 * POST /api/brain/generate-blog — Generate blog post
 * POST /api/brain/generate-report — Generate report
 * GET  /api/brain/context — Current context
 * GET  /api/brain/health — Brain health
 */

const brain = require("../src/services/garudaBrain");
const conversation = require("../src/services/garudaConversation");
const contextTracker = require("../src/services/contextTrackerService");
const codeIntel = require("../src/services/codeIntelligenceService");
const reasoning = require("../src/services/reasoningEngineService");
const creative = require("../src/services/creativeEngineService");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const sessionId = req.headers["x-session-id"] || "default";

  try {
    // ═══════════════════════════════════════════════════════════════════════
    // CORE — Phase 1-3
    // ═══════════════════════════════════════════════════════════════════════

    if (path === "/api/brain/chat" && req.method === "POST") {
      const body = await readBody(req);
      if (!body.message) return res.status(400).json({ ok: false, error: "Message required" });
      const result = await conversation.chat(sessionId, body.message);
      const understanding = await brain.understand(body.message);
      contextTracker.trackFromMessage(body.message, result.response, understanding);
      return res.status(200).json({ ok: true, response: result.response, provider: result.provider, latencyMs: result.latencyMs, understanding });
    }

    if (path === "/api/brain/think" && req.method === "POST") {
      const body = await readBody(req);
      if (!body.prompt) return res.status(400).json({ ok: false, error: "Prompt required" });
      const result = await brain.think(body.prompt, { systemPrompt: body.systemPrompt });
      return res.status(200).json({ ok: true, ...result });
    }

    if (path === "/api/brain/decide" && req.method === "POST") {
      const body = await readBody(req);
      if (!body.situation || !body.options) return res.status(400).json({ ok: false, error: "Situation and options required" });
      const decision = await brain.decide(body);
      return res.status(200).json({ ok: true, decision });
    }

    if (path === "/api/brain/context" && req.method === "GET") {
      return res.status(200).json({ ok: true, context: contextTracker.getCurrentContext() });
    }

    if (path === "/api/brain/health" && req.method === "GET") {
      return res.status(200).json({ ok: true, provider: brain.getProvider() || "none", gemini: !!process.env.GEMINI_API_KEY, nvidia: !!process.env.NVIDIA_API_KEY, groq: !!process.env.GROQ_API_KEY });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // REASONING — Phase 5
    // ═══════════════════════════════════════════════════════════════════════

    if (path === "/api/brain/chain-of-thought" && req.method === "POST") {
      const body = await readBody(req);
      if (!body.problem) return res.status(400).json({ ok: false, error: "Problem required" });
      const result = await reasoning.chainOfThought(body.problem, body);
      return res.status(200).json({ ok: true, ...result });
    }

    if (path === "/api/brain/solve" && req.method === "POST") {
      const body = await readBody(req);
      if (!body.problem) return res.status(400).json({ ok: false, error: "Problem required" });
      const result = await reasoning.solveProblem(body.problem, body);
      return res.status(200).json({ ok: true, ...result });
    }

    if (path === "/api/brain/prioritize" && req.method === "POST") {
      const body = await readBody(req);
      if (!body.tasks) return res.status(400).json({ ok: false, error: "Tasks required" });
      const result = await reasoning.prioritize(body.tasks);
      return res.status(200).json({ ok: true, ...result });
    }

    if (path === "/api/brain/predict" && req.method === "POST") {
      const body = await readBody(req);
      if (!body.action) return res.status(400).json({ ok: false, error: "Action required" });
      const result = await reasoning.predictOutcome(body);
      return res.status(200).json({ ok: true, ...result });
    }

    if (path === "/api/brain/tradeoffs" && req.method === "POST") {
      const body = await readBody(req);
      if (!body.optionA || !body.optionB) return res.status(400).json({ ok: false, error: "Two options required" });
      const result = await reasoning.analyzeTradeoffs(body);
      return res.status(200).json({ ok: true, ...result });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CODE INTELLIGENCE — Phase 4
    // ═══════════════════════════════════════════════════════════════════════

    if (path === "/api/brain/explain-code" && req.method === "POST") {
      const body = await readBody(req);
      if (!body.code) return res.status(400).json({ ok: false, error: "Code required" });
      const result = await codeIntel.explainCode(body.code, body);
      return res.status(200).json({ ok: true, ...result });
    }

    if (path === "/api/brain/generate-code" && req.method === "POST") {
      const body = await readBody(req);
      if (!body.description) return res.status(400).json({ ok: false, error: "Description required" });
      const result = await codeIntel.generateCode(body);
      return res.status(200).json({ ok: true, ...result });
    }

    if (path === "/api/brain/review-code" && req.method === "POST") {
      const body = await readBody(req);
      if (!body.code) return res.status(400).json({ ok: false, error: "Code required" });
      const result = await codeIntel.reviewCode(body.code, body);
      return res.status(200).json({ ok: true, ...result });
    }

    if (path === "/api/brain/debug-code" && req.method === "POST") {
      const body = await readBody(req);
      if (!body.code || !body.error) return res.status(400).json({ ok: false, error: "Code and error required" });
      const result = await codeIntel.debugCode(body.code, body.error, body);
      return res.status(200).json({ ok: true, ...result });
    }

    if (path === "/api/brain/refactor-code" && req.method === "POST") {
      const body = await readBody(req);
      if (!body.code) return res.status(400).json({ ok: false, error: "Code required" });
      const result = await codeIntel.refactorCode(body.code, body);
      return res.status(200).json({ ok: true, ...result });
    }

    if (path === "/api/brain/generate-tests" && req.method === "POST") {
      const body = await readBody(req);
      if (!body.code) return res.status(400).json({ ok: false, error: "Code required" });
      const result = await codeIntel.generateTests(body.code, body);
      return res.status(200).json({ ok: true, ...result });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CREATIVE — Phase 6
    // ═══════════════════════════════════════════════════════════════════════

    if (path === "/api/brain/generate-email" && req.method === "POST") {
      const body = await readBody(req);
      if (!body.recipient || !body.company) return res.status(400).json({ ok: false, error: "Recipient and company required" });
      const result = await creative.generateEmail(body);
      return res.status(200).json({ ok: true, ...result });
    }

    if (path === "/api/brain/generate-proposal" && req.method === "POST") {
      const body = await readBody(req);
      if (!body.client || !body.project) return res.status(400).json({ ok: false, error: "Client and project required" });
      const result = await creative.generateProposal(body);
      return res.status(200).json({ ok: true, ...result });
    }

    if (path === "/api/brain/generate-blog" && req.method === "POST") {
      const body = await readBody(req);
      if (!body.topic) return res.status(400).json({ ok: false, error: "Topic required" });
      const result = await creative.generateBlogPost(body);
      return res.status(200).json({ ok: true, ...result });
    }

    if (path === "/api/brain/generate-social" && req.method === "POST") {
      const body = await readBody(req);
      if (!body.topic) return res.status(400).json({ ok: false, error: "Topic required" });
      const result = await creative.generateSocialContent(body);
      return res.status(200).json({ ok: true, ...result });
    }

    if (path === "/api/brain/generate-report" && req.method === "POST") {
      const body = await readBody(req);
      if (!body.data) return res.status(400).json({ ok: false, error: "Data required" });
      const result = await creative.generateReport(body);
      return res.status(200).json({ ok: true, ...result });
    }

    if (path === "/api/brain/generate-pitch" && req.method === "POST") {
      const body = await readBody(req);
      if (!body.company || !body.product) return res.status(400).json({ ok: false, error: "Company and product required" });
      const result = await creative.generatePitchDeck(body);
      return res.status(200).json({ ok: true, ...result });
    }

    if (path === "/api/brain/generate-copy" && req.method === "POST") {
      const body = await readBody(req);
      if (!body.product || !body.audience) return res.status(400).json({ ok: false, error: "Product and audience required" });
      const result = await creative.generateMarketingCopy(body);
      return res.status(200).json({ ok: true, ...result });
    }

    if (path === "/api/brain/generate-followup" && req.method === "POST") {
      const body = await readBody(req);
      if (!body.originalEmail) return res.status(400).json({ ok: false, error: "Original email required" });
      const result = await creative.generateFollowup(body);
      return res.status(200).json({ ok: true, ...result });
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
    req.on("end", () => { try { resolve(JSON.parse(body)); } catch { resolve({}); } });
  });
}
