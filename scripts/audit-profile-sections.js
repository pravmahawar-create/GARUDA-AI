const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function captureFullProfile() {
  const cookieVal = process.env.LINKEDIN_LI_AT;
  if (!cookieVal) throw new Error("Missing LINKEDIN_LI_AT");

  console.log("🦅 Capturing full profile sections...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,900"]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setCookie({
      name: "li_at",
      value: cookieVal,
      domain: ".linkedin.com",
      path: "/",
      httpOnly: true,
      secure: true
    });

    await page.goto("https://www.linkedin.com/in/garuda-ai-ai-operating-system-227168432/?isSelfProfile=true", { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise(r => setTimeout(r, 6000));

    // Scroll down in steps and capture screenshots
    await page.screenshot({ path: path.join(OUTPUT_DIR, "profile_sec_1_header.png") });

    await page.evaluate(() => window.scrollBy(0, 700));
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, "profile_sec_2_mid.png") });

    await page.evaluate(() => window.scrollBy(0, 800));
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, "profile_sec_3_bottom.png") });

    console.log("✔ Profile screenshots captured in 3 sections!");

  } finally {
    await browser.close();
  }
}

captureFullProfile().catch(console.error);
