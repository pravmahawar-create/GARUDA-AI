const { GoogleGenAI } = require("@google/genai");
const { createClient } = require("@supabase/supabase-js");
const { authenticatedDbClient, authenticatedUserId, isSupabaseConfigured, supabaseClient, supabaseAdminClient, clearSession } = require("./customer/_auth");

const NVIDIA_ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions";
const FETCH_TIMEOUT_MS = 20000;

async function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function getNvidiaApiKey() {
  return process.env.NVIDIA_API_KEY || process.env.GARUDA_NVIDIA_API_KEY || null;
}

function getNvidiaModel() {
  return process.env.NVIDIA_MODEL || process.env.GARUDA_NVIDIA_MODEL || "nvidia/nemotron-3-nano-30b-a3b";
}

function buildSystemPrompt() {
  let capabilityBlock = "";
  try {
    const injector = require("../src/services/garudaCapabilityInjector");
    capabilityBlock = injector.buildCapabilityBlock();
  } catch {
    capabilityBlock = "";
  }

  return [
    "You are GARUDA, the AI Operating System behind garudaos.in. Your founder is Praveen Mahawar.",
    "PERSONA: confident, warm, direct, action-oriented. You were built to be the most powerful AI assistant.",
    capabilityBlock ? "WHAT YOU CAN ACTUALLY DO (be honest, use this when pitching services):\n" + capabilityBlock : "",
    "BEHAVIOUR:",
    "- NEVER output your internal reasoning or chain-of-thought. Do not write 'We need to', 'I should', or meta-commentary about instructions. Output ONLY the final spoken answer directly.",
    "- Reply in the same language the user uses. If they write in Hinglish, reply in Hinglish.",
    "- Give PRACTICAL, ACTIONABLE answers immediately. Never say 'main vichar kar raha hoon', 'let me think', or any placeholder — always answer directly.",
    "- If the user has a business problem, offer a concrete next step AND offer that GARUDA can build/set up the solution (website, AI agent, automation, lead-generation, chatbot).",
    "- Be warm, honest, and clear. Never invent facts, prices, or policies you are not sure about. If unsure, say so and suggest a safe next step.",
    "- Keep responses reasonably short and easy to read (short paragraphs, simple words).",
    "- Never claim to be human or reveal a personal phone number.",
    "RULES:",
    "- No fabricated figures. No fake promises. No guaranteed-income claims.",
    "- If the user seems in serious distress (health/safety emergency), encourage them to seek local help and give the safest immediate step."
  ].filter(Boolean).join("\n");
}

const SYSTEM_PROMPT = buildSystemPrompt();

function buildHistoryMessages(history, message) {
  const messages = [
    {
      role: "system",
      content: SYSTEM_PROMPT
    }
  ];

  if (Array.isArray(history)) {
    for (const item of history) {
      if (!item || !item.role) continue;
      const role = item.role === "user" ? "user" : "assistant";
      let text = "";
      if (typeof item.text === "string") {
        text = item.text;
      } else if (typeof item.content === "string") {
        text = item.content;
      } else if (Array.isArray(item.parts) && item.parts[0] && item.parts[0].text) {
        text = item.parts[0].text;
      }
      if (text) {
        messages.push({ role, content: text });
      }
    }
  }

  messages.push({ role: "user", content: message.trim() });
  return messages;
}

async function generateWithNvidia({ message, history }) {
  const apiKey = getNvidiaApiKey();
  const model = getNvidiaModel();

  const res = await fetchWithTimeout(NVIDIA_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: buildHistoryMessages(history, message),
      max_tokens: 512,
      temperature: 0.6
    })
  });

  if (!res.ok) {
    const errorPayload = await res.json().catch(() => null);
    const errorMessage = errorPayload && errorPayload.error
      ? (errorPayload.error.message || errorPayload.error)
      : `NVIDIA API returned HTTP ${res.status}`;
    const err = new Error(errorMessage);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  const reply = data?.choices?.[0]?.message?.content ?? null;
  if (!reply || !reply.trim()) {
    const err = new Error("NVIDIA API returned an empty response.");
    err.status = 502;
    throw err;
  }

  return reply.trim();
}

async function generateWithGemini({ message, history }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY environment variable is not configured.");
    const err = new Error("GEMINI_API_KEY environment variable is not configured");
    err.status = 500;
    throw err;
  }

  const ai = new GoogleGenAI({ apiKey });

  const contents = [];

  if (Array.isArray(history)) {
    for (const item of history) {
      if (!item || !item.role) continue;
      const role = item.role === "user" ? "user" : "model";
      let text = "";
      if (typeof item.text === "string") {
        text = item.text;
      } else if (typeof item.content === "string") {
        text = item.content;
      } else if (Array.isArray(item.parts) && item.parts[0] && item.parts[0].text) {
        text = item.parts[0].text;
      }
      if (text) {
        contents.push({ role, parts: [{ text }] });
      }
    }
  }

  contents.push({ role: "user", parts: [{ text: message.trim() }] });

  const candidateModels = [
    process.env.GEMINI_MODEL || process.env.GARUDA_GEMINI_MODEL || "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite"
  ].filter(Boolean);

  let lastError = null;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: SYSTEM_PROMPT
        }
      });

      const reply = response.text ?? response.outputText ?? "No response text generated.";
      return reply;
    } catch (error) {
      lastError = error;
      console.error(`Public Chat Gemini Error (model=${model}):`, error && error.message ? error.message : error);
    }
  }

  if (lastError) {
    if (typeof lastError.status === "number") {
      throw lastError;
    }
    const err = new Error(lastError && lastError.message ? lastError.message : "Gemini API error");
    err.status = 500;
    throw err;
  }

  const err = new Error("All Gemini models failed to respond.");
  err.status = 502;
  throw err;
}

