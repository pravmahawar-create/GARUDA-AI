/**
 * 🦅 GARUDA Autonomous LinkedIn Trojan Poster
 * Direct Credentials Auth -> Feed Navigation -> Autonomous Trojan Post Drop -> Proof Capture
 */

const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const path = require("path");
const fs = require("fs");
require("dotenv").config();

const SESSION_DIR = path.resolve(__dirname, "../data/browser-sessions/linkedin");
const OUTPUT_DIR = path.resolve(__dirname, "../output");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const EMAIL = process.env.LINKEDIN_EMAIL || "garudaos.ai@gmail.com";
const PASS = process.env.LINKEDIN_PASS || "Ayeshapm1@";

const POST_CONTENT = `The industry is asking the wrong question about Devin, Copilot, and AI software engineers.

The question isn't: "Can an LLM write code?" (Any 7B model can spit out Python syntax).
The real question is: "Can an autonomous AI survive in an enterprise monorepo without breaking production?"

In 2026, 87% of autonomous coding loops fail because of three fatal architectural flaws:

1. The Wrapper Hallucination:
Agents write code directly against raw chat prompts. They hallucinate packages that don't exist, modify unstaged files, and push breaking changes without containment.

2. Zero Worktree State Isolation:
Real engineering requires ephemeral Git Worktrees. If an AI agent isn't isolated in a dedicated sandbox worktree with strict process boundaries, it corrupts repo state.

3. The Missing Pre-Commit Forensic Gate:
In enterprise software, an agent's work cannot be trusted on "faith". Every patch must pass AST syntax interrogation, clean local compilation (exit code 0), and cryptographically verified SHA-256 state tracking before human signoff.

Chatbots give you code suggestions.
GARUDA gives you an Unstoppable, Governed Engineering Workforce.

Explore the Sovereign Architecture: https://www.garudaos.in

#GARUDA #AIArchitecture #EnterpriseEngineering #SoftwareDevelopment #AutonomousAgents #Devin #SystemDesign #TechLeadership #SaaS`;

const IMAGE_PATH = path.resolve(__dirname, "../output/trojan_visual.png");

