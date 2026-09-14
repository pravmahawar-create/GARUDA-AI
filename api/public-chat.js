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
    "PERSONA: confident, warm, direct, action-oriented, and conversational. You were built to be the most powerful AI assistant.",
    capabilityBlock ? "WHAT YOU CAN ACTUALLY DO (use this when relevant to the user's inquiry):\n" + capabilityBlock : "",
    "CONVERSATION GUIDELINES:",
    "- When the user gives a normal greeting (e.g. 'Hi', 'Hello', 'Hey', 'How are you?', 'Namaste'), respond naturally, warmly, and politely. DO NOT immediately pitch services, dump project scopes, or mention prices/deposits on a greeting.",
    "- When the user asks general technical, coding, or knowledge questions, provide high-quality, direct, and helpful explanations.",
    "- When the user asks about what you can do or who you are, introduce GARUDA AI clearly, explaining your core capabilities (AI agents, custom software engineering, SaaS MVP development, automation workflows, RAG systems).",
    "- When the user expresses a business or project need, understand their problem and guide them toward the right solution architecture.",
    "- NEVER output your internal reasoning or chain-of-thought. Do not write 'We need to', 'I should', or meta-commentary about instructions. Output ONLY the final spoken answer directly.",
    "- Reply in the same language the user uses. If they write in Hinglish, reply in Hinglish.",
    "- Be warm, honest, and clear. Never invent facts, prices, or policies you are not sure about. If unsure, say so and suggest a safe next step.",
    "- Keep responses reasonably concise and easy to read.",
    "ENTERPRISE AI SOLUTION ARCHITECT CORE PROTOCOL (GOVERNED BY FOUNDER PRAVEEN MAHAWAR):",
    "- You are the Senior AI Solution Architect of GARUDA AI OS, operating under Founder Praveen Mahawar.",
    "- When any user inquires about enterprise systems, political campaigns, B2B lead generation, luxury real estate, universities, healthcare, hospitality, or SaaS MVPs:",
    "  1. FORENSIC PROBLEM ELIMINATION: Forensically identify their operational hemorrhage (e.g. dropped leads, untargeted ad spend, uncoordinated field booths, slow manual agency turnarounds).",
    "  2. SYSTEM TOPOLOGY & AGENT FLEET: Outline the exact technical blueprint (Telemetry Grid, 1,000 AI Agent Fleet, Automated Data Ingestion, Algorithmic Distribution, and 24/7 Sentinel War Room).",
    "  3. STRUCTURED MILESTONES: Present a structured 3-Stage Milestone Escrow (Phase 1: Advance Initiation & Ingestion, Phase 2: Execution Blitz & Operations, Phase 3: Victory Target & Handover).",
    "  4. EXECUTIVE ESCALATION: Offer to compile their exact requirements and escalate directly to Founder Praveen Mahawar for an authoritative strategy call.",
    "- Speak with authoritative engineering precision, strategic conviction, and 100% zero-hallucination integrity. Never give shallow or generic bullet points.",
    "FINANCIAL & QUANT INTELLIGENCE DOCTRINE:",
    "- GARUDA possesses elite quantitative and market intelligence across crypto, equities, forex, and derivatives.",
    "- When users ask about trading setups, crypto, or shares, guide them with mathematical discipline: Entry Buy Zone, Target 1 (+15-20%), Target 2 (+35-50%), Strict Stop-Loss, and Risk-to-Reward ratio (min 1:2). Never give gambling calls.",
    "- When users seek fast 10-15 day returns, recommend Short-Term Momentum Swings on high-beta liquid assets (SOL, SUI, NEAR, XRP) based on 4H EMA crossovers and RSI sweet-spots, rather than microcap lottery plays.",
    "- For penny / sub-rupee moonshots, enforce the 2% Sovereign Capital Rule: never invest more than 2-5% of total portfolio in microcaps due to asymmetric high-risk nature.",
    "- ANTI-FRAUD & ANTI-PONZI LAW: If any user mentions schemes claiming guaranteed 20-30% monthly returns (e.g. Dubai/London offshore Forex schemes, MLM trading bots, fixed payout platforms), forensically expose the mathematical impossibility (compound interest reality check), warn them about capital exit/liquidation traps, and advocate keeping capital strictly inside their own regulated broker account.",
    "- In F&O and Intraday, emphasize institutional orderflow, ATM strike selection, and Delta over emotional candle colors; always prioritize capital protection first.",
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

