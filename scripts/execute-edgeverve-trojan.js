const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function executeEdgeverveTrojan() {
  const cookieVal = process.env.LINKEDIN_LI_AT;
  if (!cookieVal) throw new Error("Missing LINKEDIN_LI_AT");

  console.log("🦅 [GARUDA TROJAN DROP 2] Targeting EdgeVerve (Infosys) Enterprise AI Discussion...");
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

  const searchUrl = "https://www.linkedin.com/search/results/content/?keywords=Infosys%20Topaz%20AI&sortBy=%22date_posted%22";
  console.log("▶ Navigating to EdgeVerve post search...");
  await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await new Promise(r => setTimeout(r, 6000));

  // Find the first comment button
  const commentButtons = await page.$$("button[aria-label*='Comment'], button[aria-label*='comment']");
  if (commentButtons.length === 0) throw new Error("No comment buttons found!");

  console.log("▶ Opening comment box on EdgeVerve post...");
  await commentButtons[0].click();
  await new Promise(r => setTimeout(r, 3500));

  const editor = await page.$("div[role='textbox']");
  if (!editor) throw new Error("Editor textbox not found!");

  console.log("▶ Injecting high-authority enterprise AI architectural comment...");
  await editor.click();
  await new Promise(r => setTimeout(r, 1000));

  const lines = [
    "Critical challenge every enterprise leader is navigating in 2026.",
    "",
    "Why most enterprise Gen AI investments still struggle to translate into measurable balance sheet value:",
    "",
    "1. The Wrapper Trap: Lightweight prompt pipelines over fragmented silos look great in pilots, but fail under strict enterprise SLA, data governance, and latency constraints.",
    "2. The Determinism Deficit: Enterprise production demands predictable outputs, not stochastic guesses. Without multi-agent state machines and cryptographic verification checkpoints (e.g. SHA-256 state tracking), risk and compliance teams halt rollout.",
    "3. Sovereign Workflow Integration: Real ROI happens only when autonomous AI operates directly inside core business systems—codebases, ERP, and CRM—with absolute IP containment and zero leakage.",
    "",
    "The competitive moat is shifting from prompt wrappers to sovereign, governed AI Operating Systems that run deterministic enterprise workflows end-to-end."
  ];

  for (const line of lines) {
    if (line === "") {
      await page.keyboard.down("Shift");
      await page.keyboard.press("Enter");
      await page.keyboard.up("Shift");
    } else {
      await page.keyboard.type(line, { delay: 12 });
      await page.keyboard.down("Shift");
      await page.keyboard.press("Enter");
      await page.keyboard.up("Shift");
    }
    await new Promise(r => setTimeout(r, 80));
  }

  await new Promise(r => setTimeout(r, 2000));

  const previewPath = path.join(OUTPUT_DIR, "edgeverve_comment_preview.png");
  await page.screenshot({ path: previewPath });
  console.log("✔ Preview screenshot saved:", previewPath);

  // Submit comment
  console.log("▶ Clicking 'Comment' submit button...");
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

  console.log("✔ Submitted! Waiting 6s for LinkedIn confirmation...");
  await new Promise(r => setTimeout(r, 6000));

  const liveProofPath = path.join(OUTPUT_DIR, "edgeverve_comment_posted_live.png");
  await page.screenshot({ path: liveProofPath });
  console.log("✔ Live proof screenshot saved:", liveProofPath);

  await browser.close();
  console.log("🎉 TROJAN STRIKE ON EDGEVERVE (INFOSYS) SUCCESSFULLY POSTED!");
}

executeEdgeverveTrojan().catch(err => {
  console.error("❌ Error executing EdgeVerve Trojan:", err);
  process.exit(1);
});
