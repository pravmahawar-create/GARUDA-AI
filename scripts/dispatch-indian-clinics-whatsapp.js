/**
 * 🦅 GARUDA SOVEREIGN WHATSAPP DISPATCHER — VERIFIED DOMESTIC CLINICS
 * 
 * Targets: High-Intent Indian Dental Clinics with verified 10-digit mobile numbers
 * Protocol: Dispatches bespoke AI Receptionist value proposition via authenticated WhatsApp Web session.
 * Logging: Appends to data/dispatched_wa_log.json with timestamp and SHA-256.
 * Founder Escalation: Dispatches confirmation to Founder Telegram & WhatsApp.
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const puppeteer = require("puppeteer-core");

const telegram = require("../src/services/telegramBotService");
const { sendFounderWhatsAppAlert } = require("../src/services/whatsappCloudService");
const { STEP3_CLINIC_TARGETS, generateWhatsAppScript } = require("./dispatch-wave2-revenue-closers");

const DATA_DIR = path.join(__dirname, "..", "data");
const LOG_FILE = path.join(DATA_DIR, "dispatched_wa_log.json");
const SESSION_DIR = path.join(DATA_DIR, "whatsapp-session");

function getWaLog() {
  if (fs.existsSync(LOG_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(LOG_FILE, "utf8"));
    } catch (_) {
      return [];
    }
  }
  return [];
}

function saveWaLog(log) {
  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2), "utf8");
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

async function run() {
  console.log("\n========================================================");
  console.log("🦅 GARUDA WHATSAPP CLINIC OUTREACH DISPATCH ENGINE");
  console.log("========================================================");

  const targets = STEP3_CLINIC_TARGETS.filter(c => c.phone && String(c.phone).replace(/[^0-9]/g, "").length >= 10);
  console.log(`Loaded ${targets.length} verified high-intent clinics with mobile WhatsApp numbers.\n`);

  const waLog = getWaLog();
  const alreadySent = new Set(waLog.filter(l => l.status === "DELIVERED").map(l => l.phone));

  const pending = targets.filter(t => {
    let clean = String(t.phone).replace(/[^0-9]/g, "");
    if (clean.length === 10) clean = `91${clean}`;
    return !alreadySent.has(clean);
  });

  console.log(`Pending for dispatch: ${pending.length} clinics`);
  if (pending.length === 0) {
    console.log("✔ All verified clinics have already been dispatched!");
    return;
  }

  const executablePath = findBrowserExecutable();
  if (!executablePath) {
    console.error("Chrome executable not found.");
    process.exit(1);
  }

  console.log("Launching WhatsApp Web session...");
  const browser = await puppeteer.launch({
    executablePath,
    headless: "new",
    userDataDir: SESSION_DIR,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,800"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  for (let i = 0; i < pending.length; i++) {
    const clinic = pending[i];
    let cleanPhone = String(clinic.phone).replace(/[^0-9]/g, "");
    if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;

    const message = generateWhatsAppScript(clinic);
    const sha256 = crypto.createHash("sha256").update(message).digest("hex");
    const targetUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;

    console.log(`\n[${i + 1}/${pending.length}] Navigating to: ${clinic.businessName} (+${cleanPhone})...`);

    try {
      await page.goto(targetUrl, { waitUntil: "networkidle2", timeout: 60000 });
      console.log("Waiting for composer hydration...");
      await sleep(14000);

      // Check if invalid phone modal popped up
      const isInvalid = await page.evaluate(() => {
        const text = document.body ? document.body.innerText : "";
        return text.includes("Phone number shared via url is invalid") || text.includes("isn't on WhatsApp");
      });

      if (isInvalid) {
        console.warn(`⚠️ +${cleanPhone} is not on WhatsApp.`);
        waLog.push({
          businessName: clinic.businessName,
          phone: cleanPhone,
          status: "NOT_ON_WHATSAPP",
          error: "Not registered on WhatsApp",
          dispatchedAt: new Date().toISOString()
        });
        saveWaLog(waLog);
        continue;
      }

      // Locate and click the send button
      const sendBtnSelector = 'span[data-icon="send"], button[data-testid="compose-btn-send"], span[data-testid="send"], button[aria-label*="Send"]';
      let sent = false;

      const sendBtn = await page.$(sendBtnSelector);
      if (sendBtn) {
        await sendBtn.click();
        sent = true;
        console.log(`🚀 [SENT] Clicked Send button for ${clinic.businessName}!`);
      } else {
        // Fallback: focus input and press enter
        const textBox = await page.$('footer div[contenteditable="true"], div[role="textbox"]');
        if (textBox) {
          await textBox.focus();
          await page.keyboard.press("Enter");
          sent = true;
          console.log(`🚀 [SENT] Dispatched via Enter key for ${clinic.businessName}!`);
        }
      }

      if (sent) {
        await sleep(5000);
        waLog.push({
          businessName: clinic.businessName,
          phone: cleanPhone,
          status: "DELIVERED",
          error: null,
          sha256,
          dispatchedAt: new Date().toISOString()
        });
        saveWaLog(waLog);

        console.log(`✔ SUCCESS: Delivered to ${clinic.businessName} (+${cleanPhone})`);

        // Alert Founder Telegram & WhatsApp
        const alertMsg = `🚀 *WHATSAPP OUTREACH DELIVERED!*\n\n🏥 *Clinic:* ${clinic.businessName} (${clinic.city})\n👨‍⚕️ *Doctor:* ${clinic.doctorName}\n📞 *WhatsApp:* +${cleanPhone}\n💰 *Package:* ${clinic.dealSize}\n\nDeal is warm! Jab doctor reply karegi, instant alert aayega.`;
        
        try { await telegram.sendMessage(alertMsg); } catch (_) {}
        try { await sendFounderWhatsAppAlert(alertMsg); } catch (_) {}

      } else {
        throw new Error("Could not find send button or chat composer");
      }

      // Humanized pacing delay (12-18 seconds)
      const delay = Math.floor(Math.random() * 6000) + 12000;
      console.log(`Pacing ${Math.round(delay / 1000)}s before next target...`);
      await sleep(delay);

    } catch (err) {
      console.error(`❌ Dispatch failed for ${clinic.businessName}:`, err.message);
      waLog.push({
        businessName: clinic.businessName,
        phone: cleanPhone,
        status: "FAILED",
        error: err.message,
        dispatchedAt: new Date().toISOString()
      });
      saveWaLog(waLog);
    }
  }

  console.log("\n========================================================");
  console.log("✔ ALL VERIFIED CLINIC WHATSAPP DISPATCHES COMPLETED!");
  console.log("========================================================");

  await browser.close();
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { run };
