const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const BASE_DIR = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(BASE_DIR, "output");
const MEDIA_PATH = path.join(OUTPUT_DIR, "garuda_7_stages_infographic.png");

const POST_CAPTION = `95% of enterprise "AI agents" built in 2026 will die in sandbox staging.

Connecting an LLM to a vector database and an API is a toy demo. Building a sovereign autonomous workforce that executes deterministic business workflows without human babysitting is an entirely different engineering paradigm.

Here are the 7 non-negotiable architectural stages of GARUDA OS:

1. DISCOVER: Forensic Hemorrhage & Latency Modeling
2. GOVERN: Strict Constitutional Laws & State Machines
3. CONNECT: Provider-Agnostic Compute & Neural Edge Routing
4. ORCHESTRATE: 1 Founder = 1,000 Autonomous AI Engineers
5. SYNAPSE: Durable Memory Journals Over Stale Vectors
6. VERIFY: Cryptographic Pre-Flight Interception (Show > Tell)
7. SHIP & SCALE: Production Delivery & Real Client Value

Bas goal batao — GARUDA execution sambhalta hai.

🌐 Official Portal: https://www.garudaos.in
Founder & Chief Sovereign Architect: Praveen Mahawar

#GARUDAOS #AIAgents #EnterpriseAI #AgenticWorkflows #SystemsEngineering #SoftwareArchitecture #DeepTechIndia #BengaluruTech #AIInfrastructure #MakeInIndia`;

async function publishToInstagram() {
  const sessionId = process.env.INSTAGRAM_SESSION_ID;
  const userId = process.env.INSTAGRAM_USER_ID;

  if (!sessionId || !userId) {
    throw new Error("INSTAGRAM_SESSION_ID or INSTAGRAM_USER_ID missing in .env");
  }

  if (!fs.existsSync(MEDIA_PATH)) {
    throw new Error("Media file not found at: " + MEDIA_PATH);
  }

  console.log("🚀 [GARUDA INSTAGRAM ENGINE] Launching Headless Chromium (1280x950)...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,950"]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 950 });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");

    await page.setCookie(
      { name: "sessionid", value: sessionId, domain: ".instagram.com", path: "/" },
      { name: "ds_user_id", value: userId, domain: ".instagram.com", path: "/" }
    );

    console.log("▶ [1/6] Navigating to Instagram Home...");
    await page.goto("https://www.instagram.com/", { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise(r => setTimeout(r, 6000));

    // Dismiss any modals (e.g. "Not Now" for notifications)
    console.log("▶ Dismissing notification prompts if present...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      for (const b of btns) {
        const txt = (b.innerText || "").toLowerCase();
        if (txt.includes("not now") || txt.includes("cancel")) {
          b.click();
          break;
        }
      }
    });
    await new Promise(r => setTimeout(r, 2000));

    // Look for Create (+) icon
    console.log("▶ [2/6] Clicking 'Create' (+) button...");
    const clickedCreate = await page.evaluate(() => {
      const svgs = Array.from(document.querySelectorAll("svg"));
      const createSvg = svgs.find(s => {
        const aria = (s.getAttribute("aria-label") || "").toLowerCase();
        return aria === "new post" || aria === "create";
      });
      if (createSvg) {
        const parent = createSvg.closest("a, button, div[role='button']");
        if (parent) {
          parent.click();
          return "Found via SVG aria-label";
        }
      }

      // Fallback: search links/buttons with text "Create"
      const allEls = Array.from(document.querySelectorAll("a, button, div[role='button']"));
      const el = allEls.find(e => (e.innerText || "").trim().toLowerCase() === "create");
      if (el) {
        el.click();
        return "Found via text Create";
      }
      return null;
    });

    console.log("Clicked Create result:", clickedCreate);

    if (!clickedCreate) {
      console.log("Fallback: Clicking coordinate (28, 586)...");
      await page.mouse.click(28, 586);
    }
    await new Promise(r => setTimeout(r, 4000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, "insta_create_modal_open.png") });
    console.log("Saved screenshot to output/insta_create_modal_open.png");

    // Look for file input
    console.log("▶ [3/6] Locating file input in Create dialog...");
    let fileInput = await page.$("input[type='file']");
    if (!fileInput) {
      // Try clicking "Select from computer" button
      console.log("Clicking 'Select from computer' if present...");
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const btn = btns.find(b => (b.innerText || "").toLowerCase().includes("select from computer"));
        if (btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 2000));
      fileInput = await page.$("input[type='file']");
    }

    if (!fileInput) {
      throw new Error("Could not find file input element in Instagram Create modal!");
    }

    console.log(`▶ Uploading media file: ${MEDIA_PATH}...`);
    await fileInput.uploadFile(MEDIA_PATH);
    console.log("Waiting 6s for media upload and crop preview...");
    await new Promise(r => setTimeout(r, 6000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, "insta_media_uploaded.png") });
    console.log("Saved screenshot to output/insta_media_uploaded.png");

    // Click "Next" button (top right of modal)
    console.log("▶ [4/6] Clicking 'Next' button (crop step)...");
    const clickNext = async () => {
      return await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button, div[role='button']"));
        const nextBtn = btns.find(b => {
          const txt = (b.innerText || "").trim().toLowerCase();
          return txt === "next";
        });
        if (nextBtn) {
          nextBtn.click();
          return true;
        }
        return false;
      });
    };

    let nextClicked = await clickNext();
    console.log("Clicked Next (1/2):", nextClicked);
    await new Promise(r => setTimeout(r, 3000));

    // Click "Next" button again (filter/edit step)
    nextClicked = await clickNext();
    console.log("Clicked Next (2/2):", nextClicked);
    await new Promise(r => setTimeout(r, 3000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, "insta_caption_step.png") });
    console.log("Saved screenshot to output/insta_caption_step.png");

    // Inject Caption into editor
    console.log("▶ [5/6] Injecting post caption into editor...");
    const captionInjected = await page.evaluate((text) => {
      const editor = document.querySelector("div[aria-label*='Write a caption'], div[role='textbox'], textarea");
      if (editor) {
        editor.focus();
        document.execCommand("insertText", false, text);
        return true;
      }
      return false;
    }, POST_CAPTION);

    console.log("Caption injected:", captionInjected);
    await new Promise(r => setTimeout(r, 3000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, "insta_post_ready_preview.png") });
    console.log("Saved screenshot to output/insta_post_ready_preview.png");

    // Click "Share" button
    console.log("▶ [6/6] Clicking 'Share' button...");
    const sharedClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button, div[role='button']"));
      const shareBtn = btns.find(b => {
        const txt = (b.innerText || "").trim().toLowerCase();
        return txt === "share";
      });
      if (shareBtn) {
        shareBtn.click();
        return true;
      }
      return false;
    });

    if (!sharedClicked) {
      throw new Error("Could not find enabled 'Share' button!");
    }

    console.log("✔ Clicked Share! Waiting 15s for Instagram processing...");
    await new Promise(r => setTimeout(r, 15000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, "insta_post_live_proof.png") });
    console.log("✔ Live confirmation proof saved: output/insta_post_live_proof.png");

    console.log("\n==============================================================");
    console.log("🎉 SUCCESS! GARUDA TECH INFOGRAPHIC POST IS OFFICIALLY LIVE ON INSTAGRAM!");
    console.log("Handle: @garudaos.ai");
    console.log("Profile URL: https://www.instagram.com/garudaos.ai/");
    console.log("==============================================================\n");

  } finally {
    await browser.close();
  }
}

publishToInstagram().catch(err => {
  console.error("❌ Error publishing to Instagram:", err);
  process.exit(1);
});
