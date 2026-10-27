/**
 * Inspect and click exact submit button in comment box
 */
require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');
puppeteer.use(StealthPlugin());

const SESSION_DIR = path.resolve(__dirname, '../data/browser-sessions/linkedin');
const OUTPUT_DIR = path.resolve(__dirname, '../output');
const POST_URL = "https://www.linkedin.com/feed/update/urn:li:activity:7517952967036067840/";

async function clickSubmit() {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: false,
    defaultViewport: { width: 1440, height: 950 },
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled", `--user-data-dir=${SESSION_DIR}`]
  });

  try {
    const pages = await browser.pages();
    const page = pages[0] || (await browser.newPage());
    await page.setViewport({ width: 1440, height: 950 });

    console.log("Navigating to login...");
    await page.goto("https://www.linkedin.com/login", { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise(r => setTimeout(r, 2000));

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

    console.log("Navigating to post...");
    await page.goto(POST_URL, { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise(r => setTimeout(r, 6000));

    // Scroll down to the comment box
    await page.evaluate(() => window.scrollBy(0, 500));
    await new Promise(r => setTimeout(r, 2000));

    // Check all buttons on the page
    const buttons = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll("button"));
      return all.map(b => ({
        text: (b.innerText || "").trim(),
        aria: b.getAttribute("aria-label"),
        className: b.className,
        disabled: b.disabled,
        visible: b.offsetParent !== null,
        rect: b.getBoundingClientRect()
      })).filter(b => b.visible);
    });

    console.log("Visible buttons count:", buttons.length);
    const commentBtns = buttons.filter(b => 
      b.text.toLowerCase().includes("comment") || 
      b.text.toLowerCase().includes("reply") || 
      b.text.toLowerCase().includes("post") ||
      (b.aria && (b.aria.toLowerCase().includes("comment") || b.aria.toLowerCase().includes("reply") || b.aria.toLowerCase().includes("post")))
    );

    console.log("COMMENT BUTTONS:", JSON.stringify(commentBtns, null, 2));

    // Type text into editor if not already there
    await page.evaluate((txt) => {
      const editors = Array.from(document.querySelectorAll("div[role='textbox'], .ql-editor, div[contenteditable='true']"));
      const active = editors.filter(e => e.offsetParent !== null);
      const ed = active[active.length - 1] || editors[0];
      if (ed && (!ed.innerText || ed.innerText.trim().length < 10)) {
        ed.focus();
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, txt);
        ed.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, `Nabarun Mondal & Rathijit Sarkar — You nailed the exact mathematical boundary in your SSRN paper ("Autonomous Coding is Exponentially Costly", SSRN 7531259).\n\nYou proved using Kolmogorov complexity that raw probabilistic LLM agents inevitably hit an Exponential Complexity Wall when attempting slop-free engineering.\n\nGARUDA OS solves this deterministically:\n1. Demolishing Kolmogorov Wall via AST Interrogation (pre-commit zero exit codes)\n2. Ephemeral Git-Worktree State Compression (O(1) pruning)\n3. Cryptographic SHA-256 State Anchors\n4. Constitutional Domain Constraints as DSL\n\nWe live by your manifesto: "Demonstrate Working System over Discussion on Documents."\n\nLive Architecture: https://www.garudaos.in`);

    await new Promise(r => setTimeout(r, 2000));

    // Now re-check buttons to see the active submit button
    const postSubmitBtn = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll("button")).filter(b => b.offsetParent !== null && !b.disabled);
      // Find button whose text is Comment or Reply or Post
      const sub = all.find(b => {
        const t = (b.innerText || "").trim().toLowerCase();
        return t === "comment" || t === "reply" || t === "post";
      });
      if (sub) {
        sub.click();
        return { clicked: true, text: sub.innerText, className: sub.className };
      }
      return { clicked: false };
    });

    console.log("Post Submit Button Clicked:", JSON.stringify(postSubmitBtn));
    console.log("Waiting 8s for submission...");
    await new Promise(r => setTimeout(r, 8000));

    const finalScreenshot = path.join(OUTPUT_DIR, "nabarun_reply_SUBMITTED_SUCCESS.png");
    await page.screenshot({ path: finalScreenshot });
    console.log("📸 Final Screenshot Saved:", finalScreenshot);

  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
}

clickSubmit();
