const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function checkFacebookGroup() {
  const cUser = process.env.FB_C_USER;
  const xs = process.env.FB_XS;

  if (!cUser || !xs) {
    throw new Error("FB_C_USER or FB_XS missing in .env");
  }

  console.log(`🦅 [GARUDA FB GROUP SCOUT] Navigating to GHL Automation Group...`);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");

    await page.setCookie(
      { name: "c_user", value: cUser.trim(), domain: ".facebook.com", path: "/", secure: true },
      { name: "xs", value: xs.trim(), domain: ".facebook.com", path: "/", httpOnly: true, secure: true }
    );

    const targetUrl = "https://www.facebook.com/groups/1844616979220134/";
    console.log(`▶ Navigating to: ${targetUrl}`);

    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await new Promise(r => setTimeout(r, 6000));

    const currentUrl = page.url();
    const title = await page.title();
    console.log("Current URL:", currentUrl);
    console.log("Title:", title);

    const screenshotPath = path.join(OUTPUT_DIR, "facebook_ghl_group.png");
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`✔ Saved screenshot: ${screenshotPath}`);

  } finally {
    await browser.close();
  }
}

checkFacebookGroup().catch(err => {
  console.error("❌ FB Group Error:", err.message);
  process.exit(1);
});
