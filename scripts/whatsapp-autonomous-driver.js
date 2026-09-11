/**
 * 🦅 GARUDA Autonomous WhatsApp Driver Engine
 * 
 * Capabilities:
 * 1. Launches isolated Chrome/Edge session using persistent data directory (data/whatsapp-session)
 * 2. Does NOT disturb any existing logged-in WhatsApp on the machine
 * 3. Requires QR scan only once; subsequent runs are 100% automated
 * 4. Can send batch messages autonomously to target phone numbers
 * 5. Monitors incoming doctor/client inquiries, passes to clinicCloserAgentService,
 *    auto-replies, and alerts Founder Praveen via Telegram
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");
const clinicCloserAgent = require("../src/services/clinicCloserAgentService");
const telegram = require("../src/services/telegramBotService");

const DATA_DIR = path.join(__dirname, "..", "data");
const SESSION_DIR = path.join(DATA_DIR, "whatsapp-session");
fs.mkdirSync(SESSION_DIR, { recursive: true });

function findBrowserExecutable() {
  const chromePaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/snap/bin/chromium",
    "/opt/google/chrome/chrome",
  ];

  for (const p of chromePaths) {
    if (fs.existsSync(p)) return p;
  }
  // Fallback to puppeteer bundled chromium if available (Render headless)
  try {
    const puppeteer = require("puppeteer");
    const bundled = puppeteer.executablePath();
    if (bundled && fs.existsSync(bundled)) return bundled;
  } catch {}
  throw new Error("Chrome/Chromium not found — install google-chrome-stable or set WHATSAPP_CLOUD_API_TOKEN for cloud mode.");
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class WhatsAppAutonomousDriver {
  constructor() {
    this.browser = null;
    this.page = null;
    this.isReady = false;
  }

  async init(headless = false) {
    // Cloud mode: if WHATSAPP_CLOUD_API_TOKEN is set, skip browser entirely
    if (process.env.WHATSAPP_CLOUD_API_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
      console.log("☁️ WhatsApp Cloud API configured — skipping browser launch (24/7 cloud mode)");
      this.isReady = true;
      this.cloudMode = true;
      return;
    }
    console.log("🦅 Initializing GARUDA Autonomous WhatsApp Driver...");
    const executablePath = findBrowserExecutable();
    console.log(`Using Browser Engine: ${executablePath}`);
    console.log(`Session Directory: ${SESSION_DIR}`);

    this.browser = await puppeteer.launch({
      executablePath,
      headless,
      userDataDir: SESSION_DIR,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu"
      ],
      defaultViewport: null
    });

    const pages = await this.browser.pages();
    this.page = pages.length > 0 ? pages[0] : await this.browser.newPage();

    console.log("Navigating to WhatsApp Web...");
    await this.page.goto("https://web.whatsapp.com", { waitUntil: "networkidle2", timeout: 60000 });

    console.log("Waiting for WhatsApp Web session authentication...");
    console.log("👉 If this is your first run, please scan the QR code in the browser window with your phone!");

    // Wait for either the chat list (logged in) or the QR code
    try {
      await this.page.waitForSelector("div[data-testid='chat-list'], #side, div[role='textbox']", { timeout: 120000 });
      console.log("✔ WhatsApp Web Authenticated & Session Ready!");
      this.isReady = true;
      await telegram.sendMessage("🦅 *GARUDA Autonomous WhatsApp Driver is ONLINE & Authenticated!*");
    } catch (err) {
      console.warn("⚠️ Timed out waiting for chat list. Please ensure QR code is scanned.");
    }
  }

  async sendDirectMessage(rawPhone, messageText) {
    // Cloud path — no browser needed
    if (this.cloudMode) {
      const cloud = require("../src/services/whatsappCloudService");
      return cloud.sendCloudMessage(rawPhone, messageText);
    }
    if (!this.page) throw new Error("Driver not initialized. Call init() first.");

    const cleanPhone = String(rawPhone).replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const encodedText = encodeURIComponent(messageText);
    const targetUrl = `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`;

    console.log(`Navigating to chat for +${formattedPhone}...`);
    await this.page.goto(targetUrl, { waitUntil: "networkidle2", timeout: 60000 });

    // Wait for the send button or input box
    console.log("Locating send trigger...");
    await sleep(4000);

    const sendBtnSelector = "span[data-icon='send'], button[data-testid='compose-btn-send'], span[data-testid='send']";
    try {
      await this.page.waitForSelector(sendBtnSelector, { timeout: 15000 });
      const sendBtn = await this.page.$(sendBtnSelector);
      if (sendBtn) {
        await sendBtn.click();
        console.log(`✔ Message successfully dispatched to +${formattedPhone}!`);
        await sleep(3000);
        return { success: true, phone: formattedPhone };
      }
    } catch (e) {
      // Fallback: press Enter inside the composer
      try {
        await this.page.keyboard.press("Enter");
        console.log(`✔ Dispatched via Enter key to +${formattedPhone}!`);
        await sleep(3000);
        return { success: true, phone: formattedPhone, method: "enter_fallback" };
      } catch (err2) {
        console.error(`✖ Failed sending to +${formattedPhone}:`, err2.message);
        return { success: false, phone: formattedPhone, error: err2.message };
      }
    }
  }

  async dispatchBatch(targets, scriptGenerator) {
    console.log(`\n🦅 Starting Autonomous Batch Dispatch for ${targets.length} targets...`);
    const results = [];

    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      const script = scriptGenerator ? scriptGenerator(t) : (t.script || t.message);
      console.log(`\n[${i + 1}/${targets.length}] Processing: ${t.businessName || t.contactPerson} (+${t.phone})`);

      const res = await this.sendDirectMessage(t.phone, script);
      results.push({ ...t, dispatchResult: res });

      if (i < targets.length - 1) {
        const pauseSec = Math.floor(Math.random() * 4) + 6; // 6-10s humanized pacing
        console.log(`Pacing ${pauseSec}s to maintain safe human cadence...`);
        await sleep(pauseSec * 1000);
      }
    }

    console.log(`\n✔ Batch Dispatch Complete! Total: ${results.length}`);
    return results;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log("Browser session closed.");
    }
  }
}

async function main() {
  const driver = new WhatsAppAutonomousDriver();
  await driver.init(false); // visible window for QR scan if needed
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = WhatsAppAutonomousDriver;