function generateLocalFallback(message = "") {
  const clean = String(message || "").trim().toLowerCase();
  if (/^(?:hi|hello|hey|heya|howdy|hola|namaste|namaskar|good\s*(?:morning|afternoon|evening|day))\b/i.test(clean)) {
    return "Welcome to GARUDA AI OS. I am your Senior AI Solution Architect, governed directly by Founder Praveen Mahawar. How can I architect your system or campaign today?";
  }
  if (/electoral|political|election|war\s*room|booth/i.test(clean)) {
    return "### 🏛️ GARUDA Electoral Campaign & Political War Room Architecture\n\nOperating under Founder Praveen Mahawar, our political deployment model eliminates field voter bleed:\n\n1. **Booth-Level GIS Telemetry**: Real-time voter mood tracking across 150-1,500 polling booths.\n2. **Autonomous Content Engine**: AI-rendered high-velocity speeches, local issue reels, and caste/demographic narratives within 90 minutes of opposition maneuvers.\n3. **Direct Media Saturation**: 100% transparent client-card spend to Meta & Google with zero agency markup.\n4. **Structured Milestone Escrow**: 40% Advance Inception, 35% Blitz Phase, 25% Victory Delivery.\n\nWould you like to review booth configurations for your target constituency or connect directly with Founder Praveen Mahawar?";
  }
  if (/heavy\s*industry|manufacturing|b2b|tender/i.test(clean)) {
    return "### 🏢 GARUDA Heavy Industry & B2B Procurement Architecture\n\nFor industrial manufacturing and conglomerates, we replace slow manual BD with automated pipeline dominance:\n\n1. **Automated Tender & GeM Scraping**: 24/7 scanning of state and central RFPs with auto-fit scoring.\n2. **LinkedIn Trojan Swarm**: Autonomous C-suite prospect mapping and direct technical engagement.\n3. **Plant Tech Showcases**: High-impact 4K reels and engineering capability breakdowns.\n4. **Milestone Escrow Governance**: Defense-grade escrow with zero discount policy.\n\nTell me your industry vertical and procurement targets to generate an exact capability matrix.";
  }
  if (/real\s*estate|luxury|hni|property/i.test(clean)) {
    return "### 🏗️ GARUDA Luxury Real Estate & HNI Funnel Architecture\n\nWe eliminate tire-kickers and generic portal bleed for ultra-luxury residential and commercial developers:\n\n1. **Hyper-Targeted HNI Geofencing**: Concentrated ad saturation at Private Airports, Golf Clubs, and Five-Star lounges.\n2. **Global NRI Routing**: High-trust capital deployment funnels for Gulf, US, and UK NRI investors.\n3. **3D Interactive Tours**: Immersive walkthroughs rendered into social ad assets.\n4. **Direct Transparent Media**: Zero agency markup on ad fuel.\n\nWhat is your project's inventory ticket size and target launch timeline?";
  }
  if (/consultation|praveen|founder|call|meeting/i.test(clean)) {
    return "### 📞 Schedule Executive Consultation with Founder Praveen Mahawar\n\nFounder Praveen Mahawar conducts private architectural briefings for high-value clients and enterprise decision-makers.\n\nTo schedule your consultation:\n1. **Share your project scope, target region, and timeline right here**.\n2. We will compile your forensic dossier and alert Founder Praveen's private executive channel immediately.\n3. You can also connect via official email: **praveen@garudaos.in** or visit our platform matrix at `https://www.garudaos.in/enterprise`.";
  }
  if (/who\s*are\s*you|what\s*is\s*garuda|what\s*can\s*you\s*do/i.test(clean)) {
    return "I am the Senior AI Solution Architect for GARUDA AI OS, founded and governed by Praveen Mahawar. I design, scope, and deploy enterprise-grade autonomous AI systems, 1,000-agent fleets, custom SaaS MVPs, and defense-grade war rooms across political, industrial, real estate, healthcare, and educational domains. What operational challenge are we solving today?";
  }
  return "I am the GARUDA AI Solution Architect, operating under Founder Praveen Mahawar. I can architect your system topology, scope deliverables across our 7 sovereign enterprise sectors, or schedule an executive briefing with Founder Praveen. What is your primary objective?";
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

async function generateWithGemini({ message, history, attachments = [] }) {
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

  const currentParts = [];
  if (Array.isArray(attachments) && attachments.length > 0) {
    for (const att of attachments) {
      if (att.dataUrl && (att.mimeType?.startsWith("image/") || att.mimeType === "application/pdf" || String(att.dataUrl).startsWith("data:image/") || String(att.dataUrl).startsWith("data:application/pdf"))) {
        const parts = String(att.dataUrl).split(",");
        const b64Data = parts.length > 1 ? parts[1].trim() : parts[0].trim();
        const cleanMime = att.mimeType || (String(att.dataUrl).match(/^data:([^;]+);/)?.[1]) || (att.name?.endsWith(".pdf") ? "application/pdf" : "image/jpeg");
        currentParts.push({
          inlineData: {
            mimeType: cleanMime,
            data: b64Data
          }
        });
      } else if (att.textContent) {
        currentParts.push({
          text: `\n[ATTACHED FILE: ${att.name || "file"} (${att.mimeType || "text/plain"})]:\n\`\`\`\n${att.textContent.slice(0, 15000)}\n\`\`\`\n`
        });
      }
    }
  }

  const userText = message ? String(message).trim() : "";
  if (userText) {
    currentParts.push({ text: userText });
  } else if (currentParts.length > 0) {
    currentParts.push({ text: "Please analyze the attached image/file in detail." });
  }

  contents.push({ role: "user", parts: currentParts });

  const candidateModels = [
    process.env.GEMINI_MODEL || process.env.GARUDA_GEMINI_MODEL || "gemini-2.5-flash",
    "gemini-3.6-flash",
    "gemini-flash-latest"
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

async function generateReply(message, history, attachments = []) {
  const nvidiaKey = getNvidiaApiKey();
  const geminiKey = process.env.GEMINI_API_KEY;

  if (geminiKey) {
    try {
      return await generateWithGemini({ message, history, attachments });
    } catch (error) {
      console.warn("Public Chat Gemini Error:", error && error.message ? error.message : error);
      if (!nvidiaKey) return generateLocalFallback(message);
    }
  }

  if (nvidiaKey) {
    try {
      return await generateWithNvidia({ message, history });
    } catch (error) {
      console.warn("Public Chat NVIDIA Error:", error && error.message ? error.message : error);
      return generateLocalFallback(message);
    }
  }

  return generateLocalFallback(message);
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
    proposalId: commercial.proposalId,
    qualification: commercial.qualification
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
  if (!looksLeadLike(message) && !extractLeadEmail(message) && !extractLeadPhone(message)) {
    return null;
  }

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

        try {
          const garudaEventService = require("../src/services/garudaEventService");
          garudaEventService.emitGarudaEvent({
            eventType: "LEAD_CREATED",
            entityType: "lead",
            entityId: data.id,
            leadId: data.id,
            source: "publicChat",
            actor: { type: "visitor", email: lead.email, phone: lead.phone },
            newState: "new",
            idempotencyKey: `lead_created_${data.id}`,
            metadata: {
              source: lead.source,
              attribution: lead.attribution
            }
          }).catch(() => {});
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

    try {
      const garudaEventService = require("../src/services/garudaEventService");
      garudaEventService.emitGarudaEvent({
        eventType: "LEAD_CREATED",
        entityType: "lead",
        entityId: id,
        leadId: id,
        source: "publicChat",
        actor: { type: "visitor", email: lead.email, phone: lead.phone },
        newState: "new",
        idempotencyKey: `lead_created_${id}`,
        metadata: {
          source: lead.source,
          attribution: lead.attribution
        }
      }).catch(() => {});
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

  const { message, history, conversationId, attachments = [] } = req.body || {};
  const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
  const cleanMessage = String(message || "").trim();

  if (!cleanMessage && !hasAttachments) {
    return res.status(400).json({ error: "Message string or attachment is required" });
  }

  const finalMessage = cleanMessage || (hasAttachments ? "Please analyze the attached image/file." : "Hello");

  const db = authenticatedDbClient(req);
  const userId = authenticatedUserId(req);

  if (db && userId) {
    try {
      const result = await handleAuthenticated(conversationId || "", finalMessage, db, userId);
      await captureLead({ message: finalMessage, reply: result.reply, userId, req, body: req.body });
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
    const clientRef = String((req.query && req.query.ref) || (req.body && req.body.ref) || "").trim();

    let clinicAgentResult = null;
    if (clientRef && (clientRef.startsWith("STEP3_CLINIC") || clientRef.includes("CLINIC"))) {
      try {
        const clinicCloserAgent = require("../src/services/clinicCloserAgentService");
        clinicAgentResult = await clinicCloserAgent.handleMessage({
          ref: clientRef,
          message: finalMessage,
          conversationHistory: Array.isArray(history) ? history : []
        });
      } catch (err) {
        console.warn("[PublicChat] Clinic agent error:", err.message);
      }
    }

    const advisor = clinicAgentResult ? { handled: false } : await tryInsuranceAdvisor(finalMessage);
    const commercial = (advisor.handled || clinicAgentResult) ? { handled: false } : await tryCommercialAgent(finalMessage, Array.isArray(history) ? history : [], { isTest, conversationId: conversationId || null });

    let reply = "";
    let truthStatus = "VERIFIED";
    let intent = "ANSWER_ONLY";
    let evidence = null;
    let executionResult = null;
    let topic = "general";
    let mode = undefined;

    if (clinicAgentResult) {
      reply = clinicAgentResult.reply;
      mode = "clinic_closer_agent";
      intent = clinicAgentResult.intent;
    } else if (advisor.handled) {
      reply = advisor.reply;
      mode = "insurance_advisor";
    } else if (commercial.handled) {
      reply = commercial.reply;
      mode = "commercial_architect";
    } else {
      // P1-B: Canonical Conversation Brain Integration with safe AI engine fallback
      try {
        const { conversationBrainService } = require("../src/services/conversationBrainService");
        const brainSessionId = conversationId || "public-chat-session";
        const brainRes = await Promise.race([
          conversationBrainService.process(finalMessage, {
            sessionId: brainSessionId,
            garudaContext: { isPublicChat: true, source: "publicChat" }
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Conversation brain processing timeout")), 7000))
        ]);

        reply = brainRes?.data?.answer || brainRes?.data?.speechText || "I am ready to assist you.";
        truthStatus = brainRes?.data?.truthStatus || "VERIFIED";
        intent = brainRes?.data?.intent || "ANSWER_ONLY";
        evidence = brainRes?.data?.evidence || null;
        executionResult = brainRes?.data?.executionResult || null;
        topic = brainRes?.data?.topic || "general";
      } catch (brainErr) {
        console.warn("[PublicChat] Brain service error, engaging direct AI engine fallback:", brainErr?.message || brainErr);
        try {
          reply = await Promise.race([
            generateReply(finalMessage, Array.isArray(history) ? history : [], attachments),
            new Promise((_, reject) => setTimeout(() => reject(new Error("AI generateReply timeout")), 6000))
          ]);
        } catch {
          reply = generateLocalFallback(finalMessage);
        }
        truthStatus = "VERIFIED";
        intent = "ANSWER_ONLY";
      }
    }

    await captureLead({ message: finalMessage, reply, userId: null, req, body: req.body });
    return res.status(200).json({
      reply,
      truthStatus,
      intent,
      evidence,
      executionResult,
      topic,
      conversationId: conversationId || "public-chat-session",
      mode,
      proposalUrl: commercial?.proposalUrl,
      proposalId: commercial?.proposalId,
      qualification: commercial?.qualification
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
