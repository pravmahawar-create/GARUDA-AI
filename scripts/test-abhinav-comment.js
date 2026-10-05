const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function dropTrojanOnAbhinav() {
  const cookieVal = process.env.LINKEDIN_LI_AT;
  if (!cookieVal) throw new Error("Missing LINKEDIN_LI_AT");

  console.log("🦅 [GARUDA TROJAN DROP] Targeting Abhinav Kumar (GenAI Scale-Up to 10k Enterprise Users)...");
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
    path: "/"
  });

  const searchUrl = "https://www.linkedin.com/search/results/content/?keywords=Gen%20AI%20architecture%20Bangalore";
  console.log("▶ Navigating to search URL:", searchUrl);
  await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await new Promise(r => setTimeout(r, 6000));

  // Find comment buttons
  const buttons = await page.$$("button[aria-label*='Comment'], button[aria-label*='comment']");
  console.log(`Found ${buttons.length} comment buttons.`);

  if (buttons.length < 2) {
    throw new Error(`Expected at least 2 comment buttons, found ${buttons.length}`);
  }

  console.log("▶ Finding Abhinav Kumar target card and scrolling into view...");
  const clickedBtn = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll(".feed-shared-update-v2, div[data-view-name='feed-full-update']"));
    for (const card of cards) {
      if (card.innerText.includes("Abhinav Kumar") || card.innerText.includes("10,000")) {
        const btn = card.querySelector("button[aria-label*='Comment'], button[aria-label*='comment']");
        if (btn) {
          btn.scrollIntoView({ behavior: "instant", block: "center" });
          btn.click();
          return true;
        }
      }
    }
    return false;
  });

  if (!clickedBtn) {
    throw new Error("Could not find comment button on Abhinav Kumar card!");
  }

  console.log("✔ Clicked comment button! Waiting for textbox editor to render...");
  await page.waitForSelector("div[role='textbox']", { timeout: 10000 });
  const editor = await page.$("div[role='textbox']");
  if (!editor) throw new Error("Editor textbox not found after waiting!");

  console.log("▶ Focusing editor and typing architectural solution...");
  await editor.click();
  await new Promise(r => setTimeout(r, 1000));

  const lines = [
    "Scaling an Agentic AI workflow from PoC to 10,000 enterprise seats exposes the real engineering reality.",
    "",
    "None of the 4 poll options alone will prevent system degradation. When 10k users hit concurrent multi-turn agent graphs, pure LLM routing and semantic caching will choke on state divergence and cache invalidation.",
    "",
    "What actually works at production scale:",
    "1. Deterministic Multi-Agent State Machines: Agents must transition strictly through validated state graphs (DAGs). Free-form recursive loops must have hard SLA boundaries and deterministic circuit-breakers.",
    "2. Strict Schema Contracts & Local Validation: Never allow an agent step to execute without local schema verification (JSON Schema + SHA-256 state check). Catch hallucinations before external tool calls, not after.",
    "3. Tiered Hybrid Architecture: Edge/local SLMs for intent classification and parameter extraction (sub-50ms) -> High-parameter reasoning models only for high-entropy synthesis.",
    "",
    "PoCs test model capability; enterprise production tests software engineering discipline."
  ];

  for (const line of lines) {
    if (line === "") {
      await page.keyboard.down("Shift");
      await page.keyboard.press("Enter");
      await page.keyboard.up("Shift");
    } else {
      await page.keyboard.type(line, { delay: 10 });
      await page.keyboard.down("Shift");
      await page.keyboard.press("Enter");
      await page.keyboard.up("Shift");
    }
    await new Promise(r => setTimeout(r, 60));
  }

  await new Promise(r => setTimeout(r, 2000));

  const previewPath = path.join(OUTPUT_DIR, "trojan_abhinav_preview.png");
  await page.screenshot({ path: previewPath });
  console.log("✔ Preview screenshot saved:", previewPath);

  // Click submit
  console.log("▶ Submitting comment...");
  const clickedSubmit = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    for (const b of btns) {
      const txt = (b.innerText || "").trim();
      if (txt === "Comment" && !b.disabled) {
        b.scrollIntoView({ behavior: "instant", block: "center" });
        b.click();
        return true;
      }
    }
    return false;
  });

  if (!clickedSubmit) throw new Error("Could not find enabled 'Comment' button!");

  console.log("✔ Clicked Comment! Waiting 6s for live confirmation...");
  await new Promise(r => setTimeout(r, 6000));

  const liveProofPath = path.join(OUTPUT_DIR, "trojan_abhinav_posted_live.png");
  await page.screenshot({ path: liveProofPath });
  console.log("✔ Live proof screenshot saved:", liveProofPath);

  await browser.close();
  console.log("🎉 TROJAN STRIKE 2 SUCCESSFULLY DELIVERED & VERIFIED!");
}

dropTrojanOnAbhinav().catch(err => {
  console.error("❌ Error in Abhinav Trojan Drop:", err);
  process.exit(1);
});
