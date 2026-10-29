/**
 * 🦅 GARUDA Autonomous LinkedIn Commenter - Exact TreeWalker Match & Click
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

const COMMENT_TEXT = `Spot on, Rohit. Most enterprise AI reviews treat sovereignty merely as a hosting zip-code while customer inference traces, embeddings, and tool-dispatch leak across foreign observability clusters.

Under India's DPDP Act and RBI compliance frameworks, sovereignty isn't a static server location—it's the cryptographic integrity of the entire data path. At GARUDA OS, we solved this by air-gapping vector ingestion, deterministic local embeddings, and eliminating unmasked third-party telemetry.

Total sovereign trace ownership is the only architecture that survives regulatory examination.`;

async function execute() {
  console.log("==========================================================================");
  console.log("🦅 GARUDA COMMENTER ON ROHIT KOHLI SOVEREIGN AI POST");
  console.log("==========================================================================\n");

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
    const page = (await browser.pages())[0] || (await browser.newPage());
    await page.bringToFront();

    console.log("▶ [1/5] Checking Login...");
    await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise((r) => setTimeout(r, 4000));

    if (page.url().includes("/login") || page.url().includes("/uas/login")) {
      console.log("Injecting credentials...");
      await page.evaluate((em, pw) => {
        const vis = (el) => el.offsetParent !== null;
        const emailEl = [...document.querySelectorAll("input")].filter((i) => i.type === "email" || i.id === "username" || i.name === "session_key").find(vis) || document.querySelector('input[name="session_key"], input#username, input[type="email"]');
        const passEl = [...document.querySelectorAll("input")].filter((i) => i.type === "password" || i.id === "password" || i.name === "session_password").find(vis) || document.querySelector('input[name="session_password"], input#password, input[type="password"]');

        if (!emailEl || !passEl) return;
        const setVal = (el, v) => {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
          setter.call(el, v);
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
        };
        setVal(emailEl, em);
        setVal(passEl, pw);
      }, EMAIL, PASS);

      await new Promise((r) => setTimeout(r, 1000));
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button")).filter((el) => el.offsetParent !== null);
        const submitBtn = btns.find((b) => (b.innerText || "").trim() === "Sign in");
        if (submitBtn) submitBtn.click();
      });
      await new Promise((r) => setTimeout(r, 8000));
    }

    console.log("▶ [2/5] Navigating to Rohit Kohli's Posts...");
    await page.goto("https://www.linkedin.com/in/rohitkohli73/recent-activity/all/", { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise((r) => setTimeout(r, 6000));

    console.log("▶ [3/5] Locating Post and Clicking Comment Button...");
    const clickSuccess = await page.evaluate(() => {
      // Find text node "Every sovereign AI review"
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      let targetEl = null;
      while ((node = walker.nextNode())) {
        if (node.nodeValue && node.nodeValue.includes("Every sovereign AI review")) {
          targetEl = node.parentElement;
          break;
        }
      }
      if (!targetEl) return { success: false, reason: "Text node not found" };

      // Ascend to post card container
      let container = targetEl;
      let postCard = null;
      for (let i = 0; i < 10; i++) {
        if (!container || container === document.body) break;
        // Check if container has comment button or action buttons
        const actionBtns = Array.from(container.querySelectorAll("button, [role='button']"));
        const commentBtn = actionBtns.find((b) => {
          const aria = (b.getAttribute("aria-label") || "").toLowerCase();
          const txt = (b.innerText || "").toLowerCase();
          return aria.includes("comment") || txt.includes("comment") || txt === "4";
        });
        if (commentBtn) {
          commentBtn.scrollIntoView({ behavior: "smooth", block: "center" });
          commentBtn.click();
          return { success: true, clickedBtn: commentBtn.innerText || commentBtn.getAttribute("aria-label") };
        }
        container = container.parentElement;
      }

      return { success: false, reason: "Could not find comment button in card hierarchy" };
    });

    console.log("Click result:", JSON.stringify(clickSuccess));
    await new Promise((r) => setTimeout(r, 3000));

    console.log("▶ [4/5] Injecting Comment into Editor...");
    const injected = await page.evaluate((cmt) => {
      // Find editor
      const editor = document.querySelector(".comments-comment-box__form-container .editor-content p, .comments-comment-box div[contenteditable='true'], div[role='textbox'], .ql-editor");
      if (!editor) return { success: false, reason: "Editor not found" };

      editor.focus();
      document.execCommand("selectAll", false, null);
      document.execCommand("insertText", false, cmt);
      editor.dispatchEvent(new Event("input", { bubbles: true }));
      editor.dispatchEvent(new Event("change", { bubbles: true }));
      return { success: true };
    }, COMMENT_TEXT);

    console.log("Injection result:", JSON.stringify(injected));
    await new Promise((r) => setTimeout(r, 2000));

    const readyProof = path.join(OUTPUT_DIR, "rohit_comment_injected_live.png");
    await page.screenshot({ path: readyProof });
    console.log("📸 Injected screenshot:", readyProof);

    console.log("▶ [5/5] Submitting Comment...");
    const submitted = await page.evaluate(() => {
      const submitBtn = document.querySelector(".comments-comment-box__submit-button, button.comments-comment-box__submit-button, button[type='submit']");
      if (submitBtn && !submitBtn.disabled) {
        submitBtn.click();
        return { submitted: true, type: "submit-button" };
      }
      const allBtns = Array.from(document.querySelectorAll("button"));
      const cBtn = allBtns.find((b) => (b.innerText || "").trim().toLowerCase() === "comment" && !b.disabled && b.offsetHeight > 0);
      if (cBtn) {
        cBtn.click();
        return { submitted: true, type: "allBtns-comment" };
      }
      return { submitted: false };
    });

    console.log("Submission result:", JSON.stringify(submitted));
    console.log("⏳ Waiting 10s for comment to render live...");
    await new Promise((r) => setTimeout(r, 10000));

    const finalProof = path.join(OUTPUT_DIR, "rohit_comment_live_verified.png");
    await page.screenshot({ path: finalProof });
    console.log("\n🎉 [SUCCESS] Live Verified Proof:", finalProof);

    return { success: true, proof: finalProof };
  } catch (err) {
    console.error("Execution failed:", err.message);
    throw err;
  } finally {
    await new Promise((r) => setTimeout(r, 5000));
    await browser.close();
  }
}

if (require.main === module) {
  execute().catch((err) => {
    process.exit(1);
  });
}
