const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function inspectBioAndWork() {
  const cUser = process.env.FB_C_USER;
  const xs = process.env.FB_XS;

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

    await page.goto("https://www.facebook.com/me/about", { waitUntil: "domcontentloaded", timeout: 60000 });
    await new Promise(r => setTimeout(r, 6000));

    // Scroll down to the About content area
    await page.evaluate(() => window.scrollBy(0, 600));
    await new Promise(r => setTimeout(r, 2000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, "facebook_about_scrolled.png") });
    console.log("Saved scrolled about screenshot!");

    // Inspect buttons in the About view
    const buttons = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll("div[role='button'], span, a"));
      return items.map(i => i.innerText?.trim()).filter(t => t && (t.includes("bio") || t.includes("Bio") || t.includes("Add") || t.includes("Edit") || t.includes("work") || t.includes("Work")));
    });

    console.log("Actionable buttons in About:", Array.from(new Set(buttons)));

  } finally {
    await browser.close();
  }
}

inspectBioAndWork().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
