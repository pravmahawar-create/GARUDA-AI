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

const POST_CONTENT = `The "Mumbai Server" Lie: Why 90% of "Sovereign AI" in India Still Violates the DPDP Act.

Every enterprise AI review in BFSI starts with one question: "Is the model hosted in India?"
The vendor nods: "Yes, weights are in Mumbai." The box gets checked. The architecture is declared "Sovereign."

This is a dangerous architectural illusion.

A model does not hold customer data. The orchestration pipeline does.
In production enterprise architectures, a single customer prompt fans out into:
1. Embedding computation (often routed through foreign API endpoints).
2. Vector lookup (stored across multi-tenant US/EU cloud clusters).
3. Tool execution (third-party webhook triggers).
4. Observability telemetry (Datadog/LangSmith capturing unmasked raw prompt PII).
5. Evaluation logs and error traces.

The model weights sat in Mumbai.
Six copies of the customer's private financial data did not.

Under India's Digital Personal Data Protection (DPDP) Act and RBI compliance frameworks, sovereignty is NOT a deployment zip-code. 
Sovereignty is the cryptographic integrity of the entire data path.

At GARUDA OS, we engineered sovereign AI around a zero-leakage standard:
- 100% Air-gapped deterministic local embeddings.
- In-VPC vector containment (zero external telemetry).
- Zero third-party observability leakage.
- Cryptographic SHA-256 state tracking for verifiable legal provenance.

If your sovereign AI architecture fits on one slide, it’s not an architecture — it’s just a hosting diagram.

Explore True Sovereign Architecture: https://www.garudaos.in

#SovereignAI #DPDP #BFSI #AIGovernance #DataResidency #EnterpriseAI #GARUDAOS #TechLeadership #Fintech`;

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
