/**
 * GARUDA Telegram Superman Bot — One-shot setup.
 *
 * Usage:
 *   1. Put TELEGRAM_BOT_TOKEN in .env  (from @BotFather)
 *   2. In Telegram, send /start to your bot once (so it knows your chat id)
 *   3. Run:  node scripts/garuda-telegram-setup.js
 *
 * The script will:
 *   - Verify the bot token via getMe
 *   - Auto-detect your chat id from getUpdates (must have messaged the bot)
 *   - Write TELEGRAM_FOUNDER_CHAT_ID back into .env
 *   - Show how to register the webhook for live alerts
 */
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const ENV_PATH = path.join(__dirname, "..", ".env");
const API = "https://api.telegram.org";

function readEnv() {
  return fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, "utf8") : "";
}

function getEnv(key) {
  const env = readEnv();
  const line = env.split(/\r?\n/).find((l) => l.startsWith(key + "="));
  return line ? line.slice(key.length + 1).trim() : "";
}

function writeEnvKey(key, value) {
  const env = readEnv();
  const re = new RegExp(`^${key}=.*$`, "m");
  const line = `${key}=${value}`;
  const next = re.test(env) ? env.replace(re, line) : `${env.trimEnd()}\n${line}`;
  fs.writeFileSync(ENV_PATH, next.endsWith("\n") ? next : next + "\n", "utf8");
}

async function api(method, payload = {}) {
  const token = getEnv("TELEGRAM_BOT_TOKEN");
  if (!token) return { ok: false, error: "TELEGRAM_BOT_TOKEN missing in .env" };
  const res = await fetch(`${API}/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
}

async function main() {
  const token = getEnv("TELEGRAM_BOT_TOKEN");
  console.log("\n=== GARUDA TELEGRAM SETUP ===\n");

  if (!token) {
    console.log("1. Open Telegram and search for @BotFather.");
    console.log("2. Send /newbot, choose a name (e.g. GARUDA Superman).");
    console.log("3. It will give you a token like 123456:ABC-DEF...");
    console.log("4. Add this line to .env:\n");
    console.log("   TELEGRAM_BOT_TOKEN=<your token>\n");
    console.log("5. Re-run: node scripts/garuda-telegram-setup.js");
    return;
  }

  console.log("[1/3] Verifying bot token via getMe...");
  const me = await api("getMe");
  if (!me.ok) {
    console.log(`  FAILED: ${me.description || me.error || "invalid token"}`);
    return;
  }
  console.log(`  OK — Bot: @${me.result.username}`);

  console.log("[2/3] Detecting your chat id from getUpdates...");
  const updates = await api("getUpdates", { timeout: 20 });
  let chatId = getEnv("TELEGRAM_FOUNDER_CHAT_ID");

  if (!chatId && updates.ok && Array.isArray(updates.result) && updates.result.length) {
    const first = updates.result.find(
      (u) => u.message && u.message.chat && (u.message.chat.id !== undefined || u.message.from && u.message.from.id !== undefined)
    );
    if (first) {
      chatId = String(first.message.chat.id);
      console.log(`  Found chat id: ${chatId} (${first.message.chat.first_name || ""})`);
    }
  }

  if (!chatId) {
    console.log("  No chat id found yet.");
    console.log("  -> In Telegram, message your bot: /start");
    console.log("  -> Wait 2 seconds, then re-run: node scripts/garuda-telegram-setup.js");
    return;
  }

  writeEnvKey("TELEGRAM_FOUNDER_CHAT_ID", chatId);
  console.log(`  Saved TELEGRAM_FOUNDER_CHAT_ID=${chatId} into .env`);

  console.log("[3/3] Webhook registration:");
  const webhookUrl = process.env.GARUDA_PUBLIC_BASE_URL
    ? process.env.GARUDA_PUBLIC_BASE_URL.replace(/\/$/, "") + "/api/telegram"
    : process.env.GARUDA_WEBHOOK_URL
      ? process.env.GARUDA_WEBHOOK_URL
      : null;
  if (webhookUrl) {
    const webhook = await api("setWebhook", { url: webhookUrl });
    console.log(`  setWebhook(${webhookUrl}) -> ${webhook.ok ? "OK" : webhook.description || "failed"}`);
  } else {
    console.log("  Webhook NOT set. Set GARUDA_PUBLIC_BASE_URL in .env (e.g. https://your-app.onrender.com)");
    console.log("  and re-run, or register manually:  https://api.telegram.org/bot<TOKEN>/setWebhook?url=<PUBLIC>/api/telegram");
  }

  console.log("\nDONE. GARUDA Superman Bot is live. Test it: message your bot!");
}

main().catch((e) => {
  console.error("FATAL:", e && e.message ? e.message : e);
  process.exit(1);
});