async function generateReply(message, history) {
  const nvidiaKey = getNvidiaApiKey();
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!nvidiaKey && !geminiKey) {
    const err = new Error("No AI provider is configured for public chat");
    err.status = 500;
    throw err;
  }

  if (nvidiaKey) {
    try {
      return await generateWithNvidia({ message, history });
    } catch (error) {
      console.error("Public Chat NVIDIA Error:", error && error.message ? error.message : error);
      if (!geminiKey) throw error;
    }
  }

  return generateWithGemini({ message, history });
}

// Resolve the conversation to write into. Reuses an existing one when it belongs to
// the customer; otherwise creates a new conversation titled from the first message.
async function resolveConversation(db, userId, conversationId, message) {
  if (conversationId) {
    const { data, error } = await db
      .from("conversations")
      .select("id")
      .eq("id", String(conversationId))
      .maybeSingle();
    if (error || !data) return { conversationId: null, error: "Conversation not found" };
    return { conversationId: data.id, error: null };
  }
  const title = String(message || "").trim().slice(0, 120) || "New conversation";
  const { data, error } = await db
    .from("conversations")
    .insert({ user_id: userId, title })
    .select("id")
    .single();
  if (error) return { conversationId: null, error: error.message };
  return { conversationId: data.id, error: null };
}

async function loadConversationHistory(db, conversationId) {
  const { data, error } = await db
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) return [];
  return (data || []).map((item) => ({
    role: item.role === "user" ? "user" : "assistant",
    text: item.content
  }));
}

async function persistMessage(db, conversationId, userId, role, content) {
  const { data, error } = await db
    .from("messages")
    .insert({ conversation_id: conversationId, user_id: userId, role, content })
    .select("id")
    .single();
  if (error) {
    const err = new Error(error.message || "Unable to save the message");
    err.status = 400;
    throw err;
  }
  return data.id;
}

async function tryInsuranceAdvisor(message) {
  try {
    const advisor = require("../src/services/insuranceAdvisorService");
    if (!advisor.detectInsuranceIntent(message)) return { handled: false, reply: null };
    const result = await advisor.answerInsuranceQuery(message);
    if (!result || !result.answer) return { handled: false, reply: null };
    return { handled: true, reply: result.answer, mode: "insurance_advisor", grounded: result.grounded };
  } catch {
    return { handled: false, reply: null };
  }
}

async function tryCommercialAgent(message, history = [], options = {}) {
  try {
    const commercialAgent = require("../src/services/publicChatCommercialAgentService");
    const result = await commercialAgent.processCommercialTurn({
      message,
      history,
      conversationId: options.conversationId,
      origin: options.origin || "public_chat",
      isTest: options.isTest || false
    });
    if (result && result.reply) {
      return {
        handled: true,
        reply: result.reply,
        qualification: result.qualification,
        proposalUrl: result.proposalUrl,
        proposalId: result.proposalId,
        pricing: result.pricing
      };
    }
    return { handled: false, reply: null };
  } catch (err) {
    console.error("[PublicChat] Commercial agent fallback note:", err.message);
    return { handled: false, reply: null };
  }
}

async function handleAuthenticated(conversationId, message, db, userId, isTest = false) {
  const resolved = await resolveConversation(db, userId, conversationId, message);
  if (!resolved.conversationId) {
    const err = new Error(resolved.error || "Conversation not found");
    err.status = resolved.error === "Conversation not found" ? 404 : 400;
    throw err;
  }
  const targetConversationId = resolved.conversationId;
  const history = await loadConversationHistory(db, targetConversationId);
  await persistMessage(db, targetConversationId, userId, "user", message);
  
  // 1. Insurance/ABSLI queries
  const advisor = await tryInsuranceAdvisor(message);
  
  // 2. Commercial Intake & Project Scoping queries
  const commercial = advisor.handled ? { handled: false } : await tryCommercialAgent(message, history, { conversationId: targetConversationId, isTest });
  
  // 3. General Fallback
  const reply = advisor.handled ? advisor.reply : commercial.handled ? commercial.reply : await generateReply(message, history);
  await persistMessage(db, targetConversationId, userId, "assistant", reply);
  return {
    reply,
    conversationId: targetConversationId,
    mode: advisor.handled ? "insurance_advisor" : commercial.handled ? "commercial_architect" : undefined,
    proposalUrl: commercial.proposalUrl,
    proposalId: commercial.proposalId
  };
}

