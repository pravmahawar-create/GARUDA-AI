/**
 * 🦅 GARUDA LinkedIn Interactive Launcher & Session Bridge
 * Launches Real Chrome on desktop with persistent session directory.
 * Waits for Founder/GARUDA login, confirms authentication, and locks session.
 */

const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const path = require("path");
const fs = require("fs");

const SESSION_DIR = path.resolve(__dirname, "../data/browser-sessions/linkedin");
const OUTPUT_DIR = path.resolve(__dirname, "../output");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function launchLogin() {
  console.log("=================================================================");
  console.log("🦅 GARUDA LINKEDIN REAL CHROME WINDOW LAUNCHER");
  console.log("Session Storage: " + SESSION_DIR);
  console.log("=================================================================\n");

  fs.mkdirSync(SESSION_DIR, { recursive: true });

  console.log("🚀 Opening visible Google Chrome window on your screen...");
  console.log("👉 Please enter your GARUDA / Company login credentials in the opened window.\n");

  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: false,
    defaultViewport: null,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--start-maximized",
      `--user-data-dir=${SESSION_DIR}`
    ]
  });

  try {
    const pages = await browser.pages();
    const page = pages.length > 0 ? pages[0] : await browser.newPage();
    await page.bringToFront();

    console.log("▶ Navigating to LinkedIn Feed / Login...");
    await page.goto("https://www.linkedin.com/login", { waitUntil: "domcontentloaded", timeout: 45000 });

    console.log("⏳ Autonomously monitoring window. Waiting for login completion (up to 5 minutes)...");

    let authenticated = false;
    const startTime = Date.now();

    while (Date.now() - startTime < 300000) {
      await new Promise(r => setTimeout(r, 3000));
      const currentUrl = page.url();

      if (
        (currentUrl.includes("/feed") || currentUrl.includes("/company/") || currentUrl.includes("/in/")) &&
        !currentUrl.includes("/login") &&
        !currentUrl.includes("/checkpoint") &&
        !currentUrl.includes("/uas/") &&
        !currentUrl.includes("/authwall")
      ) {
        authenticated = true;
        console.log("\n✅ [SUCCESS] Authenticated Session Detected!");
        console.log("   URL: " + currentUrl);
        console.log("   Title: " + (await page.title()));

        const proofPath = path.join(OUTPUT_DIR, "linkedin_session_active_proof.png");
        await page.screenshot({ path: proofPath });
        console.log("   Screenshot Evidence Saved: " + proofPath);
        break;
      }
    }

    if (!authenticated) {
      console.log("⚠️ 5 minutes elapsed without reaching active feed. Browser will remain open for your use.");
    } else {
      console.log("\n🔒 Session is now permanently preserved in D:\\GARUDA-AI\\data\\browser-sessions\\linkedin.");
    }
  } catch (err) {
    console.error("Browser error:", err.message);
  }
}

if (require.main === module) {
  launchLogin().catch(console.error);
}

module.exports = { launchLogin };
