const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function executeTrojanDrop() {
  const cookieVal = process.env.LINKEDIN_LI_AT;
  if (!cookieVal) {
    throw new Error("LINKEDIN_LI_AT missing in .env");
  }

  console.log("🦅 [GARUDA TROJAN DROP] Initializing stealth authority commentary on Bangalore Gen AI post...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--window-size=1280,900"
    ]
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
  console.log(`▶ Navigating to LinkedIn Content Search: ${searchUrl}`);
  await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await new Promise(r => setTimeout(r, 6000));

  // Find comment buttons
  const buttons = await page.$$('button[aria-label="Comment"]');
  console.log(`▶ Found ${buttons.length} target posts with comment triggers.`);

  if (buttons.length < 2) {
    throw new Error(`Expected at least 2 comment buttons, found ${buttons.length}`);
  }

  // Target: Post 2 (Shwetha Ananth - Gen AI Architects Bangalore, L&T Technology Services)
  console.log("▶ Opening Comment Box for Target: Gen AI Architects Bangalore (L&T Technology Services)...");
  await buttons[1].click();
  await new Promise(r => setTimeout(r, 3500));

  const editor = await page.$('div[role="textbox"]');
  if (!editor) {
    throw new Error("Comment textbox not found!");
  }

  console.log("▶ Focusing editor and injecting high-authority architectural comment...");
  await editor.click();
  await new Promise(r => setTimeout(r, 1000));

  const lines = [
    "Critical inflection point for enterprise AI architecture in 2026.",
    "",
    "Most enterprises are discovering that wrapper-based LLM chains collapse under production SLA pressures due to state drift, non-deterministic latency, and uncontained hallucinations.",
    "",
    "For true enterprise transformation, Gen AI Architects must move past basic prompt orchestration and solve:",
    "1. Deterministic Multi-Agent State Machines (preventing cascading loop failures)",
    "2. Sovereign On-Prem / Hybrid Context Boundaries (preventing enterprise IP leakage)",
    "3. Zero-Hallucination Verification Gates before execution",
    "",
    "Exciting to see Bangalore leading the shift toward real sovereign system-level AI architecture."
  ];

  for (const line of lines) {
    if (line === "") {
      await page.keyboard.down("Shift");
      await page.keyboard.press("Enter");
      await page.keyboard.up("Shift");
    } else {
      await page.keyboard.type(line, { delay: 15 });
      await page.keyboard.down("Shift");
      await page.keyboard.press("Enter");
      await page.keyboard.up("Shift");
    }
    await new Promise(r => setTimeout(r, 100));
  }

  await new Promise(r => setTimeout(r, 2000));

  // Take preview screenshot before clicking Comment
  const previewPath = path.join(OUTPUT_DIR, "trojan_comment_preview.png");
  await page.screenshot({ path: previewPath });
  console.log(`✔ Preview screenshot captured: ${previewPath}`);

  // Find submit button
  console.log("▶ Locating 'Comment' submit button...");
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

  if (!clickedSubmit) {
    throw new Error("Could not find enabled 'Comment' button!");
  }

  console.log("✔ Clicked 'Comment' submit button! Waiting 6s for LinkedIn submission...");
  await new Promise(r => setTimeout(r, 6000));

  // Capture proof screenshot of the comment live in the thread
  const liveProofPath = path.join(OUTPUT_DIR, "trojan_comment_posted_live.png");
  await page.screenshot({ path: liveProofPath });
  console.log(`✔ Live proof screenshot captured: ${liveProofPath}`);

  await browser.close();
  console.log("=================================================");
  console.log("🎉 TROJAN HORSE COMMENT SUCCESSFULLY PUBLISHED!");
  console.log("=================================================");
}

executeTrojanDrop().catch(err => {
  console.error("❌ Trojan Drop Error:", err);
  process.exit(1);
});
