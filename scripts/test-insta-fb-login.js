const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function loginInstagramViaFacebook() {
  const cUser = process.env.FB_C_USER;
  const xs = process.env.FB_XS;

  console.log("🦅 [INSTAGRAM VIA FB] Logging into Instagram via Facebook...");
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

    await page.goto("https://www.instagram.com/", { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise(r => setTimeout(r, 4000));

    // Click "Log in with Facebook"
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button, span, div[role='button']"));
      for (const b of btns) {
        if (b.textContent && b.textContent.includes("Log in with Facebook")) {
          b.click();
          break;
        }
      }
    });

    console.log("▶ Clicked 'Log in with Facebook'. Waiting for OIDC screen...");
    await new Promise(r => setTimeout(r, 6000));

    // Click "Continue as..." button
    console.log("▶ Clicking 'Continue as...' confirmation button...");
    const confirmed = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button, div[role='button']"));
      for (const b of btns) {
        if (b.textContent && (b.textContent.includes("Continue as") || b.textContent.includes("Continue"))) {
          b.click();
          return true;
        }
      }
      return false;
    });
    console.log("▶ Clicked Continue button?", confirmed);

    console.log("▶ Waiting 10s for Instagram authentication and redirect...");
    await new Promise(r => setTimeout(r, 10000));

    const finalUrl = page.url();
    const finalTitle = await page.title();
    console.log("Final URL:", finalUrl);
    console.log("Final Title:", finalTitle);

    const cookies = await page.cookies();
    const sessionCookie = cookies.find(c => c.name === "sessionid");
    const userIdCookie = cookies.find(c => c.name === "ds_user_id");
    console.log("New sessionid exists?", Boolean(sessionCookie), "ds_user_id exists?", Boolean(userIdCookie));

    const finalScreenshot = path.join(OUTPUT_DIR, "instagram_logged_in_proof.png");
    await page.screenshot({ path: finalScreenshot });
    console.log("✔ Saved logged-in screenshot:", finalScreenshot);

  } finally {
    await browser.close();
  }
}

loginInstagramViaFacebook().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
