const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

async function inspectProfileElements() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");

    await page.setCookie(
      { name: "c_user", value: process.env.FB_C_USER.trim(), domain: ".facebook.com", path: "/", secure: true },
      { name: "xs", value: process.env.FB_XS.trim(), domain: ".facebook.com", path: "/", httpOnly: true, secure: true }
    );

    console.log("Navigating to https://www.facebook.com/me ...");
    await page.goto("https://www.facebook.com/me", { waitUntil: "networkidle2", timeout: 45000 });
    await new Promise(r => setTimeout(r, 4000));

    // Screenshot of whole profile page
    const profileScreenshot = path.join(__dirname, "..", "output", "fb_profile_full_view.png");
    await page.screenshot({ path: profileScreenshot });
    console.log("Saved full view screenshot:", profileScreenshot);

    const elements = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll("div[role='button'], a, span, button"));
      return all
        .map(el => (el.innerText || "").trim())
        .filter(t => t.length > 0 && t.length < 50 && (
          t.toLowerCase().includes("edit") ||
          t.toLowerCase().includes("bio") ||
          t.toLowerCase().includes("intro") ||
          t.toLowerCase().includes("details") ||
          t.toLowerCase().includes("work") ||
          t.toLowerCase().includes("add")
        ));
    });

    console.log("Edit/Bio/Intro candidates:", Array.from(new Set(elements)));

  } finally {
    await browser.close();
  }
}

inspectProfileElements().catch(console.error);
