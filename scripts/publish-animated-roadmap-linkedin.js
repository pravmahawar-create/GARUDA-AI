const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const BASE_DIR = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(BASE_DIR, "output");
const MEDIA_PATH = path.join(OUTPUT_DIR, "garuda_7_stages_animated.gif");

const POST_CONTENT = `95% of enterprise "AI agents" built in 2026 will die in sandbox staging.

Connecting an LLM to a vector database and an API is a toy demo. Building a sovereign autonomous workforce that executes deterministic business workflows without human babysitting is an entirely different engineering paradigm.

Here are the 7 non-negotiable architectural stages we codified while engineering GARUDA OS:

1. DISCOVER: Forensic Hemorrhage & Latency Modeling
• If you don't pinpoint the prospect's exact operational leaks, you build tools nobody pays for.
• Map hard privacy boundaries, founder personal privacy shields, and sub-second latency targets before writing a line of code.

2. GOVERN: Strict Constitutional Laws & State Machines
• Unbounded autonomous loops burn tokens and hallucinate in circles.
• Enforce deterministic hierarchical state machines: Goal ➔ Plan ➔ Isolate ➔ Patch ➔ Compile ➔ Verify ➔ Commit.
• 100% Anti-Fabrication Law: Zero hallucination tolerated.

3. CONNECT: Provider-Agnostic Compute & Neural Edge Routing
• Never build single-vendor lock-in. A sovereign OS routes dynamically across local CPU/GPU and multi-cloud providers.
• Decouple 24/7 cloud intake (Render server keep-alive) from local heavy compilation.

4. ORCHESTRATE: 1 Founder = 1,000 Autonomous AI Engineers
• Central Mother Brain event bus delegating parallel tasks across specialized subagents.
• Real-time quant scanning, dynamic video assembly, and full-stack software development in 48-hour sprints.

5. SYNAPSE: Durable Memory Journals Over Stale Vectors
• Vector search retrieves semantic similarity; it does NOT teach an agent from its past mistakes.
• Autonomous execution requires durable append-only experience journals (1.5MB+ active history) and persistent anti-repetition rules.

6. VERIFY: Cryptographic Pre-Flight Interception (Show > Tell)
• "It worked in my demo" is NOT a testing strategy.
• Automated pre-flight HTTP 200 probes physically intercept bad dispatches.
• Every production build and native APK must pass clean compilation with verified SHA-256 evidence.

7. SHIP & SCALE: Production Delivery & Revenue Execution
• Real-world software delivery: Native Android APKs, offline-first PWA billing suites, and Full HD media reels.
• Autonomous execution that scales client value and verifiable revenue.

Autonomous AI isn't prompted into existence. It is forged through relentless systems architecture.

♻️ Repost if you are building beyond wrappers in 2026.
➕ Follow Praveen Mahawar & GARUDA OS for sovereign enterprise AI engineering.

🌐 Explore: https://www.garudaos.in
Founder & Chief Sovereign Architect: Praveen Mahawar

#AIAgents #EnterpriseAI #AgenticWorkflows #SystemsEngineering #GARUDAOS #SoftwareArchitecture #DeepTechIndia #BengaluruTech #AIInfrastructure`;

