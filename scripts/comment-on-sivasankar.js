const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const BASE_DIR = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(BASE_DIR, "output");
const IMAGE_PATH = path.join(OUTPUT_DIR, "garuda_7_stages_infographic.png");

async function commentOnSivasankar() {
  const cookieVal = process.env.LINKEDIN_LI_AT;
  if (!cookieVal) throw new Error("Missing LINKEDIN_LI_AT");

  console.log("🦅 [GARUDA TROJAN STRIKE] Targeting Sivasankar Natarajan's 7-Stages Post...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,1000"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1000 });
  await page.setCookie({
    name: "li_at",
    value: cookieVal,
    domain: ".linkedin.com",
    path: "/"
  });

  const postUrl = "https://www.linkedin.com/posts/sivasankar-natarajan_aiagents-llmops-rag-share-7504431333255827456-rpuw/";
  console.log("▶ Loading Sivasankar post...");
  await page.goto(postUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await new Promise(r => setTimeout(r, 6000));

  // Find comment editor
  const editor = await page.$("div[role='textbox'], .comments-comment-box__textarea, .ql-editor");
  if (!editor) throw new Error("Comment textbox not found!");

  console.log("▶ Clicking comment box...");
  await editor.click();
  await new Promise(r => setTimeout(r, 1500));

  // Try to attach image if file input is available in comment box
  try {
    const fileInput = await page.$(".comments-comment-box input[type='file'], input[type='file'][name*='image']");
    if (fileInput && fs.existsSync(IMAGE_PATH)) {
      console.log("▶ Attaching GARUDA 7 Stages Infographic to comment...");
      await fileInput.uploadFile(IMAGE_PATH);
      await new Promise(r => setTimeout(r, 3500));
      console.log("✔ Image attached to comment!");
    } else {
      console.log("ℹ Comment box image input not directly accessible, typing text comment...");
    }
  } catch (err) {
    console.warn("Could not attach image to comment:", err.message);
  }

  // Type authoritative comment
  console.log("▶ Typing high-authority architectural comment...");
  const lines = [
    "Brilliant breakdown Sivasankar Natarajan. Spot on with Stage 6 ('It worked in my demo is not a testing strategy').",
    "",
    "When scaling beyond single-agent prototypes into multi-agent sovereign production systems, we had to codify 3 additional non-negotiable architectural layers:",
    "",
    "1. Hierarchical State Machines over Free-Wheeling ReAct: Unbounded agent loops burn tokens and hallucinate under edge cases. We enforce deterministic state transitions (Goal → Plan → Isolate → Patch → Compile → Verify).",
    "2. Cryptographic State Checkpoints: Every database change, critical asset, and production build must produce verified SHA-256 evidence with clean Exit Code 0 before passing to downstream agents.",
    "3. Durable Experience Synapses: Vector DBs retrieve semantic similarity, but they don't prevent an agent from repeating past mistakes. Autonomous systems require append-only experience journals and persistent anti-repetition rule engines.",
    "",
    "Real production agents aren't just prompted—they are strictly governed. Great visual framework!"
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
    await new Promise(r => setTimeout(r, 50));
  }

  await new Promise(r => setTimeout(r, 2000));
  const previewSnap = path.join(OUTPUT_DIR, "sivasankar_comment_preview.png");
  await page.screenshot({ path: previewSnap });
  console.log("✔ Comment preview screenshot saved:", previewSnap);

  // Click Submit
  console.log("▶ Submitting comment...");
  const submitted = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    for (const b of btns) {
      const txt = (b.innerText || "").trim();
      if ((txt === "Comment" || txt === "Post") && !b.disabled) {
        b.scrollIntoView({ behavior: "instant", block: "center" });
        b.click();
        return true;
      }
    }
    return false;
  });

  if (!submitted) throw new Error("Submit comment button not found or disabled!");

  console.log("✔ Clicked Comment button! Waiting 6s for live confirmation...");
  await new Promise(r => setTimeout(r, 6000));

  const proofSnap = path.join(OUTPUT_DIR, "sivasankar_comment_live_proof.png");
  await page.screenshot({ path: proofSnap });
  console.log("✔ Live proof screenshot saved:", proofSnap);

  await browser.close();
  console.log("🎉 TROJAN COMMENT ON SIVASANKAR POST SUCCESSFULLY PUBLISHED!");
}

commentOnSivasankar().catch(err => {
  console.error("❌ Error posting comment:", err);
  process.exit(1);
});
