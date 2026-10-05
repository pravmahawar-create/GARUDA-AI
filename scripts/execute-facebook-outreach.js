const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const OUTPUT_DIR = path.join(__dirname, "..", "output");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function executeOutreach() {
  const cUser = process.env.FB_C_USER;
  const xs = process.env.FB_XS;

  if (!cUser || !xs) {
    throw new Error("FB_C_USER or FB_XS missing in .env");
  }

  console.log("🦅 [GARUDA FB OUTREACH] Launching browser to execute GHL Join & Alanna Giselle Pitch...");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"]
  });

  const results = {
    ghlJoined: false,
    alannaPitched: false,
    screenshots: []
  };

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    );

    await page.setCookie(
      { name: "c_user", value: cUser.trim(), domain: ".facebook.com", path: "/", secure: true },
      { name: "xs", value: xs.trim(), domain: ".facebook.com", path: "/", httpOnly: true, secure: true }
    );

    // ==========================================
    // ACTION 1: JOIN GHL SUPPORT GROUP
    // ==========================================
    console.log("▶ [1/2] Navigating to GHL Support Group...");
    const ghlUrl = "https://www.facebook.com/groups/1844616979220134/";
    await page.goto(ghlUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await new Promise(r => setTimeout(r, 6000));

    // Look for Join group button
    const joinClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("div[role='button'], span"));
      for (const btn of buttons) {
        const text = (btn.textContent || "").trim();
        if (text === "Join group" || text === "Join Group") {
          btn.scrollIntoView({ behavior: "instant", block: "center" });
          btn.click();
          return true;
        }
      }
      return false;
    });

    console.log("▶ Clicked 'Join group' button?", joinClicked);
    await new Promise(r => setTimeout(r, 4000));

    const ghlProof = path.join(OUTPUT_DIR, "fb_ghl_joined_proof.png");
    await page.screenshot({ path: ghlProof, fullPage: false });
    results.ghlJoined = joinClicked;
    results.screenshots.push(ghlProof);
    console.log(`✔ Saved GHL joined proof: ${ghlProof}`);

    // ==========================================
    // ACTION 2: PITCH ALANNA GISELLE
    // ==========================================
    console.log("▶ [2/2] Navigating to Recent Posts Search for Alanna Giselle...");
    const searchUrl = `https://www.facebook.com/search/posts/?q=${encodeURIComponent("looking for a web developer")}&filters=eyJyZWNlbnRfcG9zdHM6MCI6IntcIm5hbWVcIjpcInJlY2VudF9wb3N0c1wiLFwiYXJnc1wiOlwiXCJ9In0%3D`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await new Promise(r => setTimeout(r, 6000));

    // Scroll to locate Alanna's post
    console.log("▶ Scrolling to locate Alanna Giselle post...");
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, 700));
      await new Promise(r => setTimeout(r, 2500));
    }

    // Locate the comment trigger specifically under Alanna's post
    const commentTarget = await page.evaluate(() => {
      const articles = Array.from(document.querySelectorAll("div[role='article'], div[role='feed'] > div"));
      for (const art of articles) {
        const text = art.innerText || "";
        if (text.includes("Alanna Giselle") || text.includes("Marine Park, Brooklyn") || text.includes("reputable and reliable web designer")) {
          // Find comment button or write comment box in this article
          const commentBtn = art.querySelector("div[aria-label*='Comment' i], div[aria-label*='Leave a comment' i], div[role='button'] span");
          if (commentBtn) {
            commentBtn.scrollIntoView({ behavior: "instant", block: "center" });
            commentBtn.click();
            return { foundArticle: true, clickedCommentBtn: true };
          }
          return { foundArticle: true, clickedCommentBtn: false };
        }
      }
      return { foundArticle: false };
    });

    console.log("▶ Comment target status:", commentTarget);
    await new Promise(r => setTimeout(r, 3000));

    // Find the comment box
    const commentBox = await page.$("div[role='textbox'][aria-label*='comment' i], div[contenteditable='true'][role='textbox']");
    if (commentBox) {
      console.log("▶ Found comment textbox! Typing high-conversion pitch...");
      await commentBox.click();
      await new Promise(r => setTimeout(r, 1000));

      const pitchText = "Hi Alanna! If you're looking for a reputable, production-grade web developer for your business website, our team at GARUDA specializes in modern, high-performance web development with rapid 48-hour turnarounds. We build clean, fully responsive sites with custom workflows and zero bloat. Feel free to review our live portfolio and interactive systems at https://www.garudaos.in — happy to review your reference example and share architectural wireframes upfront!";

      await page.keyboard.type(pitchText, { delay: 20 });
      await new Promise(r => setTimeout(r, 2000));

      const previewProof = path.join(OUTPUT_DIR, "fb_alanna_pitch_preview.png");
      await page.screenshot({ path: previewProof, fullPage: false });
      results.screenshots.push(previewProof);
      console.log(`✔ Preview captured: ${previewProof}`);

      // Press Enter to submit
      console.log("▶ Submitting comment via Enter key...");
      await page.keyboard.press("Enter");
      await new Promise(r => setTimeout(r, 6000));

      const liveProof = path.join(OUTPUT_DIR, "fb_alanna_pitch_live_proof.png");
      await page.screenshot({ path: liveProof, fullPage: false });
      results.screenshots.push(liveProof);
      results.alannaPitched = true;
      console.log(`✔ Live proof captured: ${liveProof}`);
    } else {
      console.log("⚠ Direct comment textbox not focused, capturing current state screenshot...");
      const stateProof = path.join(OUTPUT_DIR, "fb_alanna_pitch_state.png");
      await page.screenshot({ path: stateProof, fullPage: false });
      results.screenshots.push(stateProof);
    }

  } finally {
    await browser.close();
  }

  return results;
}

executeOutreach()
  .then(res => {
    console.log("\n==========================================");
    console.log("🦅 FACEBOOK OUTREACH EXECUTION COMPLETE");
    console.log("==========================================");
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ Outreach Error:", err);
    process.exit(1);
  });
