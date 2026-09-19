/**
 * 🦅 GARUDA SOVEREIGN REPLY MONITOR & FOUNDER INSTANT PINGER
 * Continuously / periodically monitors official GARUDA channels (Instagram Direct @garudaos.ai, WhatsApp, Email).
 * When ANY client replies or shows interest:
 * -> Instantly triggers high-priority alert to Founder Praveen's Telegram.
 */

const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
require("dotenv").config();

const telegram = require("../../src/services/telegramBotService");

const LOG_FILE = path.join(__dirname, "..", "..", "data", "reply_audit_log.json");
const POLL_INTERVAL_MS = 60000; // Poll every 60 seconds

function getSeenReplies() {
  if (fs.existsSync(LOG_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(LOG_FILE, "utf8"));
    } catch (e) {
      return [];
    }
  }
  return [];
}

function saveSeenReplies(seen) {
  fs.writeFileSync(LOG_FILE, JSON.stringify(seen, null, 2), "utf8");
}

async function checkInstagramReplies() {
  const sessionId = process.env.INSTAGRAM_SESSION_ID;
  const userId = process.env.INSTAGRAM_USER_ID;

  if (!sessionId || !userId) {
    console.log("⚠ [REPLY MONITOR] INSTAGRAM_SESSION_ID missing in .env.");
    return [];
  }

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,800"]
  });

  const newReplies = [];

  try {
    const page = await browser.newPage();
    await page.setCookie(
      {
        name: "sessionid",
        value: sessionId,
        domain: ".instagram.com",
        path: "/"
      },
      {
        name: "ds_user_id",
        value: userId,
        domain: ".instagram.com",
        path: "/"
      }
    );

    // 1. Check Primary Inbox
    await page.goto("https://www.instagram.com/direct/inbox/", { waitUntil: "networkidle2", timeout: 35000 });
    await new Promise((r) => setTimeout(r, 4000));

    const messages = await page.evaluate(() => {
      const items = [];
      const rows = document.querySelectorAll('div[role="listitem"], a[role="link"]');
      rows.forEach((r) => {
        const text = r.innerText ? r.innerText.trim() : "";
        if (text && text.length > 5 && !text.includes("Messages") && !text.includes("Requests")) {
          items.push({
            preview: text.replace(/\n+/g, " | "),
            href: r.href || null
          });
        }
      });
      return items;
    });

    return messages;
  } catch (err) {
    console.error("❌ [REPLY MONITOR] Error reading Instagram inbox:", err.message);
    return [];
  } finally {
    await browser.close();
  }
}

async function triggerFounderPing(leadInfo) {
  console.log(`🚨 [FOUNDER PING] Triggering instant alert for: ${leadInfo.sender || "Client"}...`);
  
  const alertTitle = `🚨 *HOT CLIENT REPLY DETECTED!*`;
  const alertBody = 
    `🏢 *Prospect:* ${leadInfo.sender || "Incoming Client"}\n` +
    `📱 *Channel:* Instagram Direct (@garudaos.ai)\n` +
    `💬 *Message:* "${leadInfo.message || leadInfo.preview}"\n` +
    `⏰ *Time:* ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}\n\n` +
    `👉 *Recommended Founder Action:* Deal is warm! Open Instagram / WhatsApp to close the ₹25,000–₹50,000 package.`;

  try {
    await telegram.sendFounderAlert(alertTitle, alertBody);
    console.log("✔ Founder Telegram ping dispatched successfully!");
  } catch (err) {
    console.error("❌ Failed to ping Founder Telegram:", err.message);
  }
}

async function runMonitorCycle() {
  console.log(`\n🦅 [GARUDA REPLY MONITOR] Checking for incoming client responses... [${new Date().toLocaleTimeString()}]`);
  const seen = getSeenReplies();
  const seenSet = new Set(seen.map((s) => s.id));

  const messages = await checkInstagramReplies();
  console.log(`   Found ${messages.length} conversation threads in @garudaos.ai inbox.`);

  for (const msg of messages) {
    const msgId = msg.preview.slice(0, 100);
    if (!seenSet.has(msgId)) {
      console.log(`   🔥 NEW MESSAGE FOUND: ${msg.preview}`);
      seen.push({
        id: msgId,
        preview: msg.preview,
        detectedAt: new Date().toISOString()
      });
      seenSet.add(msgId);

      // Ping Founder immediately!
      await triggerFounderPing({
        sender: msg.preview.split(" | ")[0] || "Instagram Prospect",
        message: msg.preview
      });
    }
  }

  saveSeenReplies(seen);
}

if (require.main === module) {
  console.log("🦅 [GARUDA REPLY MONITOR DAEMON] Initialized.");
  runMonitorCycle().then(() => {
    console.log("Cycle 1 complete. To run as continuous daemon, invoke with --watch");
    if (process.argv.includes("--watch")) {
      setInterval(runMonitorCycle, POLL_INTERVAL_MS);
    }
  });
}

module.exports = { runMonitorCycle, triggerFounderPing };
