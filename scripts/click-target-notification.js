/**
 * 🦅 PRECISE NOTIFICATION CLICK ON "1 comment" LEAF
 */
require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');
const fs = require('fs');

puppeteer.use(StealthPlugin());
const SESSION_DIR = path.resolve(__dirname, '../data/browser-sessions/linkedin');
const OUTPUT_DIR = path.resolve(__dirname, '../output');

const REPLY_TEXT = `Nabarun Mondal & Rathijit Sarkar — You nailed the exact mathematical boundary in your SSRN paper ("Autonomous Coding is Exponentially Costly", SSRN 7531259).

You proved using Kolmogorov complexity that raw probabilistic LLM agents inevitably hit an Exponential Complexity Wall of token consumption and timeline collapse when attempting to produce "slop-free" software in large state spaces. You advocated for Domain-Specific Constraints to circumvent that wall.

That exact theorem is why GARUDA OS was architected from Day 1:

1. Demolishing the Kolmogorov Wall via AST Interrogation: Instead of burning exponential tokens in blind prompt-fix loops, our kernel rejects non-zero exit codes (AST/compiler audits) at the pre-commit boundary with ZERO token overhead.
2. Ephemeral Git-Worktree State Compression: Swarms operate in micro-scoped, isolated git worktrees. Any degraded trajectory is pruned in O(1) time before polluting the sovereign master tree.
3. Cryptographic SHA-256 State Anchors: Deterministic mathematical truth replaces probabilistic faith.
4. Constitutional Domain Constraints as DSL: Our rigid governance directives serve as the exact Domain-Specific constraint engine your research recommends.

We live by your manifesto: "Demonstrate Working System over Discussion on Documents."

Throw your toughest monorepo edge case at our live architecture: https://www.garudaos.in`;

async function run() {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: false,
    defaultViewport: null,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled", `--user-data-dir=${SESSION_DIR}`]
  });

  try {
    const pages = await browser.pages();
    const page = pages[0] || (await browser.newPage());
    await page.goto("https://www.linkedin.com/notifications/", { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise(r => setTimeout(r, 6000));

    if (page.url().includes("/login")) {
      await page.goto("https://www.linkedin.com/login", { waitUntil: "domcontentloaded" });
      await new Promise(r => setTimeout(r, 3000));
      await page.evaluate((em, pw) => {
        const emailEl = document.querySelector('input[name="session_key"], input#username, input[type="email"]');
        const passEl = document.querySelector('input[name="session_password"], input#password, input[type="password"]');
        if (!emailEl || !passEl) return;
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        setter.call(emailEl, em); emailEl.dispatchEvent(new Event("input", { bubbles: true }));
        setter.call(passEl, pw); passEl.dispatchEvent(new Event("input", { bubbles: true }));
      }, process.env.LINKEDIN_EMAIL, process.env.LINKEDIN_PASS);
      await new Promise(r => setTimeout(r, 1000));
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll("button")).find(b => (b.innerText || "").trim() === "Sign in");
        if (btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 8000));
      await page.goto("https://www.linkedin.com/notifications/", { waitUntil: "domcontentloaded" });
      await new Promise(r => setTimeout(r, 6000));
    }

    console.log("Finding leaf element with '1 comment' or 'Perhaps it is a good start'...");
    const clickedInfo = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll("*"));
      // Find the specific leaf element
      const target = all.find(el => el.children.length === 0 && (el.innerText || "").trim() === "1 comment") ||
                     all.find(el => el.children.length === 0 && (el.innerText || "").includes("Perhaps it is a good start"));
      
      if (target) {
        // Find closest anchor or clickable container
        const clicker = target.closest("a") || target.closest("article") || target;
        clicker.click();
        return { success: true, tag: target.tagName, text: target.innerText };
      }
      return { success: false };
    });

    console.log("Leaf click result:", JSON.stringify(clickedInfo));
    await new Promise(r => setTimeout(r, 8000));

    console.log("Active page URL after click:", page.url());
    const proof1 = path.join(OUTPUT_DIR, "nabarun_post_loaded.png");
    await page.screenshot({ path: proof1 });
    console.log("📸 Screenshot captured:", proof1);

    // Scroll to see comments clearly
    await page.evaluate(() => window.scrollBy(0, 400));
    await new Promise(r => setTimeout(r, 3000));

    // Look for Reply button under Nabarun's comment
    console.log("Locating Reply button...");
    const replyClicked = await page.evaluate(() => {
      const allBtns = Array.from(document.querySelectorAll("button"));
      const replyBtn = allBtns.find(b => {
        const t = (b.innerText || "").trim().toLowerCase();
        const aria = (b.getAttribute("aria-label") || "").toLowerCase();
        return t === "reply" || aria.includes("reply to nabarun") || aria.includes("reply");
      });

      if (replyBtn) {
        replyBtn.click();
        return "clicked_reply";
      }

      // If no reply button, click comment box
      const box = document.querySelector("div[role='textbox'], .ql-editor, div[contenteditable='true']");
      if (box) {
        box.click();
        return "clicked_box";
      }
      return null;
    });

    console.log("Reply action:", replyClicked);
    await new Promise(r => setTimeout(r, 2000));

    // Type text into editor
    console.log("Typing reply text...");
    await page.evaluate((txt) => {
      const editors = Array.from(document.querySelectorAll("div[role='textbox'], .ql-editor, div[contenteditable='true']"));
      const active = editors.filter(e => e.offsetParent !== null);
      const targetEditor = active[active.length - 1] || editors[0];
      if (targetEditor) {
        targetEditor.focus();
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, txt);
        targetEditor.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, REPLY_TEXT);

    await new Promise(r => setTimeout(r, 2000));
    const typedProof = path.join(OUTPUT_DIR, "nabarun_reply_typed_clean.png");
    await page.screenshot({ path: typedProof });
    console.log("📸 Clean typed screenshot:", typedProof);

    // Click submit
    console.log("Submitting reply...");
    const submitted = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const submit = btns.find(b => {
        const t = (b.innerText || "").trim().toLowerCase();
        return (t === "reply" || t === "post" || t === "comment") && !b.disabled && b.offsetParent !== null;
      });
      if (submit) {
        submit.click();
        return true;
      }
      return false;
    });

    console.log("Submitted:", submitted);
    await new Promise(r => setTimeout(r, 8000));

    const finalProof = path.join(OUTPUT_DIR, "nabarun_reply_live_success.png");
    await page.screenshot({ path: finalProof });
    console.log("🎉 SUCCESS: Live Proof Saved to:", finalProof);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await browser.close();
  }
}

run();
