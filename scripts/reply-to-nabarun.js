/**
 * 🦅 GARUDA AUTONOMOUS REPLY TO NABARUN MONDAL
 * Posts high-authority technical reply under Nabarun's LinkedIn comment.
 */

require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');
const fs = require('fs');

puppeteer.use(StealthPlugin());

const SESSION_DIR = path.resolve(__dirname, '../data/browser-sessions/linkedin');
const OUTPUT_DIR = path.resolve(__dirname, '../output');

const LINKEDIN_EMAIL = process.env.LINKEDIN_EMAIL || 'garudaos.ai@gmail.com';
const LINKEDIN_PASS = process.env.LINKEDIN_PASS || 'Ayeshapm1@';

const REPLY_TEXT = `Nabarun Mondal Rathijit Sarkar You hit the exact nerve: A system without mathematically defined Go/No-Go boundaries is merely a chatbot hallucination masquerading as engineering.

At GARUDA OS, we live by your exact manifesto: "Demonstrate Working System over Discussion on Documents." 

Here are the 4 Non-Negotiable Go/No-Go Boundary Gates governing our autonomous engineering workforce:

1. Gate 1 — Deterministic AST Syntax Interrogation: An agent cannot push or commit code based on "LLM confidence". If an abstract syntax tree audit or clean compilation fails (Exit Code != 0), the branch is rejected at the kernel level.
2. Gate 2 — Cryptographic SHA-256 State Verification: Every artifact, build, and deployment produces verified cryptographic proof. Zero phantom files, zero fabricated benchmarks.
3. Gate 3 — Ephemeral Worktree Isolation: Swarms execute inside isolated git worktrees with rigid sandboxing. A failing or looping agent cannot corrupt the sovereign master tree.
4. Gate 4 — Hard Ratchet Guardrails: Deterministic runtime governance replaces unbounded prompt loops.

Chatbots ask you to trust their next token. GARUDA gives enterprises verifiable mathematical control.

Throw your toughest architectural edge-case at our live runtime: https://www.garudaos.in`;

