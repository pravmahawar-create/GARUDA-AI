const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function inspectFacebookProfile() {
  const cUser = process.env.FB_C_USER;
  const xs = process.env.FB_XS;

  if (!cUser || !xs) throw new Error("FB_C_USER or FB_XS missing in .env");

  console.log("🦅 [GARUDA FB PROFILE INSPECTOR] Launching browser to inspect Facebook profile...");
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

    console.log("▶ Navigating to Facebook Profile: https://www.facebook.com/me");
    await page.goto("https://www.facebook.com/me", { waitUntil: "domcontentloaded", timeout: 60000 });
    await new Promise(r => setTimeout(r, 6000));

    const profileUrl = page.url();
    const title = await page.title();
    console.log("Current Profile URL:", profileUrl);
    console.log("Page Title:", title);

    const screenshotPath = path.join(OUTPUT_DIR, "facebook_current_profile.png");
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log("✔ Saved screenshot:", screenshotPath);

    // Extract profile info
    const profileInfo = await page.evaluate(() => {
      const nameEl = document.querySelector("h1");
      const bioEl = document.querySelector("div[dir='auto'] span");
      const editProfileBtn = Array.from(document.querySelectorAll("div[role='button'], span")).find(b => (b.textContent || "").includes("Edit profile"));
      return {
        name: nameEl ? nameEl.innerText.trim() : "Unknown",
        hasEditProfile: Boolean(editProfileBtn),
        url: window.location.href
      };
    });

    console.log("Profile Info:", JSON.stringify(profileInfo, null, 2));

  } finally {
    await browser.close();
  }
}

inspectFacebookProfile().catch(err => {
  console.error("❌ FB Inspect Error:", err.message);
  process.exit(1);
});
