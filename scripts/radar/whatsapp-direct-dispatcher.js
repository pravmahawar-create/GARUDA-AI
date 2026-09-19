/**
 * 🦅 GARUDA SOVEREIGN WHATSAPP DIRECT DISPATCHER
 * Directly and autonomously dispatches personalized "Show > Tell" pitches
 * to qualified business targets via the authenticated WhatsApp Web session in data/whatsapp-session.
 */

const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");
require("dotenv").config();

const telegram = require("../../src/services/telegramBotService");
const QUEUE_FILE = path.join(__dirname, "..", "..", "data", "outreach_dispatch_queue.json");
const WA_LOG_FILE = path.join(__dirname, "..", "..", "data", "dispatched_wa_log.json");
const SESSION_DIR = path.join(__dirname, "..", "..", "data", "whatsapp-session");

function getWaLog() {
  if (fs.existsSync(WA_LOG_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(WA_LOG_FILE, "utf8"));
    } catch (e) {
      return [];
    }
  }
  return [];
}

function saveWaLog(log) {
  fs.writeFileSync(WA_LOG_FILE, JSON.stringify(log, null, 2), "utf8");
}

function findBrowserExecutable() {
  const chromePaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
  ];
  for (const p of chromePaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function dismissModals(page) {
  try {
    await page.evaluate(() => {
      // Dismiss 'What's new' or 'Continue'
      const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'));
      for (const b of buttons) {
        const txt = (b.innerText || "").toLowerCase().trim();
        if (txt.includes("continue") || txt.includes("not now") || txt.includes("ok")) {
          b.click();
        }
      }
    });
  } catch (e) {}
}

async function sendDirectWhatsAppMessage(page, phone, messageText) {
  let clean = String(phone || "").replace(/[^0-9]/g, "");
  if (clean.startsWith("0")) clean = clean.slice(1);
  const formattedPhone = clean.length === 10 ? `91${clean}` : clean;

  const encodedText = encodeURIComponent(messageText);
  const targetUrl = `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`;

  console.log(`\n▶ [WA DISPATCH] Navigating to +${formattedPhone}...`);
  await page.goto(targetUrl, { waitUntil: "networkidle2", timeout: 60000 });

  // Wait for hydration & dismiss modals
  console.log("⏳ Waiting for chat composer hydration (10s)...");
  await sleep(6000);
  await dismissModals(page);
  await sleep(4000);

  // Check if invalid phone popup appeared
  const isInvalidPhone = await page.evaluate(() => {
    const text = document.body ? document.body.innerText : "";
    const invalid = text.includes("Phone number shared via url is invalid");
    const hasBox = Boolean(document.querySelector('div[contenteditable="true"][role="textbox"]'));
    return invalid && !hasBox;
  });

  if (isInvalidPhone) {
    console.log(`⚠️ Invalid phone or WhatsApp not registered for: +${formattedPhone}`);
    return { ok: false, error: "invalid_phone_or_no_whatsapp" };
  }

  // Find send button or use Enter key
  const sendBtnSelector = 'span[data-icon="send"], button[data-testid="compose-btn-send"], span[data-testid="send"], button[aria-label*="Send"]';

  try {
    const sendBtn = await page.$(sendBtnSelector);
    if (sendBtn) {
      await sendBtn.click();
      console.log(`🚀 [SENT] Clicked Send button for +${formattedPhone}!`);
    } else {
      // Fallback to Enter key in textbox
      const textBox = await page.$('div[contenteditable="true"][role="textbox"]');
      if (textBox) {
        await textBox.focus();
        await page.keyboard.press("Enter");
        console.log(`🚀 [SENT] Dispatched via Enter key to +${formattedPhone}!`);
      } else {
        throw new Error("Could not find send button or chat composer");
      }
    }

    await sleep(4000);
    return { ok: true, phone: formattedPhone };
  } catch (err) {
    console.error(`❌ [WA DISPATCH FAILED] for +${formattedPhone}:`, err.message);
    return { ok: false, phone: formattedPhone, error: err.message };
  }
}

async function dispatchWhatsAppBatch(limit = 3) {
  const executablePath = findBrowserExecutable();
  if (!executablePath) {
    console.error("❌ Chrome executable not found.");
    return;
  }

  if (!fs.existsSync(QUEUE_FILE)) {
    console.error("❌ Queue file missing. Run multi-channel-dispatcher.js first.");
    return;
  }

  const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, "utf8"));
  const waLog = getWaLog();
  const sentPhones = new Set(waLog.map((w) => w.phone));

  const pending = queue.filter((q) => {
    let clean = String(q.phone || "").replace(/[^0-9]/g, "");
    if (clean.startsWith("0")) clean = clean.slice(1);
    const p = clean.length === 10 ? `91${clean}` : clean;
    return clean.length >= 10 && !sentPhones.has(p);
  });

  console.log(`🦅 [GARUDA DIRECT WA DISPATCHER] Found ${pending.length} pending WhatsApp targets.`);
  if (pending.length === 0) {
    console.log("✔ All eligible WhatsApp targets have already been dispatched!");
    return;
  }

  const batch = pending.slice(0, limit);
  console.log(`🚀 Disagreeing with manual clicks: Dispatching batch of ${batch.length} directly from GARUDA WhatsApp!`);

  const browser = await puppeteer.launch({
    executablePath,
    headless: "new",
    userDataDir: SESSION_DIR,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,800"]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Initial load to clear any lingering popups
    console.log("Warming up WhatsApp Web session...");
    await page.goto("https://web.whatsapp.com", { waitUntil: "networkidle2", timeout: 45000 });
    await sleep(5000);
    await dismissModals(page);

    for (const item of batch) {
      console.log(`\n🎯 Direct Outreach to: ${item.businessName} (${item.city})`);
      const result = await sendDirectWhatsAppMessage(page, item.phone, item.pitches.waPitch);

      let clean = String(item.phone || "").replace(/[^0-9]/g, "");
      if (clean.startsWith("0")) clean = clean.slice(1);
      const formattedPhone = clean.length === 10 ? `91${clean}` : clean;

      waLog.push({
        businessName: item.businessName,
        phone: formattedPhone,
        status: result.ok ? "DELIVERED" : "FAILED",
        error: result.error || null,
        dispatchedAt: new Date().toISOString()
      });
      saveWaLog(waLog);

      if (result.ok) {
        // Send notification to Founder Praveen on Telegram
        const alertTitle = `🟢 *WHATSAPP OUTREACH DELIVERED DIRECTLY!*`;
        const alertBody = 
          `🏢 *Business:* ${item.businessName}\n` +
          `📞 *Target Phone:* +${formattedPhone}\n` +
          `🌐 *Live Demo:* ${item.pitches.demoUrl}\n` +
          `💰 *Deal Size:* ${item.ticketSize}\n\n` +
          `GARUDA Autonomous Driver ne seedha unke WhatsApp par pitch deliver kar di hai!`;
        
        await telegram.sendFounderAlert(alertTitle, alertBody).catch(() => {});
      }

      // Safe delay between WhatsApp messages (15s) to ensure pristine account health
      console.log("⏳ Safety delay for WhatsApp messaging cadence (15s)...");
      await sleep(15000);
    }
  } catch (err) {
    console.error("❌ Fatal error in WhatsApp direct dispatcher:", err.message);
  } finally {
    await browser.close();
  }

  console.log("\n✔ WhatsApp direct dispatch batch completed!");
}

if (require.main === module) {
  const limitArg = process.argv[2] ? parseInt(process.argv[2], 10) : 3;
  dispatchWhatsAppBatch(limitArg).catch(console.error);
}

module.exports = { dispatchWhatsAppBatch, sendDirectWhatsAppMessage };
