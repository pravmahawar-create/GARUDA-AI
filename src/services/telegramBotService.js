const llmProvider = require("./llmProvider");
const garudaCapabilityInjector = require("./garudaCapabilityInjector");
const garudaCommandRouter = require("./garudaCommandRouter");
const insuranceAdvisorService = require("./insuranceAdvisorService");
const telegramInsuranceWorker = require("./telegramInsuranceWorkerService");
const conversationService = require("./conversationService");

const TELEGRAM_API = "https://api.telegram.org";

function botToken() {
  return process.env.TELEGRAM_BOT_TOKEN || null;
}

function founderChatId() {
  return process.env.TELEGRAM_FOUNDER_CHAT_ID || null;
}

function isConfigured() {
  return Boolean(botToken() && founderChatId());
}

async function telegramFetch(method, payload) {
  const token = botToken();
  if (!token) return null;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    return await res.json();
  } catch (error) {
    return { ok: false, error: error && error.message ? error.message : "telegram_fetch_failed" };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function sendMessage(text, chatId) {
  const target = chatId || founderChatId();
  if (!target || !botToken()) return null;
  return telegramFetch("sendMessage", {
    chat_id: target,
    text: String(text || "").slice(0, 4096),
    disable_web_page_preview: true
  });
}

function trimConciseReply(reply) {
  const text = String(reply || "").trim();
  if (!text) return "";
  if (text.length <= 1200) return text;
  const split = text.split(/\n\n+/);
  let out = "";
  for (const block of split) {
    if ((out + "\n\n" + block).trim().length <= 1200) {
      out = (out + "\n\n" + block).trim();
    } else {
      break;
    }
  }
  if (!out) return text.slice(0, 1200);
  return out;
}

// Honest degraded reply for the founder when the generative engine produced no
// answer. NEVER lies ("engine load ho raha hai, thoda der me jawab") because
// the webhook is synchronous — no second reply ever follows. Amendment 7.
function buildEngineUnavailableReply(llmResult) {
  const base =
    "GARUDA yahan hai, lekin AI engine abhi available nahi hai — isliye main " +
    "abhi jawab nahi de sakta. Engine wapas online hote hi main jawab dunga.";
  const reason = llmResult && llmResult.error ? llmResult.error : null;
  const warning = llmResult && Array.isArray(llmResult.warnings) && llmResult.warnings.length
    ? llmResult.warnings[0]
    : null;
  const detail = reason || warning;
  if (!detail) return base;
  return `${base}\n\n[engine: ${detail}]`;
}

async function sendFounderAlert(title, body) {
  if (!isConfigured()) return null;
  const text = `${title}\n\n${body}`;
  return sendMessage(text);
}

async function notifyLeadCaptured(lead) {
  if (!lead) return null;
  const attr = lead.attribution || {};
  const summary = [
    `Naya lead aaya hai!`,
    lead.name ? `Name: ${lead.name}` : null,
    lead.scopeId ? `Scope Reference: #${lead.scopeId}` : null,
    lead.service ? `Service: ${lead.service}` : null,
    attr.channel ? `Channel: ${attr.channel}` : null,
    lead.source ? `Source / Campaign: ${lead.source}` : null,
    attr.landingPath ? `Landing Page: ${attr.landingPath}` : null,
    attr.referrerDomain ? `Referrer: ${attr.referrerDomain}` : null,
    lead.email ? `Email: ${lead.email}` : null,
    lead.phone ? `Phone: ${lead.phone}` : null,
    lead.message ? `Message: ${String(lead.message).slice(0, 300)}` : null
  ].filter(Boolean).join("\n");
  return sendFounderAlert("GARUDA — New Lead (Attributed)", summary);
}

function detectMediaKind(message) {
  if (!message) return null;
  if (Array.isArray(message.photo) && message.photo.length) return "photo";
  if (message.video) return "video";
  if (message.document) return "document";
  if (message.audio) return "audio";
  if (message.voice) return "voice_message";
  if (message.video_note) return "video_message";
  if (message.animation) return "animation";
  if (message.sticker) return "sticker";
  return null;
}

function telegramThreadId(chatId) {
  return `telegram:${String(chatId)}`;
}

async function loadChatHistory(chatId, limit = 8) {
  const WELCOME_TEXT = "Founder access granted. GARUDA is prepared to orchestrate your next move.";
  try {
    const thread = await conversationService.getOrCreateThread(telegramThreadId(chatId));
    const messages = Array.isArray(thread.messages) ? thread.messages : [];
    return messages
      .filter((m) => m && m.mode !== "telegram_insurance_state" && m.text !== WELCOME_TEXT)
      .slice(-limit)
      .map((m) => ({ role: m.role, content: m.text }));
  } catch {
    return [];
  }
}

async function persistChatExchange(chatId, userText, reply) {
  try {
    await conversationService.appendMessages(telegramThreadId(chatId), [
      { role: "user", text: String(userText || "").slice(0, 2000), mode: "telegram" },
      { role: "garuda", text: String(reply || "").slice(0, 4000), mode: "telegram" }
    ]);
  } catch {
    // Best-effort persistence; never block the reply.
  }
}

async function handleUpdate(update) {
  if (!isConfigured()) return null;
  const message = update && update.message ? update.message : null;
  if (!message) return null;

  const chatId = String(message.chat && message.chat.id !== undefined ? message.chat.id : "");
  if (!chatId) return null;

  const text = String(message.text || message.caption || "").trim();
  const userId = String(message.from && message.from.id !== undefined ? message.from.id : "");
  const isFounder = Boolean(founderChatId() && chatId === String(founderChatId()));

  const mediaKind = detectMediaKind(message);

  // Media-only message (photo/video/document/etc. with no caption): acknowledge
  // instead of silently dropping it, so users aren't left on "seen" forever.
  if (!text && mediaKind) {
    const reply =
      `Mila aapka ${mediaKind}. Main abhi media file ko directly dekh/padh nahi sakta — ` +
      `caption ya ek line mein likh dijiye ki is par mujhe kya karna hai, main us par kaam karta hoon.`;
    await persistChatExchange(chatId, `[${mediaKind}]`, reply);
    await sendMessage(reply, chatId);
    return { ok: true, chatId, userId, received: `[${mediaKind}]`, reply, mode: "media_ack" };
  }

  if (!text) return null;

  // 1) Command routing: Allow founder commands and slash commands
  const isCommand = text.startsWith("/") || /(^|\s)\/(leads|status|hunt|missions|botverse|help)\b/i.test(text);
  if (isFounder || isCommand) {
    try {
      const commandResult = await garudaCommandRouter.dispatchCommand(text, { founderApproved: true });
      if (commandResult && commandResult.command && commandResult.message) {
        const reply = `${commandResult.message}\n\n[EXECUTED: ${commandResult.command}]`;
        await sendMessage(reply, chatId);
        return {
          ok: true,
          chatId,
          userId,
          received: text,
          reply,
          mode: "command",
          command: commandResult.command
        };
      }
    } catch (error) {
      const errMsg = error && error.message ? error.message : String(error);
      const reply = `[COMMAND ERROR]\n${errMsg}\n\n[koi background task start nahi hua — ye real error hai]`;
      await sendMessage(reply, chatId);
      return {
        ok: true,
        chatId,
        userId,
        received: text,
        reply,
        mode: "command_error"
      };
    }
  }

  // 2) Insurance-related questions → grounded official ABSLI advisor + conversation
  //    memory + need detection + qualification (Core Insurance Vertical of GARUDA).
  if (insuranceAdvisorService.detectInsuranceIntent(text)) {
    const result = await telegramInsuranceWorker.handleInsuranceMessage(chatId, text);
    if (result && result.reply) {
      const groundedReply = `${result.reply}\n\n[🛡️ GROUNDED: Official ABSLI Insurance Intelligence]`;
      await sendMessage(groundedReply, chatId);
      return {
        ok: true,
        chatId,
        userId,
        received: text,
        reply: groundedReply,
        mode: "insurance_worker",
        grounded: result.advisorGrounded,
        signals: result.signals || [],
        leadId: result.leadId || null,
        qualificationStep: result.qualificationStep || null
      };
    }
  }

  // Shared conversation memory so the bot keeps context
  const conversationHistory = await loadChatHistory(chatId, 8);

  // 3) Multi-Domain AI Operating System Intelligence (ABSLI + Growth + Engineering)
  if (!isFounder) {
    let answer = null;
    try {
      const reply = await llmProvider.ask({
        systemContext:
          "You are GARUDA, the autonomous AI Operating System founded by Praveen Mahawar (garudaos.in). " +
          "You represent sovereign digital workforces across multiple vital industries: " +
          "1. Insurance Sector: Official ABSLI Life Insurance advisor and policy intelligence. " +
          "2. Growth & Revenue: Autonomous B2B lead hunting, cold client acquisition, and BOT-VERSE YouTube SEO. " +
          "3. Software Engineering: PAWAN autonomous coding agent and SaaS MVP systems. " +
          "Be warm, honest, respectful, and concise in the user's language (Hinglish/English). " +
          "If the user asks about life insurance, provide verified ABSLI advice. " +
          "If the user asks about business, leads, or YouTube, guide them with real capabilities.",
        userMessage: text,
        conversationHistory,
        skipKnowledge: true,
        skipRuntimeContext: true
      });
      const raw = reply && typeof reply.answer === "string" ? reply.answer.trim() : "";
      if (raw) answer = trimConciseReply(raw);
    } catch (err) { console.warn("[auto-recovery] suppressed error in telegramBotService.js:", String(err.message).slice(0,80)); }
    const reply =
      answer && answer.length
        ? answer
        : "🦅 GARUDA AI Operating System • Founder: Praveen Mahawar\n\n" +
          "Main aapki madad kar sakta hoon:\n" +
          "• 🛡️ ABSLI Life Insurance Plans & Policy Advisory\n" +
          "• 🎯 B2B Lead Hunting & Client Acquisition (/leads)\n" +
          "• 🌌 BOT-VERSE YouTube Direct Push & Video SEO\n" +
          "• ⚡ PAWAN Autonomous Software & Coding Engine\n\n" +
          "Aapko kis mission par kaam karna hai?";
    await persistChatExchange(chatId, text, reply);
    await sendMessage(reply, chatId);
    return { ok: true, chatId, userId, received: text, reply, mode: "public_llm" };
  }

  const reply = await llmProvider.ask({
    systemContext: "This message came through the founder's Telegram superman bot.",
    userMessage: text,
    conversationHistory,
    skipKnowledge: true,
    skipRuntimeContext: true,
    fastLane: true
  });

  const answer = reply && typeof reply.answer === "string" && reply.answer.trim() && !reply.error
    ? trimConciseReply(reply.answer)
    : buildEngineUnavailableReply(reply);

  await persistChatExchange(chatId, text, answer);
  const truthSuffix =
    "\n\n[CONVERSATIONAL ONLY — koi background task ya command execute nahi hua]" +
    "\n[Sach check karna ho to bhejo: /pipeline ya /status]";
  await sendMessage(answer + truthSuffix, chatId);

  return {
    ok: true,
    chatId,
    userId,
    received: text,
    reply: answer,
    provider: reply ? reply.provider : null,
    model: reply ? reply.model : null
  };
}

async function setWebhook(url) {
  const token = botToken();
  if (!token || !url) return null;
  return telegramFetch("setWebhook", { url });
}

async function getWebhookInfo() {
  return telegramFetch("getWebhookInfo", {});
}

module.exports = {
  founderChatId,
  getWebhookInfo,
  handleUpdate,
  isConfigured,
  notifyLeadCaptured,
  sendFounderAlert,
  sendMessage,
  setWebhook,
  trimConciseReply
};
