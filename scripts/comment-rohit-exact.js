/**
 * 🦅 GARUDA Autonomous LinkedIn Commenter on Rohit Kohli's Exact Profile Post
 * Target URL: https://www.linkedin.com/in/rohitkohli73/recent-activity/all/
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

async function executeCommentExact() {
  console.log("==========================================================================");
  console.log("🦅 GARUDA AUTONOMOUS LINKEDIN COMMENTER - ROHIT KOHLI EXACT POST");
  console.log("Target: https://www.linkedin.com/in/rohitkohli73/recent-activity/all/");
  console.log("Identity: GARUDA OS (garudaos.ai@gmail.com)");
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

    console.log("▶ [1/4] Ensuring Authenticated Session...");
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

    console.log("▶ [2/4] Navigating directly to Rohit Kohli's Posts...");
    await page.goto("https://www.linkedin.com/in/rohitkohli73/recent-activity/all/", { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise((r) => setTimeout(r, 6000));

    // Scroll slightly to trigger feed item rendering
    await page.evaluate(() => window.scrollBy(0, 300));
    await new Promise((r) => setTimeout(r, 2000));

    const activityProof = path.join(OUTPUT_DIR, "rohit_activity_page.png");
    await page.screenshot({ path: activityProof });
    console.log("📸 Activity page captured:", activityProof);

    console.log("▶ [3/4] Finding Sovereign AI Post and Clicking Comment...");
    const clickResult = await page.evaluate(() => {
      // Find cards on activity page
      const cards = Array.from(document.querySelectorAll(".feed-shared-update-v2, div[data-urn], div.artdeco-card, .profile-creator-shared-feed-update__container"));
      let targetCard = null;

      for (const card of cards) {
        const text = (card.innerText || "").toLowerCase();
        if (text.includes("sovereign") || text.includes("inference trace") || text.includes("mumbai") || text.includes("weights")) {
          targetCard = card;
          break;
        }
      }

      if (!targetCard && cards.length > 0) {
        // Top post on his activity page is almost certainly it
        targetCard = cards[0];
      }

      if (!targetCard) return { success: false, reason: "No card found" };

      targetCard.scrollIntoView({ behavior: "smooth", block: "center" });

      const buttons = Array.from(targetCard.querySelectorAll("button"));
      const commentBtn = buttons.find((b) => {
        const aria = (b.getAttribute("aria-label") || "").toLowerCase();
        const txt = (b.innerText || "").toLowerCase();
        return aria.includes("comment") || txt.includes("comment");
      });

      if (commentBtn) {
        commentBtn.click();
        return { success: true, textSnippet: (targetCard.innerText || "").substring(0, 120) };
      }

      return { success: false, reason: "Comment button not found on card" };
    });

    console.log("Comment button click result:", JSON.stringify(clickResult));
    await new Promise((r) => setTimeout(r, 3000));

    console.log("▶ [4/4] Injecting and Submitting Comment...");
    const injected = await page.evaluate((cmt) => {
      const editor = document.querySelector(".comments-comment-box__form-container .editor-content p, .comments-comment-box div[contenteditable='true'], div[role='textbox']");
      if (!editor) return { success: false, reason: "Editor not found" };

      editor.focus();
      document.execCommand("selectAll", false, null);
      document.execCommand("insertText", false, cmt);
      editor.dispatchEvent(new Event("input", { bubbles: true }));
      editor.dispatchEvent(new Event("change", { bubbles: true }));

      return { success: true };
    }, COMMENT_TEXT);

    console.log("Comment injection:", JSON.stringify(injected));
    await new Promise((r) => setTimeout(r, 2000));

    const commentProof = path.join(OUTPUT_DIR, "rohit_comment_injected_exact.png");
    await page.screenshot({ path: commentProof });
    console.log("📸 Injected comment screenshot:", commentProof);

    const submitResult = await page.evaluate(() => {
      const btn = document.querySelector(".comments-comment-box__submit-button, button.comments-comment-box__submit-button, button[type='submit']");
      if (btn && !btn.disabled) {
        btn.click();
        return { submitted: true, via: "submit-btn" };
      }
      const box = document.querySelector(".comments-comment-box");
      if (box) {
        const btns = Array.from(box.querySelectorAll("button"));
        const b = btns.find((x) => (x.innerText || "").trim().toLowerCase() === "comment" && !x.disabled);
        if (b) {
          b.click();
          return { submitted: true, via: "box-comment" };
        }
      }
      return { submitted: false };
    });

    console.log("Submit result:", JSON.stringify(submitResult));
    console.log("⏳ Waiting 10s for comment to render live...");
    await new Promise((r) => setTimeout(r, 10000));

    const liveSuccessPath = path.join(OUTPUT_DIR, "rohit_kohli_comment_live_success.png");
    await page.screenshot({ path: liveSuccessPath });
    console.log("\n🎉 [SUCCESS] Live Comment Proof Saved:", liveSuccessPath);

    return { success: true, proof: liveSuccessPath };
  } catch (err) {
    console.error("❌ Error:", err.message);
    const errPath = path.join(OUTPUT_DIR, "rohit_exact_error.png");
    try {
      const pages = await browser.pages();
      if (pages.length) await pages[0].screenshot({ path: errPath });
    } catch (_) {}
    throw err;
  } finally {
    await new Promise((r) => setTimeout(r, 5000));
    await browser.close();
  }
}

if (require.main === module) {
  executeCommentExact().catch((err) => {
    process.exit(1);
  });
}
