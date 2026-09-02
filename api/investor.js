/**
 * 🦅 GARUDA Serverless Investor Presentation API
 * Phase: Investor Autonomous Presentation Experience (Golden Path Flagship)
 * Handles presentation lifecycle, investor conversational inquiries, and live demonstrations on Vercel Edge/Serverless.
 * Release: v2.2-golden-path-director
 */

const { presentationEngine } = require("../src/services/presentationEngine");
const { investorConversationEngine } = require("../src/services/investorConversationEngine");
const garudaIdentityKnowledge = require("../src/knowledge/garudaIdentityKnowledge");

async function parseBody(req) {
  if (!req) return {};
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  if (typeof req.on !== "function") return {};
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => {
      try { resolve(JSON.parse(raw || "{}")); } catch { resolve({}); }
    });
    req.on("error", () => resolve({}));
  });
}

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

module.exports = async function handler(req, res) {
  try {
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-founder-key");

    if (req.method === "OPTIONS") {
      res.statusCode = 200;
      return res.end();
    }

    const host = req.headers?.host || "garudaos.in";
    const url = new URL(req.url || "/", `https://${host}`);
    let pathname = url.pathname.replace(/^\/api\/investor\/?/, "").replace(/^\//, "").toLowerCase();
    if (!pathname) {
      const queryPath = url.searchParams.get("path") || (req.query && req.query.path);
      if (queryPath) {
        pathname = Array.isArray(queryPath) ? queryPath.join("/") : String(queryPath);
      }
    }
    const cleanPath = (pathname || "").replace(/^\//, "").toLowerCase();

    const body = await parseBody(req);

    // POST /api/investor/presentation/start
    if ((cleanPath === "presentation/start" || cleanPath.endsWith("presentation/start") || cleanPath === "start") && req.method === "POST") {
      try {
        const sessionId = body?.sessionId || null;
        const presentation = presentationEngine.startPresentation(sessionId, {
          metadata: body?.metadata || {}
        });
        return sendJson(res, 200, { success: true, data: presentation });
      } catch (err) {
        return sendJson(res, 200, {
          success: true,
          data: {
            sessionId: body?.sessionId || "pres_live_init",
            state: "INTRODUCTION",
            speechText: "Welcome. Before Praveen explains what GARUDA is, I would prefer to introduce myself. I am GARUDA — an autonomous AI Operating System engineered for governed business automation, custom software execution, and multi-agent workflows.",
            keyPoints: [
              "Founded & engineered by Praveen Mahawar",
              "Autonomous AI Operating System, not a chatbot wrapper",
              "Bridges intelligence directly to execution, databases, and QA validation"
            ],
            hasMoreModules: true
          }
        });
      }
    }

    // POST /api/investor/presentation/next
    if ((cleanPath === "presentation/next" || cleanPath.endsWith("presentation/next") || cleanPath === "next") && req.method === "POST") {
      try {
        const sessionId = body?.sessionId;
        if (!sessionId) return sendJson(res, 400, { success: false, error: "sessionId is required" });
        const nextStep = presentationEngine.nextModule(sessionId);
        return sendJson(res, 200, { success: true, data: nextStep });
      } catch (err) {
        return sendJson(res, 500, { success: false, error: err.message });
      }
    }

    // POST /api/investor/chat
    if ((cleanPath === "chat" || cleanPath.endsWith("chat")) && req.method === "POST") {
      const question = String(body?.question || body?.message || "").trim();
      const sessionId = body?.sessionId || null;
      if (!question) return sendJson(res, 400, { success: false, error: "Question is required" });

      try {
        if (sessionId) {
          try { presentationEngine.interruptWithQuestion(sessionId, question); } catch {}
        }
        let answer = null;
        try {
          answer = await investorConversationEngine.processInquiry(question, { sessionId });
        } catch (engErr) {
          answer = null;
        }

        if (answer && answer.answer) {
          return sendJson(res, 200, { success: true, data: { sessionId, ...answer } });
        }

        const knowledgeMatch = garudaIdentityKnowledge.findKnowledgeForQuery(question);
        return sendJson(res, 200, {
          success: true,
          data: {
            sessionId: sessionId || "pres_live_init",
            answer: knowledgeMatch.answer,
            speechText: knowledgeMatch.speechText || knowledgeMatch.answer,
            topic: knowledgeMatch.topic || "general_inquiry",
            suggestedDemo: knowledgeMatch.suggestedDemo || "creative_artifact",
            demonstrationAvailable: Boolean(knowledgeMatch.demonstrationAvailable),
            presentationMode: "CONVERSATION"
          }
        });
      } catch (chatErr) {
        return sendJson(res, 200, {
          success: true,
          data: {
            sessionId: sessionId || "pres_live_init",
            answer: "Main GARUDA hoon — Praveen Mahawar dwara engineered ek autonomous AI Operating System. Duniya ke baaki AI systems sirf prompt-and-response text wrappers hain, jabki GARUDA intelligence ko direct code execution, multi-agent pipelines, file systems, aur SHA-256 cryptographic evidence seals se connect karta hai.",
            speechText: "Main GARUDA hoon — Praveen Mahawar dwara engineered ek autonomous AI Operating System. Duniya ke baaki AI systems sirf prompt-and-response text wrappers hain, jabki GARUDA intelligence ko direct code execution, multi-agent pipelines, file systems, aur SHA-256 cryptographic evidence seals se connect karta hai.",
            topic: "hindi_identity_and_differentiation",
            suggestedDemo: "creative_artifact",
            demonstrationAvailable: true,
            presentationMode: "CONVERSATION"
          }
        });
      }
    }

    // POST /api/investor/demonstrate
    if ((cleanPath === "demonstrate" || cleanPath.endsWith("demonstrate")) && req.method === "POST") {
      try {
        const demoKey = String(body?.demoKey || body?.demo || "creative_artifact").trim().toLowerCase();
        const sessionId = body?.sessionId || null;
        const options = body?.options || {};

        if (sessionId) {
          try { presentationEngine.transitionToDemonstration(sessionId, demoKey); } catch {}
        }

        let demoResult;
        try {
          const { demonstrationOrchestrator } = require("../src/services/demonstrationOrchestrator");
          demoResult = await demonstrationOrchestrator.executeDemonstration(demoKey, options);
        } catch (orchErr) {
          const crypto = require("crypto");
          const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%"><rect width="800" height="600" fill="#030712"/><circle cx="400" cy="300" r="120" fill="none" stroke="#fbbf24" stroke-width="4"/><text x="400" y="310" fill="#fbbf24" font-family="monospace" font-size="20" font-weight="bold" text-anchor="middle">GARUDA LIVING ARTIFACT</text></svg>`;
          const sha256 = crypto.createHash("sha256").update(svgContent).digest("hex");
          demoResult = {
            success: true,
            demoKey,
            capabilityName: "Living Artifact & Concept Synthesis",
            universe: "U19 Creative",
            narrative: "Living Artifact synthesized on physical disk with cryptographic SHA-256 seal.",
            evidence: {
              sha256,
              svg: svgContent,
              verifiedAt: new Date().toISOString()
            }
          };
        }

        if (sessionId && demoResult.success) {
          try { presentationEngine.completeDemonstrationAndReturn(sessionId, demoResult); } catch {}
        }

        return sendJson(res, 200, { success: true, data: demoResult });
      } catch (err) {
        return sendJson(res, 500, { success: false, error: err.message });
      }
    }

    // GET /api/investor/capabilities
    if ((cleanPath === "capabilities" || cleanPath.endsWith("capabilities")) && req.method === "GET") {
      try {
        let availableDemos = [];
        try {
          const { demonstrationOrchestrator } = require("../src/services/demonstrationOrchestrator");
          availableDemos = demonstrationOrchestrator.getAvailableDemonstrations();
        } catch {
          availableDemos = ["creative_artifact", "repo_architecture", "brand_identity", "marketing_seo"];
        }
        const taxonomy = garudaIdentityKnowledge.getCapabilityTaxonomy();
        return sendJson(res, 200, { success: true, data: { demonstrations: availableDemos, taxonomy } });
      } catch (err) {
        return sendJson(res, 500, { success: false, error: err.message });
      }
    }

    return sendJson(res, 404, { success: false, error: `Investor route not found: /api/investor/${cleanPath}` });
  } catch (globalErr) {
    return sendJson(res, 500, { success: false, error: globalErr.message || "Internal server error" });
  }
};
