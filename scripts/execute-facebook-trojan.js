const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function executeFacebookTrojan() {
  const cUser = process.env.FB_C_USER;
  const xs = process.env.FB_XS;

  if (!cUser || !xs) throw new Error("FB_C_USER or FB_XS missing in .env");

  console.log("🦅 [GARUDA FACEBOOK TROJAN] Initializing authority commentary on GHL Automation Group...");
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
    console.log(`▶ Navigating to Facebook Group: ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await new Promise(r => setTimeout(r, 6000));

    // Scroll down to view the post and comment box
    await page.evaluate(() => window.scrollBy(0, 400));
    await new Promise(r => setTimeout(r, 3000));

    // Look for comment buttons or comment input in the group feed
    console.log("▶ Locating comment triggers on the GHL Voice AI post...");
    const commentTriggers = await page.$$("div[aria-label*='Leave a comment'], div[aria-label*='Comment'], div[role='button'] span");
    console.log(`▶ Found ${commentTriggers.length} potential trigger elements.`);

    // Find all elements with text "Comment"
    const clicked = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll("div[role='button'], span"));
      for (const el of elements) {
        if (el.textContent && el.textContent.trim() === "Comment") {
          el.scrollIntoView({ behavior: "instant", block: "center" });
          el.click();
          return true;
        }
      }
      return false;
    });
    console.log("▶ Clicked 'Comment' button?", clicked);
    await new Promise(r => setTimeout(r, 3000));

    // Find the comment textbox
    const commentBox = await page.$("div[role='textbox'][aria-label*='comment' i], div[contenteditable='true']");
    if (commentBox) {
      console.log("▶ Found comment textbox! Injecting authority insight...");
      await commentBox.click();
      await new Promise(r => setTimeout(r, 1000));

      const commentText = "Great implementation! Outbound Voice AI inside GHL combined with real-time WhatsApp webhook handoff solves the biggest lead leakage for local agencies. Sub-second response latency is game changing.";
      
      await page.keyboard.type(commentText, { delay: 25 });
      await new Promise(r => setTimeout(r, 2000));

      const previewPath = path.join(OUTPUT_DIR, "facebook_trojan_preview.png");
      await page.screenshot({ path: previewPath });
      console.log(`✔ FB Preview captured: ${previewPath}`);

      // Press Enter to submit comment
      await page.keyboard.press("Enter");
      console.log("▶ Pressed Enter to post comment. Waiting 6s...");
      await new Promise(r => setTimeout(r, 6000));

      const proofPath = path.join(OUTPUT_DIR, "facebook_trojan_live_proof.png");
      await page.screenshot({ path: proofPath });
      console.log(`✔ FB Live proof screenshot captured: ${proofPath}`);
    } else {
      console.log("⚠ Direct comment box not found in current view, capturing state screenshot...");
      await page.screenshot({ path: path.join(OUTPUT_DIR, "facebook_trojan_state.png") });
    }

  } finally {
    await browser.close();
  }
}

executeFacebookTrojan().catch(err => {
  console.error("❌ FB Trojan Error:", err.message);
  process.exit(1);
});
