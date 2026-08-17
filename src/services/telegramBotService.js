const llmProvider = require("./llmProvider");
const garudaCapabilityInjector = require("./garudaCapabilityInjector");
const garudaCommandRouter = require("./garudaCommandRouter");
const insuranceAdvisorService = require("./insuranceAdvisorService");
const telegramInsuranceWorker = require("./telegramInsuranceWorkerService");

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

async function sendFounderAlert(title, body) {
  if (!isConfigured()) return null;
  const text = `${title}\n\n${body}`;
  return sendMessage(text);
}

async function notifyLeadCaptured(lead) {
  if (!lead) return null;
  const summary = [
    `Naya lead aaya hai!`,
    `Source: ${lead.source || "unknown"}`,
    lead.email ? `Email: ${lead.email}` : null,
    lead.phone ? `Phone: ${lead.phone}` : null,
    lead.message ? `Message: ${String(lead.message).slice(0, 200)}` : null
  ].filter(Boolean).join("\n");
  return sendFounderAlert("GARUDA — New Lead", summary);
}

async function handleUpdate(update) {
  if (!isConfigured()) return null;
  const message = update && update.message ? update.message : null;
  if (!message || !message.text) return null;

  const chatId = String(message.chat && message.chat.id !== undefined ? message.chat.id : "");
  if (!chatId) return null;

  const text = String(message.text || "").trim();
  const userId = String(message.from && message.from.id !== undefined ? message.from.id : "");
  const isFounder = Boolean(founderChatId() && chatId === String(founderChatId()));

  // 1) Founder chat: full command routing (real engines) + insurance worker.
  if (isFounder) {
    try {
      const commandResult = await garudaCommandRouter.dispatchCommand(text, { founderApproved: true });
      if (commandResult && commandResult.command && commandResult.message) {
        await sendMessage(commandResult.message, chatId);
        return {
          ok: true,
          chatId,
          userId,
          received: text,
          reply: commandResult.message,
          mode: "command",
          command: commandResult.command
        };
      }
    } catch {}
  }

  // 2) Insurance-related questions → grounded ABSLI advisor + conversation
  //    memory + need detection + qualification (founder AND public chats).
  if (insuranceAdvisorService.detectInsuranceIntent(text)) {
    const result = await telegramInsuranceWorker.handleInsuranceMessage(chatId, text);
    if (result && result.reply) {
      await sendMessage(result.reply, chatId);
      return {
        ok: true,
        chatId,
        userId,
        received: text,
        reply: result.reply,
        mode: "insurance_worker",
        grounded: result.advisorGrounded,
        signals: result.signals || [],
        leadId: result.leadId || null,
        qualificationStep: result.qualificationStep || null
      };
    }
  }

  // 3) Non-founder, non-insurance → friendly helpful answer via the guarded LLM
  //    (no hallucination: skip knowledge/runtime context, transparent persona).
  //    Falls back to a static pointer if the LLM is unavailable.
  if (!isFounder) {
    let answer = null;
    try {
      const reply = await llmProvider.ask({
        systemContext:
          "This message came from a public Telegram user, not the founder. " +
          "Be warm, honest, and concise in the user's own language. Never invent figures, " +
          "prices, or policies. For insurance-related questions, keep it brief and mention " +
          "that GARUDA is an AI Financial Advisor (Aditya Birla Sun Life ABSLI partner) and " +
          "can answer from verified ABSLI knowledge.",
        userMessage: text,
        conversationHistory: [],
        skipKnowledge: true,
        skipRuntimeContext: true
      });
      const raw = reply && typeof reply.answer === "string" ? reply.answer.trim() : "";
      if (raw) answer = trimConciseReply(raw);
    } catch {}
    const reply =
      answer && answer.length
        ? answer
        : "GARUDA is your AI Financial Advisor for ABSLI insurance queries. " +
          "Ask me about term insurance, health insurance, child education plans, savings, or retirement. " +
          "Main official ABSLI knowledge se hi jawab deta hoon — koi figure bina source ke nahi.";
    await sendMessage(reply, chatId);
    return { ok: true, chatId, userId, received: text, reply, mode: "public_llm" };
  }

  const reply = await llmProvider.ask({
    systemContext: "This message came through the founder's Telegram superman bot.",
    userMessage: text,
    conversationHistory: [],
    skipKnowledge: true,
    skipRuntimeContext: true,
    fastLane: true
  });

  const answer = reply && typeof reply.answer === "string" && reply.answer.trim()
    ? trimConciseReply(reply.answer)
    : "GARUDA yahan hai bhai — thoda der me jawab deta hoon. Abhi engine load ho raha hai.";

  await sendMessage(answer, chatId);

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