async function executeReply() {
  console.log("==========================================================================");
  console.log("🦅 GARUDA SOVEREIGN REPLY TO NABARUN MONDAL");
  console.log("==========================================================================\n");

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

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

    console.log("▶ [1/4] Ensuring active LinkedIn authentication...");
    await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise((r) => setTimeout(r, 4000));

    if (page.url().includes("/login") || page.url().includes("/uas/login")) {
      console.log("Session redirect detected, logging in...");
      await page.goto("https://www.linkedin.com/login", { waitUntil: "domcontentloaded", timeout: 45000 });
      await new Promise((r) => setTimeout(r, 3000));

      await page.evaluate((em, pw) => {
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
        return { success: true };
      }, LINKEDIN_EMAIL, LINKEDIN_PASS);

      await new Promise((r) => setTimeout(r, 1000));

      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const submitBtn = btns.find((b) => {
          const txt = (b.innerText || "").trim();
          return txt === "Sign in" && !txt.includes("Microsoft") && !txt.includes("Apple");
        });
        if (submitBtn) submitBtn.click();
      });

      console.log("Waiting 10s for login redirect...");
      await new Promise((r) => setTimeout(r, 10000));
    }

    console.log("▶ [2/4] Navigating to Notifications to open post...");
    await page.goto("https://www.linkedin.com/notifications/", { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise((r) => setTimeout(r, 5000));

    // Find and click the notification card directly via DOM click
    console.log("Locating Nabarun's notification item...");
    const clicked = await page.evaluate(() => {
      const allCards = Array.from(document.querySelectorAll("article, div.nt-card, div.notification-card, li, div"));
      for (const card of allCards) {
        const txt = card.innerText || "";
        if (txt.includes("Nabarun Mondal") && txt.includes("commented on your post")) {
          const link = card.querySelector("a") || card;
          link.click();
          return true;
        }
      }
      return false;
    });

    console.log("Notification clicked:", clicked);
    await new Promise((r) => setTimeout(r, 7000));

    console.log("Current post URL:", page.url());

    // Scroll down to find the comments
    await page.evaluate(() => window.scrollBy(0, 450));
    await new Promise((r) => setTimeout(r, 3000));

    console.log("▶ [3/4] Finding Reply button under Nabarun's comment...");
    const replyTriggered = await page.evaluate(() => {
      // Find comment that mentions Nabarun or boundaries
      const comments = Array.from(document.querySelectorAll(".comments-comment-item, article[aria-label*='Comment'], div[data-finite-scroll-hotkey-item*='comment'], div.comments-comments-list__comment-item"));
      
      let targetComment = null;
      for (const c of comments) {
        if (c.innerText && (c.innerText.includes("Nabarun") || c.innerText.includes("boundaries"))) {
          targetComment = c;
          break;
        }
      }

      // If targetComment found, find Reply button inside it
      if (targetComment) {
        const replyBtn = Array.from(targetComment.querySelectorAll("button")).find(b => {
          const t = (b.innerText || "").trim().toLowerCase();
          const aria = (b.getAttribute("aria-label") || "").toLowerCase();
          return t === "reply" || aria.includes("reply to");
        });
        if (replyBtn) {
          replyBtn.click();
          return "clicked_comment_reply_btn";
        }
      }

      // Fallback: search all buttons on page for Reply
      const allReplyBtns = Array.from(document.querySelectorAll("button")).filter(b => {
        const t = (b.innerText || "").trim().toLowerCase();
        const aria = (b.getAttribute("aria-label") || "").toLowerCase();
        return t === "reply" || aria.includes("reply");
      });

      if (allReplyBtns.length > 0) {
        allReplyBtns[0].click();
        return "clicked_first_reply_btn";
      }

      // Fallback 2: click the main comment input box if direct reply not separate
      const commentBoxes = Array.from(document.querySelectorAll("div[role='textbox'], .ql-editor, div.comments-comment-box__editor"));
      if (commentBoxes.length > 0) {
        commentBoxes[commentBoxes.length - 1].click();
        return "clicked_comment_box";
      }

      return null;
    });

    console.log("Reply Trigger Result:", replyTriggered);
    await new Promise((r) => setTimeout(r, 2000));

    // Type the reply text into the active editor
    console.log("Injecting reply text into editor...");
    const injected = await page.evaluate((text) => {
      const activeEditors = Array.from(document.querySelectorAll("div[role='textbox'], .ql-editor, div.comments-comment-box__editor, div.editor-content p, div.comments-comment-box div[contenteditable='true']"));
      // Pick the last visible editor (most likely the reply box under comment)
      const visEditors = activeEditors.filter(e => e.offsetParent !== null);
      const editor = visEditors[visEditors.length - 1] || activeEditors[activeEditors.length - 1];

      if (editor) {
        editor.focus();
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, text);
        editor.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
      return false;
    }, REPLY_TEXT);

    console.log("Text injected into editor:", injected);

    if (!injected) {
      console.log("Fallback typing via keyboard...");
      await page.keyboard.type(REPLY_TEXT, { delay: 15 });
    }

    await new Promise((r) => setTimeout(r, 2000));

    const preSubmitProof = path.join(OUTPUT_DIR, "nabarun_reply_ready_to_post.png");
    await page.screenshot({ path: preSubmitProof });
    console.log("📸 Pre-submit screenshot captured:", preSubmitProof);

    console.log("▶ [4/4] Submitting Reply...");
    const replySubmitted = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      // Look for Reply / Post / Comment submit button
      const submitBtn = buttons.find(b => {
        const t = (b.innerText || "").trim().toLowerCase();
        const aria = (b.getAttribute("aria-label") || "").toLowerCase();
        return (t === "reply" || t === "post" || t === "comment") && !b.disabled && b.offsetParent !== null;
      });

      if (submitBtn) {
        submitBtn.click();
        return true;
      }
      return false;
    });

    console.log("Reply submit clicked:", replySubmitted);
    console.log("⏳ Waiting 8s for submission...");
    await new Promise((r) => setTimeout(r, 8000));

    const liveProof = path.join(OUTPUT_DIR, "nabarun_reply_live_proof.png");
    await page.screenshot({ path: liveProof });
    console.log("\n🎉 [SUCCESS] Live Proof Saved to:", liveProof);

    return { success: true, proof: liveProof };
  } catch (err) {
    console.error("❌ Execution Error:", err.message);
    const errProof = path.join(OUTPUT_DIR, "nabarun_reply_error.png");
    try {
      const pages = await browser.pages();
      if (pages.length) await pages[0].screenshot({ path: errProof });
    } catch (_) {}
    throw err;
  } finally {
    await new Promise((r) => setTimeout(r, 5000));
    await browser.close();
  }
}

executeReply().catch((err) => {
  console.error(err);
  process.exit(1);
});
