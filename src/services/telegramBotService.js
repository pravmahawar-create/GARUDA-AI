const llmProvider = require("./llmProvider");
const garudaCapabilityInjector = require("./garudaCapabilityInjector");

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
  if (!founderChatId() || chatId !== String(founderChatId())) {
    return { ok: false, reason: "unauthorized_chat" };
  }

  const text = String(message.text || "").trim();
  const userId = String(message.from && message.from.id !== undefined ? message.from.id : "");

  const reply = await llmProvider.ask({
    systemContext: "This message came through the founder's Telegram superman bot.",
    userMessage: text,
    conversationHistory: [],
    skipKnowledge: true,
    skipRuntimeContext: true,
    fastLane: true
  });

  const answer = reply && typeof reply.answer === "string" && reply.answer.trim()
    ? reply.answer
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
  setWebhook
};
