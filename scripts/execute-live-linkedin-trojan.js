const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function executeTrojanComment() {
  const cookieVal = process.env.LINKEDIN_LI_AT;
  if (!cookieVal) throw new Error("LINKEDIN_LI_AT missing in .env");

  console.log("🦅 [GARUDA TROJAN DROP] Initializing stealth authority commentary on Bangalore AI post...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,900"]
  });

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

  const searchUrl = "https://www.linkedin.com/search/results/content/?keywords=enterprise%20AI%20architecture%20bangalore&origin=GLOBAL_SEARCH_HEADER";
  console.log("▶ Loading content search feed...");
  await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await new Promise(r => setTimeout(r, 6000));

  // Find comment buttons
  const commentBtns = await page.$$('button[aria-label*="Comment"], button[aria-label*="comment"]');
  console.log(`▶ Found ${commentBtns.length} target comment buttons.`);

  if (commentBtns.length < 2) {
    throw new Error(`Expected at least 2 comment buttons, found ${commentBtns.length}`);
  }

  // Click on Post 2 (Rupali Mehra / AI democratization & governance discussion)
  console.log("▶ Opening comment box for Target Post 2 (AI Democratization & Governance)...");
  await commentBtns[1].click();
  await new Promise(r => setTimeout(r, 3500));

  // Find the tiptap / ProseMirror editor
  const editor = await page.$("div.tiptap.ProseMirror, div[role='textbox'], .comments-comment-box__textarea");
  if (!editor) {
    throw new Error("Comment tiptap editor not found!");
  }

  console.log("▶ Focusing editor and typing authoritative architectural comment...");
  await editor.click();
  await new Promise(r => setTimeout(r, 1000));

  const commentText = `The question of AI governance and democratization is the defining enterprise challenge of 2026.

True enterprise democratization cannot rely on fragile prompt wrappers or uncontained LLM loops. To build production-grade sovereign AI systems, three layers are mandatory:

1. Deterministic Multi-Agent State Machines (preventing cascading loop runaway)
2. Zero-Fabrication Verification Gates (verifiable cryptographic evidence before state changes)
3. Strict Governance Boundaries (eliminating IP leakage and uncontained hallucination drift)

When software engineering shifts from 6-month retainers to governed autonomous execution, sovereign AI becomes reality. Great conversation!`;

  await page.evaluate((text) => {
    const el = document.querySelector("div.tiptap.ProseMirror, div[role='textbox']");
    if (el) {
      el.focus();
      document.execCommand("insertText", false, text);
    }
  }, commentText);

  await new Promise(r => setTimeout(r, 2000));

  const previewPath = path.join(OUTPUT_DIR, "live_trojan_comment_preview.png");
  await page.screenshot({ path: previewPath });
  console.log(`✔ Preview captured: ${previewPath}`);

  // Locate submit button
  console.log("▶ Locating enabled 'Comment' submit button...");
  const clicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    for (const b of btns) {
      const txt = (b.innerText || b.textContent || "").trim();
      if ((txt === "Comment" || txt === "Post") && !b.disabled) {
        b.scrollIntoView({ behavior: "instant", block: "center" });
        b.click();
        return true;
      }
    }
    return false;
  });

  if (!clicked) {
    throw new Error("Comment submit button not clicked or disabled!");
  }

  console.log("✔ Comment submit button clicked! Waiting 8s for LinkedIn to persist...");
  await new Promise(r => setTimeout(r, 8000));

  const proofPath = path.join(OUTPUT_DIR, "live_trojan_comment_posted.png");
  await page.screenshot({ path: proofPath });
  console.log(`✔ Live proof screenshot captured: ${proofPath}`);

  await browser.close();
  console.log("=================================================");
  console.log("🎉 SUCCESS! TROJAN COMMENT OFFICIALLY POSTED!");
  console.log("=================================================");
}

executeTrojanComment().catch(err => {
  console.error("❌ Trojan Comment Error:", err);
  process.exit(1);
});
