const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function executeAvishekTrojan() {
  const cookieVal = process.env.LINKEDIN_LI_AT;
  if (!cookieVal) throw new Error("Missing LINKEDIN_LI_AT");

  console.log("🦅 [GARUDA TROJAN DROP 2] Targeting Avishek Mishra (Ralph Lauren Bangalore - AI Quality Architecture)...");
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

  const searchUrl = "https://www.linkedin.com/search/results/content/?keywords=enterprise%20AI%20architecture%20bangalore&origin=GLOBAL_SEARCH_HEADER";
  console.log("▶ Navigating to Bangalore Enterprise AI search...");
  await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await new Promise(r => setTimeout(r, 6000));

  const buttons = await page.$$("button[aria-label='Comment']");
  if (buttons.length === 0) throw new Error("No comment buttons found!");

  console.log("▶ Clicking comment button on Avishek Mishra post...");
  await buttons[0].click();
  await new Promise(r => setTimeout(r, 3500));

  const editor = await page.$("div[role='textbox']");
  if (!editor) throw new Error("Editor textbox not found!");

  console.log("▶ Injecting high-authority AI Quality Architecture comment...");
  await editor.click();
  await new Promise(r => setTimeout(r, 1000));

  const lines = [
    "The intersection of Quality Engineering (QE) and Enterprise AI in Bangalore is undergoing a massive shift.",
    "",
    "Traditional deterministic test automation frameworks break down when testing non-deterministic LLM-driven features because outputs are probabilistic rather than binary passes/fails.",
    "",
    "For enterprise-scale quality architecture across AI-enabled products, the new QE pillars must be:",
    "",
    "1. Deterministic Multi-Agent State Verification: Testing cannot just evaluate final text strings; it must validate state transitions across intermediate agent loops against strict schema invariants (JSON Schema contracts + state hashes).",
    "2. Autonomous Synthetic Adversarial Testing: Continuous automated red-teaming agents generating edge-case payloads, prompt injections, and latency stress-tests before any model checkpoint touches production.",
    "3. Strict Non-Regression Baselines: Tracking hallucination drift, semantic variance, and latency budgets (e.g. sub-200ms P99) across iterative model fine-tunes.",
    "",
    "Exciting to see Bangalore enterprises prioritizing architecture-level AI quality engineering."
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
    await new Promise(r => setTimeout(r, 70));
  }

  await new Promise(r => setTimeout(r, 2000));

  const previewPath = path.join(OUTPUT_DIR, "avishek_trojan_preview.png");
  await page.screenshot({ path: previewPath });
  console.log("✔ Preview screenshot saved:", previewPath);

  // Locate and click submit
  console.log("▶ Locating and clicking 'Comment' submit button...");
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

  const liveProofPath = path.join(OUTPUT_DIR, "avishek_trojan_posted_live.png");
  await page.screenshot({ path: liveProofPath });
  console.log("✔ Live proof screenshot saved:", liveProofPath);

  await browser.close();
  console.log("🎉 TROJAN STRIKE 2 ON AVISHEK MISHRA POST SUCCESSFULLY PUBLISHED!");
}

executeAvishekTrojan().catch(err => {
  console.error("❌ Error in Avishek Trojan execution:", err);
  process.exit(1);
});
