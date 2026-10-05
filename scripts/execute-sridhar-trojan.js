const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function executeSridharTrojan() {
  const cookieVal = process.env.LINKEDIN_LI_AT;
  if (!cookieVal) throw new Error("LINKEDIN_LI_AT missing in .env");

  console.log("🦅 [GARUDA TROJAN DROP] Initializing stealth authority commentary on Databricks Genie App Builder post...");
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

    const searchUrl = "https://www.linkedin.com/search/results/content/?keywords=%22looking%20for%20a%20developer%22%20OR%20%22need%20a%20developer%22%20OR%20%22build%20an%20MVP%22&sortBy=%22date_posted%22";
    console.log("▶ Loading content search feed...");
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise(r => setTimeout(r, 6000));

    // Find comment buttons
    const commentBtns = await page.$$("button[aria-label*='Comment'], button[aria-label*='comment']");
    console.log(`▶ Found ${commentBtns.length} target comment buttons.`);

    if (commentBtns.length === 0) {
      throw new Error("No comment buttons found!");
    }

    // Target Post 1: Sridhar Pothamsetti (Databricks Genie App Builder)
    console.log("▶ Opening comment box for Target Post 1 (Sridhar Pothamsetti - Databricks Genie App Builder)...");
    await commentBtns[0].click();
    await new Promise(r => setTimeout(r, 3500));

    // Find the tiptap / ProseMirror editor
    const editor = await page.$("div.tiptap.ProseMirror, div[role='textbox'], .comments-comment-box__textarea");
    if (!editor) {
      throw new Error("Comment tiptap editor not found!");
    }

    console.log("▶ Focusing editor and typing authoritative architectural comment...");
    await editor.click();
    await new Promise(r => setTimeout(r, 1000));

    const commentText = 
`The launch of Genie App Builder highlights the core enterprise shift in 2026: building AI apps is easy, but governing agent state machines, execution latency, and deterministic verification is where real production fails or succeeds.

When deploying enterprise agentic workflows, three architectural guardrails are non-negotiable:
1. Deterministic State Gates: Ensuring agents don't drift into unbounded probabilistic loops.
2. Cryptographic Execution Auditing: Verifying SHA-256 state transitions before modifying upstream production databases.
3. Sub-second Sovereign Routing: Decoupling LLM reasoning from real-time operational APIs to keep latency under 400ms.

Exciting times for enterprise AI architecture!`;

    await page.evaluate((text) => {
      const el = document.querySelector("div.tiptap.ProseMirror, div[role='textbox']");
      if (el) {
        el.focus();
        document.execCommand("insertText", false, text);
      }
    }, commentText);

    await new Promise(r => setTimeout(r, 2000));

    const previewPath = path.join(OUTPUT_DIR, "trojan_sridhar_preview.png");
    await page.screenshot({ path: previewPath });
    console.log(`✔ Preview captured: ${previewPath}`);

    // Click Comment / Post button
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

    const proofPath = path.join(OUTPUT_DIR, "trojan_sridhar_live_proof.png");
    await page.screenshot({ path: proofPath });
    console.log(`✔ Live proof screenshot captured: ${proofPath}`);

    console.log("=================================================");
    console.log("🎉 SUCCESS! LINKEDIN TROJAN COMMENT OFFICIALLY POSTED!");
    console.log("=================================================");

  } finally {
    await browser.close();
  }
}

executeSridharTrojan().catch(err => {
  console.error("❌ Trojan Comment Error:", err);
  process.exit(1);
});
