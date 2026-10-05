const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function inspectFacebookAbout() {
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

    await page.screenshot({ path: path.join(OUTPUT_DIR, "facebook_about_tab.png") });
    console.log("Saved about tab screenshot!");

    const tabs = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll("a, span, div[role='button']")).map(x => x.innerText?.trim()).filter(Boolean);
      return Array.from(new Set(links)).slice(0, 30);
    });

    console.log("About page items:", tabs);

  } finally {
    await browser.close();
  }
}

inspectFacebookAbout().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
