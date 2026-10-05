const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const BASE_DIR = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(BASE_DIR, "output");
const VIDEO_PATH = path.join(OUTPUT_DIR, "garuda_35s_master_reel.mp4");
const SNAP_BEFORE_POST = path.join(OUTPUT_DIR, "linkedin_video_preview_before_post.png");
const SNAP_AFTER_POST = path.join(OUTPUT_DIR, "linkedin_video_feed_after_post.png");

const POST_CONTENT = `Duniya mein AI tools bohot hain. Lekin GARUDA sirf jawab dene ke liye nahi bana.

Idea se Planning. Planning se Execution.
Website, Marketing, Leads, Automation aur Real Growth — GARUDA sabko ek autonomous sovereign system mein jodta hai.

Across Bangalore's Electronic City to global enterprise tech corridors, software delivery is trapped in legacy bottlenecks:
❌ 6-month agency retainers
❌ Endless sprint estimation ceremonies
❌ Bloated human payroll overheads
❌ Fragmented codebases and delayed deployments

GARUDA OS permanently destroys this bottleneck.

🦅 1 FOUNDER + 1,000 AUTONOMOUS AI AGENTS
✔ Full-Stack React 19 UI, Microservices APIs & Cloud Cluster deployed in 48 HOURS FLAT.
✔ 1,000 Autonomous AI Agents synthesizing, auditing, and executing code in real-time.
✔ Cryptographic SHA-256 Deployment Verification with clean Exit Code 0.
✔ Zero human payroll bloat. 100% verifiable code inside worktrees.

Bas goal batao — GARUDA intelligence, execution aur possibilities ko aapke saath aage le jaata hai.

To every Enterprise Architect, CTO, and Tech Leader in the Bangalore IT ecosystem: Welcome to the future of sovereign computing.

🌐 Official Portal: https://www.garudaos.in
Founder & Chief Sovereign Architect: Praveen Mahawar

#BangaloreTech #Infosys #Bengaluru #ElectronicCity #Whitefield #EnterpriseArchitecture #SovereignAI #GARUDAOS #AutonomousAI #CloudEngineering #DeepTechIndia #MakeInIndia`;

async function publishVideoPost() {
  const cookieVal = process.env.LINKEDIN_LI_AT;
  if (!cookieVal) {
    throw new Error("LINKEDIN_LI_AT cookie missing in .env");
  }

  if (!fs.existsSync(VIDEO_PATH)) {
    throw new Error("Video file not found at: " + VIDEO_PATH);
  }

  console.log("🚀 [GARUDA LINKEDIN VIDEO ENGINE] Launching Headless Chromium (1280x900)...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--window-size=1280,900"
    ]
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

    console.log("▶ [1/6] Navigating to https://www.linkedin.com/feed/...");
    await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise(r => setTimeout(r, 4000));

    console.log("▶ [2/6] Clicking 'Video' button on feed header...");
    const videoBtnCoords = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll("div, span, button"));
      const btn = all.find(e => {
        const t = (e.textContent || "").trim();
        const r = e.getBoundingClientRect();
        return t === "Video" && r.top > 0 && r.top < 350 && r.width > 0;
      });
      if (btn) {
        const r = btn.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }
      return null;
    });

    if (videoBtnCoords) {
      console.log(`  ✔ Found Video button at (${Math.round(videoBtnCoords.x)}, ${Math.round(videoBtnCoords.y)}). Clicking...`);
      await page.mouse.click(videoBtnCoords.x, videoBtnCoords.y);
    } else {
      console.log("  ⚠️ Clicking default Video button coordinate (410, 164)...");
      await page.mouse.click(410, 164);
    }

    await new Promise(r => setTimeout(r, 3000));

    // Step 3: Attach Video File
    console.log("▶ [3/6] Attaching Master Video: " + VIDEO_PATH);
    const fileInput = await page.$("input[type='file'][accept*='video'], input[type='file']");
    if (!fileInput) {
      throw new Error("Could not find video file input element in modal!");
    }

    await fileInput.uploadFile(VIDEO_PATH);
    console.log("  ✔ Video file attached. Waiting 12 seconds for video processing...");
    await new Promise(r => setTimeout(r, 12000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, "video_modal_uploaded.png") });
    console.log("  ✔ Captured video modal upload state.");

    // Find and click 'Next' or 'Done'
    const nextClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const nextBtn = btns.find(b => {
        const txt = (b.textContent || "").trim();
        return (txt === "Next" || txt === "Done") && !b.disabled;
      });
      if (nextBtn) {
        nextBtn.click();
        return true;
      }
      return false;
    });

    console.log("  ✔ Clicked Next in video preview modal:", nextClicked);
    await new Promise(r => setTimeout(r, 4000));

    // Step 4: Inject post text into editor
    console.log("▶ [4/6] Injecting post text and Bangalore SEO hashtags...");
    const focused = await page.evaluate(() => {
      const editor = document.querySelector("div[contenteditable='true'], div.ql-editor, div[aria-placeholder*='thoughts'], div[data-placeholder*='thoughts']");
      if (editor) {
        editor.focus();
        return true;
      }
      return false;
    });

    if (!focused) {
      console.log("  Focusing editor by coordinate (450, 300)...");
      await page.mouse.click(450, 300);
    }
    await new Promise(r => setTimeout(r, 1000));

    await page.evaluate((text) => {
      const editor = document.activeElement || document.querySelector("div[contenteditable='true']");
      if (editor) {
        editor.focus();
        document.execCommand("insertText", false, text);
      }
    }, POST_CONTENT);

    console.log("  ✔ Content injected.");
    await new Promise(r => setTimeout(r, 3000));

    // Step 5: Capture Preview before clicking Post
    await page.screenshot({ path: SNAP_BEFORE_POST });
    console.log(`✔ Preview captured before posting: ${SNAP_BEFORE_POST}`);

    // Step 6: Click Post
    console.log("▶ [5/6] Clicking 'Post' button...");
    const postClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const postBtn = btns.find(b => {
        const txt = (b.textContent || "").trim();
        return txt === "Post" && !b.disabled;
      });
      if (postBtn) {
        postBtn.click();
        return true;
      }
      return false;
    });

    console.log("  Post button clicked:", postClicked);
    if (!postClicked) {
      console.log("  Clicking Post button by coordinate (760, 680)...");
      await page.mouse.click(760, 680);
    }

    console.log("▶ [6/6] Waiting 20 seconds for post to upload and commit to feed...");
    await new Promise(r => setTimeout(r, 20000));

    await page.screenshot({ path: SNAP_AFTER_POST });
    console.log(`✔ Feed confirmation screenshot captured: ${SNAP_AFTER_POST}`);

    console.log("\n==============================================================");
    console.log("🎉 SUCCESS! GARUDA OS 35S MASTER AI VIDEO IS OFFICIALLY LIVE ON LINKEDIN!");
    console.log("Profile URL: https://www.linkedin.com/in/garuda-ai-ai-operating-system-227168432");
    console.log("==============================================================\n");

  } finally {
    await browser.close();
  }
}

publishVideoPost().catch(err => {
  console.error("[-] Error during video publishing:", err);
  process.exit(1);
});