async function publishMasterRoadmap() {
  const cookieVal = process.env.LINKEDIN_LI_AT;
  if (!cookieVal) throw new Error("Missing LINKEDIN_LI_AT in .env");

  if (!fs.existsSync(MEDIA_PATH)) throw new Error("Media file not found at: " + MEDIA_PATH);

  console.log("🚀 [GARUDA LINKEDIN POSTER] Launching Chromium to publish Master Animated Post...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,1000"]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1000 });
    await page.setCookie({
      name: "li_at",
      value: cookieVal,
      domain: ".linkedin.com",
      path: "/",
      httpOnly: true,
      secure: true
    });

    console.log("▶ [1/5] Navigating directly to https://www.linkedin.com/feed/?shareActive=true...");
    await page.goto("https://www.linkedin.com/feed/?shareActive=true", { waitUntil: "domcontentloaded", timeout: 60000 });
    await new Promise(r => setTimeout(r, 6000));

    // Inspect the modal
    console.log("▶ [2/5] Inspecting share modal DOM...");
    const modalInfo = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll("input")).map(i => ({
        type: i.type,
        accept: i.accept,
        id: i.id,
        name: i.name,
        className: i.className
      }));
      const buttons = Array.from(document.querySelectorAll("button")).map(b => ({
        ariaLabel: b.getAttribute("aria-label"),
        text: (b.innerText || "").trim(),
        className: b.className
      })).filter(b => b.ariaLabel || b.text);
      return { inputs, buttons };
    });

    console.log("Found file inputs:", JSON.stringify(modalInfo.inputs.filter(i => i.type === "file")));
    console.log("Found relevant buttons:", JSON.stringify(modalInfo.buttons.filter(b => 
      (b.ariaLabel && (b.ariaLabel.toLowerCase().includes("media") || b.ariaLabel.toLowerCase().includes("photo") || b.ariaLabel.toLowerCase().includes("image"))) ||
      (b.text && ["post", "next", "done"].includes(b.text.toLowerCase()))
    )));

    // Look for file input
    let fileInput = await page.$("input[type='file']");
    if (!fileInput) {
      console.log("File input not directly found. Clicking media/photo button...");
      const clickedMediaBtn = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const mediaBtn = btns.find(b => {
          const al = (b.getAttribute("aria-label") || "").toLowerCase();
          return al.includes("media") || al.includes("photo") || al.includes("image");
        });
        if (mediaBtn) {
          mediaBtn.click();
          return mediaBtn.getAttribute("aria-label");
        }
        return null;
      });
      console.log("Clicked media button:", clickedMediaBtn);
      await new Promise(r => setTimeout(r, 2500));
      fileInput = await page.$("input[type='file']");
    }

    if (!fileInput) {
      // Try finding the second icon in the bottom toolbar of the modal
      console.log("Trying toolbar icon click...");
      const coords = await page.evaluate(() => {
        // Modal is centered around x: 500, y: 440
        // In share_active_modal.png, the image icon is near x: 269, y: 440
        const modal = document.querySelector(".share-box-feed-entry__wrapper, .artdeco-modal, div[role='dialog']");
        if (modal) {
          const r = modal.getBoundingClientRect();
          // Icons are in the footer
          const buttons = Array.from(modal.querySelectorAll("button"));
          const photoBtn = buttons.find(b => {
            const svg = b.querySelector("svg");
            const aria = (b.getAttribute("aria-label") || "").toLowerCase();
            return aria.includes("media") || aria.includes("photo") || (svg && svg.getAttribute("data-test-icon")?.includes("image"));
          });
          if (photoBtn) {
            const pr = photoBtn.getBoundingClientRect();
            return { x: pr.left + pr.width / 2, y: pr.top + pr.height / 2 };
          }
        }
        return null;
      });

      if (coords) {
        console.log(`Clicking photo button at (${coords.x}, ${coords.y})...`);
        await page.mouse.click(coords.x, coords.y);
        await new Promise(r => setTimeout(r, 2000));
        fileInput = await page.$("input[type='file']");
      }
    }

    if (!fileInput) {
      await page.screenshot({ path: path.join(OUTPUT_DIR, "modal_debug_no_file_input.png") });
      throw new Error("Could not find file input for uploading animated GIF!");
    }

    console.log(`▶ [3/5] Uploading Master Animated GIF: ${MEDIA_PATH} (${(fs.statSync(MEDIA_PATH).size / 1024).toFixed(1)} KB)...`);
    await fileInput.uploadFile(MEDIA_PATH);
    console.log("Waiting 6 seconds for image/gif preview processing in modal...");
    await new Promise(r => setTimeout(r, 6000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, "roadmap_media_uploaded_modal.png") });
    console.log("✔ Screenshot saved: roadmap_media_uploaded_modal.png");

    // Check if 'Next' button needs to be clicked (common in LinkedIn photo/media upload dialog)
    const clickedNext = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const nextBtn = btns.find(b => {
        const txt = (b.innerText || "").trim().toLowerCase();
        return (txt === "next" || txt === "done") && !b.disabled;
      });
      if (nextBtn) {
        nextBtn.click();
        return (nextBtn.innerText || "").trim();
      }
      return null;
    });

    if (clickedNext) {
      console.log(`✔ Clicked "${clickedNext}" button. Waiting 3s...`);
      await new Promise(r => setTimeout(r, 3000));
    }

    // [4/5] Inject post text into editor
    console.log("▶ [4/5] Injecting master architecture copy into post editor...");
    const editorFound = await page.evaluate((text) => {
      const editor = document.querySelector("div[contenteditable='true'], div.ql-editor, div[aria-placeholder*='thoughts'], div[data-placeholder*='thoughts']");
      if (editor) {
        editor.focus();
        document.execCommand("insertText", false, text);
        return true;
      }
      return false;
    }, POST_CONTENT);

    if (!editorFound) {
      console.log("⚠️ Editor not found via contenteditable, attempting coordinate fallback...");
      await page.mouse.click(350, 200);
      await new Promise(r => setTimeout(r, 500));
      await page.evaluate((text) => {
        document.execCommand("insertText", false, text);
      }, POST_CONTENT);
    }

    console.log("✔ Text injected. Waiting 3 seconds before preview snapshot...");
    await new Promise(r => setTimeout(r, 3000));

    const previewPath = path.join(OUTPUT_DIR, "master_roadmap_post_ready_preview.png");
    await page.screenshot({ path: previewPath });
    console.log("✔ Preview screenshot saved:", previewPath);

    // [5/5] Click Post button
    console.log("▶ [5/5] Clicking Post button...");
    const postClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const postBtn = btns.find(b => {
        const txt = (b.innerText || "").trim().toLowerCase();
        return (txt === "post" || txt === "publish") && !b.disabled;
      });
      if (postBtn) {
        postBtn.click();
        return true;
      }
      return false;
    });

    if (!postClicked) {
      throw new Error("Could not find enabled 'Post' button!");
    }

    console.log("✔ Post button clicked! Waiting 15 seconds for LinkedIn submission and feed commit...");
    await new Promise(r => setTimeout(r, 15000));

    const finalProofPath = path.join(OUTPUT_DIR, "master_roadmap_post_published_live.png");
    await page.screenshot({ path: finalProofPath });
    console.log("✔ Live published proof screenshot saved:", finalProofPath);

    console.log("\n==============================================================");
    console.log("🎉 SUCCESS! GARUDA 7-STAGES MASTER ANIMATED ROADMAP PUBLISHED LIVE ON LINKEDIN!");
    console.log("Profile URL: https://www.linkedin.com/in/garuda-ai-ai-operating-system-227168432");
    console.log("==============================================================\n");

  } finally {
    await browser.close();
  }
}

publishMasterRoadmap().catch(err => {
  console.error("❌ Error in publishMasterRoadmap:", err);
  process.exit(1);
});