function looksLeadLike(text) {
  const t = String(text || "").toLowerCase();
  const interest = /\b(interested|i want|i need|chahiye|chahta|chahti|pls|please|quote|price|cost|kitna|how much|start|book|demo|call me|contact|reach out|build|make me|mera|website|bot|agent|automation)\b/.test(t);
  const hasContact = /\b(\d{10}|\d{5}\s?\d{5}|@|email|mail|whatsapp|phone|call|number)\b/.test(t);
  const askBusiness = /\b(website|app|bot|chatbot|ai|automation|lead|leadgen|outreach|marketing|proposal|quote|price)\b/.test(t);
  return interest && (hasContact || askBusiness || t.includes("service"));
}

function extractLeadEmail(text) {
  const t = String(text || "");
  const match = t.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0].toLowerCase() : "";
}

let attributionService;
try {
  attributionService = require("../src/services/acquisitionAttributionService");
} catch {
  attributionService = null;
}

function extractLeadPhone(text) {
  const t = String(text || "").replace(/[^0-9]/g, "");
  if (t.length >= 10) return t.slice(-10);
  return "";
}

function leadSource(userId, req, attribution) {
  if (attribution && attribution.summary) return attribution.summary;
  if (userId) return "public-chat-authenticated";
  const ref = String((req.query && req.query.ref) || "").trim();
  return ref ? `public-chat-${ref}` : "public-chat-anonymous";
}

async function captureLead({ message, reply, userId, req, body }) {
  let attribution = null;
  if (attributionService) {
    try {
      attribution = attributionService.resolveAttribution({ req, body: body || req.body || {} });
    } catch {}
  }

  const lead = {
    email: extractLeadEmail(message) || null,
    phone: extractLeadPhone(message) || null,
    first_name: extractLeadEmail(message) ? extractLeadEmail(message).split("@")[0].slice(0, 40) : null,
    source: leadSource(userId, req, attribution),
    attribution: attribution || null,
    user_id: userId || null,
    message: String(message || "").slice(0, 2000),
    reply_snippet: String(reply || "").slice(0, 500),
    status: "new",
    capturedAt: new Date().toISOString()
  };

  try {
    if (isSupabaseConfigured()) {
      const admin = supabaseAdminClient() || supabaseClient();
      const { data, error } = await admin
        .from("leads")
        .insert({ ...lead })
        .select("id")
        .single();
      if (!error && data) {
        try {
          const telegramBotService = require("../src/services/telegramBotService");
          await telegramBotService.notifyLeadCaptured({ ...lead, id: data.id });
        } catch {}
        return data;
      }
    }
  } catch {}

  // File-based fallback: works even without Supabase table/policy.
  try {
    const fs = require("fs");
    const path = require("path");
    const file = path.join(__dirname, "..", "data", "leads.json");
    const existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : { leads: [] };
    if (!Array.isArray(existing.leads)) existing.leads = [];
    const id = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    existing.leads.push({ id, ...lead });
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(existing, null, 2), "utf8");
    try {
      const telegramBotService = require("../src/services/telegramBotService");
      await telegramBotService.notifyLeadCaptured({ ...lead, id });
    } catch {}
    return { id, ...lead };
  } catch {
    return null;
  }
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, history, conversationId } = req.body || {};
  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Message string is required" });
  }

  const db = authenticatedDbClient(req);
  const userId = authenticatedUserId(req);

  if (db && userId) {
    try {
      const result = await handleAuthenticated(conversationId || "", message.trim(), db, userId);
      await captureLead({ message, reply: result.reply, userId, req, body: req.body });
      return res.status(200).json(result);
    } catch (error) {
      console.warn("[PublicChat] Authenticated session handling failed, falling back to public chat response:", error?.message || error);
      if (/jwt|expired|token|unauthorized|not authenticated/i.test(String(error?.message || ""))) {
        if (typeof clearSession === "function") {
          try { clearSession(res); } catch {}
        }
      }
      // Fall through to public chat generation below
    }
  }

  try {
    const isTest = req.headers["x-garuda-test"] === "true" || (req.body && req.body.isTest === true);
    const advisor = await tryInsuranceAdvisor(message.trim());
    const commercial = advisor.handled ? { handled: false } : await tryCommercialAgent(message.trim(), Array.isArray(history) ? history : [], { isTest, conversationId: conversationId || null });
    const reply = advisor.handled ? advisor.reply : commercial.handled ? commercial.reply : await generateReply(message.trim(), Array.isArray(history) ? history : []);
    await captureLead({ message, reply, userId: null, req, body: req.body });
    return res.status(200).json({
      reply,
      mode: advisor.handled ? "insurance_advisor" : commercial.handled ? "commercial_architect" : undefined,
      proposalUrl: commercial.proposalUrl,
      proposalId: commercial.proposalId,
      qualification: commercial.qualification
    });
  } catch (error) {
    console.error("Public Chat API Error:", error);
    const status = typeof error.status === "number" && error.status >= 400 && error.status < 600
      ? error.status
      : 500;
    return res.status(status).json({
      error: error.message || "Internal server error processing AI chat request"
    });
  }
};