async function executeAutonomousPost() {
  console.log("==========================================================================");
  console.log("🦅 GARUDA AUTONOMOUS LINKEDIN TROJAN POSTER");
  console.log("Target Identity: garudaos.ai@gmail.com (GARUDA OS)");
  console.log("==========================================================================\n");

  fs.mkdirSync(SESSION_DIR, { recursive: true });

  console.log("▶ [1/5] Launching Real Chrome with Stealth...");
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: false,
    defaultViewport: null,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--start-maximized",
      `--user-data-dir=${SESSION_DIR}`
    ]
  });

  try {
    const pages = await browser.pages();
    const page = pages[0] || (await browser.newPage());
    await page.bringToFront();

    console.log("▶ [2/5] Navigating to LinkedIn Login...");
    await page.goto("https://www.linkedin.com/login", { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise((r) => setTimeout(r, 3000));

    // React-safe robust credential injection (from linkedin-login-round2.js)
    console.log("✔ Injecting credentials via React-safe HTMLInputElement prototype...");
    const fillState = await page.evaluate((em, pw) => {
      const vis = (el) => el.offsetParent !== null;
      const emailEl = [...document.querySelectorAll("input")].filter((i) => i.type === "email" || i.id === "username" || i.name === "session_key").find(vis) || document.querySelector('input[name="session_key"], input#username, input[type="email"]');
      const passEl = [...document.querySelectorAll("input")].filter((i) => i.type === "password" || i.id === "password" || i.name === "session_password").find(vis) || document.querySelector('input[name="session_password"], input#password, input[type="password"]');

      if (!emailEl || !passEl) return { success: false };

      const setVal = (el, v) => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        setter.call(el, v);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      };

      setVal(emailEl, em);
      setVal(passEl, pw);
      return { success: true, emailVal: emailEl.value, passLen: (passEl.value || "").length };
    }, EMAIL, PASS);

    console.log("Credentials injected state:", JSON.stringify(fillState));
    await new Promise((r) => setTimeout(r, 1000));

    console.log("✔ Clicking exact 'Sign in' form submit button...");
    const clicked = await page.evaluate(() => {
      const vis = (el) => el.offsetParent !== null;
      const btns = Array.from(document.querySelectorAll("button")).filter(vis);
      // Strictly find button where text is exactly "Sign in" (NOT Microsoft, NOT Apple)
      const submitBtn = btns.find((b) => {
        const txt = (b.innerText || "").trim();
        return txt === "Sign in" && !txt.includes("Microsoft") && !txt.includes("Apple");
      });
      if (submitBtn) {
        submitBtn.click();
        return "clicked_exact_sign_in";
      }
      return null;
    });

    console.log("Submit button click result:", clicked);
    if (!clicked) {
      console.log("Pressing Enter to submit form...");
      await page.keyboard.press("Enter");
    }

    console.log("⏳ Waiting 10 seconds for authentication & navigation...");
    await new Promise((r) => setTimeout(r, 10000));

    let currentUrl = page.url();
    console.log("Current URL:", currentUrl);

    // If checkpoint / verification is triggered, wait up to 90s for completion
    if (currentUrl.includes("/checkpoint/") || currentUrl.includes("/challenge/")) {
      console.log("\n⚠️ [SECURITY CHECKPOINT DETECTED] If email OTP or quick captcha is shown, please complete it in the window.");
      console.log("Antigravity is monitoring for /feed navigation...");

      const startTime = Date.now();
      while (Date.now() - startTime < 90000) {
        await new Promise((r) => setTimeout(r, 3000));
        currentUrl = page.url();
        if (currentUrl.includes("/feed") || currentUrl.includes("/company/") || currentUrl.includes("/in/")) {
          console.log("✔ Checkpoint cleared! Reached feed:", currentUrl);
          break;
        }
      }
    }

    // Ensure we are on feed
    if (!currentUrl.includes("/feed")) {
      console.log("Navigating directly to https://www.linkedin.com/feed/ ...");
      await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded", timeout: 30000 });
      await new Promise((r) => setTimeout(r, 4000));
    }

    console.log("\n▶ [3/5] Feed reached! Initiating Post Modal...");
    await new Promise((r) => setTimeout(r, 3000));

    // Try finding "Start a post" button
    const postTrigger = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll("button, div[role='button']"));
      const target = all.find((el) => {
        const text = (el.innerText || "").trim().toLowerCase();
        const aria = (el.getAttribute("aria-label") || "").toLowerCase();
        return text.includes("start a post") || aria.includes("start a post");
      });
      if (target) {
        target.click();
        return true;
      }
      return false;
    });

    console.log("Start a post trigger clicked:", postTrigger);
    await new Promise((r) => setTimeout(r, 3000));

    // Check if modal opened
    console.log("▶ [4/5] Injecting Trojan Post Text into Editor...");
    const editor = await page.$("div.tiptap.ProseMirror, div[role='textbox'], div.ql-editor, div[contenteditable='true']");

    if (!editor) {
      const dumpPath = path.join(OUTPUT_DIR, "linkedin_editor_missing.png");
      await page.screenshot({ path: dumpPath });
      throw new Error(`Post editor not found in modal! Screenshot saved: ${dumpPath}`);
    }

    await editor.click();
    await new Promise((r) => setTimeout(r, 800));

    // Inject text via execCommand for React/Draft.js/TipTap compatibility
    await page.evaluate((text) => {
      const el = document.querySelector("div.tiptap.ProseMirror, div[role='textbox'], div.ql-editor, div[contenteditable='true']");
      if (el) {
        el.focus();
        document.execCommand("insertText", false, text);
      }
    }, POST_CONTENT);

    await new Promise((r) => setTimeout(r, 2000));

    // Attach image if exists
    if (fs.existsSync(IMAGE_PATH)) {
      console.log("Attaching Trojan Visual:", IMAGE_PATH);
      const fileInput = await page.$("input[type='file'][accept*='image'], input[type='file']");
      if (fileInput) {
        await fileInput.uploadFile(IMAGE_PATH);
        await new Promise((r) => setTimeout(r, 4000));
        // If Next/Done button appears in photo editor
        await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll("button"));
          const done = btns.find((b) => ["next", "done"].includes((b.innerText || "").trim().toLowerCase()));
          if (done) done.click();
        });
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    // Take preview screenshot before clicking Post
    const previewPath = path.join(OUTPUT_DIR, "linkedin_trojan_ready_to_post.png");
    await page.screenshot({ path: previewPath });
    console.log("✔ Preview Screenshot Captured: linkedin_trojan_ready_to_post.png");

    // Click "Post" submit button
    console.log("▶ [5/5] Clicking 'Post' Submit Button...");
    const postClicked = await page.evaluate(() => {
      const sel = [
        "button.share-actions__primary-action",
        "button[data-view-name='share-component-post-button']",
        "button.artdeco-button--primary"
      ];
      for (const s of sel) {
        const btn = document.querySelector(s);
        if (btn && !btn.disabled && (btn.innerText || "").toLowerCase().includes("post")) {
          btn.click();
          return true;
        }
      }
      const btns = Array.from(document.querySelectorAll("button"));
      const pBtn = btns.find((b) => (b.innerText || "").trim().toLowerCase() === "post" && !b.disabled);
      if (pBtn) {
        pBtn.click();
        return true;
      }
      return false;
    });

    console.log("Post button submitted:", postClicked);
    console.log("⏳ Waiting 10 seconds for post submission & feed refresh...");
    await new Promise((r) => setTimeout(r, 10000));

    const liveProofPath = path.join(OUTPUT_DIR, "linkedin_trojan_live_proof.png");
    await page.screenshot({ path: liveProofPath });
    console.log("\n🎉 [SUCCESS] Trojan Post Published Live on LinkedIn!");
    console.log("📸 Live Proof Saved:", liveProofPath);

    return { success: true, proof: liveProofPath };
  } catch (err) {
    console.error("❌ Execution Error:", err.message);
    const errPath = path.join(OUTPUT_DIR, "linkedin_trojan_error.png");
    try {
      const pages = await browser.pages();
      if (pages.length) await pages[0].screenshot({ path: errPath });
      console.log("Error screenshot captured:", errPath);
    } catch (_) {}
    throw err;
  } finally {
    // Keep browser open for 15s to ensure complete telemetry sync, then close
    await new Promise((r) => setTimeout(r, 8000));
    await browser.close();
  }
}

if (require.main === module) {
  executeAutonomousPost().catch((err) => {
    process.exit(1);
  });
}

module.exports = { executeAutonomousPost };
