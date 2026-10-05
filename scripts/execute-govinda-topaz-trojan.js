const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function executeGovindaTopazTrojan() {
  const cookieVal = process.env.LINKEDIN_LI_AT;
  if (!cookieVal) throw new Error("Missing LINKEDIN_LI_AT in .env");

  console.log("🦅 [GARUDA TROJAN DROP] Targeting Govinda Dora (Technology Architect - Infosys Topaz Fabric)...");
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
  console.log(`▶ Navigating to LinkedIn Search: ${searchUrl}`);
  await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await new Promise(r => setTimeout(r, 6000));

  // Find the first comment button
  console.log("▶ Locating comment trigger button for Topaz Fabric post...");
  const commentButtons = await page.$$("button[aria-label*='Comment'], button[aria-label*='comment']");
  if (commentButtons.length === 0) throw new Error("No comment buttons found on page!");

  console.log(`▶ Found ${commentButtons.length} comment buttons. Triggering Post 1 comment box...`);
  await commentButtons[0].scrollIntoView();
  await new Promise(r => setTimeout(r, 1000));
  await commentButtons[0].click();
  await new Promise(r => setTimeout(r, 3500));

  const editor = await page.$("div[role='textbox']");
  if (!editor) throw new Error("Comment editor textbox not found!");

  console.log("▶ Focusing editor and injecting high-authority Topaz Fabric architectural insight...");
  await editor.click();
  await new Promise(r => setTimeout(r, 1000));

  const lines = [
    "Congratulations Govinda on completing the Infosys Topaz Fabric certification!",
    "",
    "Enterprise AI integration in 2026 is moving rapidly from standalone copilot experiments to unified fabric architecture.",
    "",
    "A few critical integration patterns that differentiate enterprise-grade AI fabrics in production:",
    "",
    "1. Deterministic Multi-Agent Orchestration: Ensuring autonomous AI agents maintain state machine guarantees and execute within strict latency/SLA budgets rather than unbounded probabilistic loops.",
    "2. Zero-Data-Leakage Sovereign Gateways: Ensuring enterprise transactional telemetry, schema definitions, and customer data are cryptographically contained on-prem or inside private sovereign enclaves.",
    "3. Cryptographic Verification Checkpoints: Logging execution proofs (SHA-256 state tracking) so enterprise risk and governance teams have 100% forensic auditability across every agent workflow.",
    "",
    "Great to see technology architects championing structured AI fabric patterns across enterprise ecosystems."
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

  const previewPath = path.join(OUTPUT_DIR, "govinda_topaz_comment_preview.png");
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

  const liveProofPath = path.join(OUTPUT_DIR, "govinda_topaz_comment_live.png");
  await page.screenshot({ path: liveProofPath });
  console.log("✔ Live proof screenshot saved:", liveProofPath);

  await browser.close();
  console.log("🎉 TROJAN STRIKE ON INFOSYS TOPAZ FABRIC SUCCESSFULLY POSTED!");
}

executeGovindaTopazTrojan().catch(err => {
  console.error("❌ Error executing Govinda Topaz Trojan:", err.message);
  process.exit(1);
});
