/**
 * Real Hardware Mouse Click on Notification Card
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

    console.log("Locating bounding rect of notification card...");
    const rect = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll("*"));
      const leaf = all.find(el => el.children.length === 0 && (el.innerText || "").trim() === "1 comment") ||
                   all.find(el => el.children.length === 0 && (el.innerText || "").includes("Nabarun Mondal"));
      if (leaf) {
        const r = leaf.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2, width: r.width, height: r.height };
      }
      return null;
    });

    console.log("Target Bounding Box:", JSON.stringify(rect));

    if (rect) {
      console.log(`Sending hardware mouse click at (${rect.x}, ${rect.y})...`);
      await page.mouse.move(rect.x, rect.y);
      await new Promise(r => setTimeout(r, 300));
      await page.mouse.down();
      await new Promise(r => setTimeout(r, 150));
      await page.mouse.up();
    }

    await new Promise(r => setTimeout(r, 8000));
    console.log("Current URL after hardware click:", page.url());

    const postProof = path.join(OUTPUT_DIR, "nabarun_post_after_hardware_click.png");
    await page.screenshot({ path: postProof });
    console.log("📸 Screenshot:", postProof);

    // Look for Reply button
    console.log("Looking for Reply button on active page...");
    const replyTriggered = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const rBtn = btns.find(b => {
        const t = (b.innerText || "").trim().toLowerCase();
        return t === "reply" || t.includes("reply to");
      });
      if (rBtn) {
        rBtn.click();
        return true;
      }
      return false;
    });

    console.log("Reply clicked:", replyTriggered);
    await new Promise(r => setTimeout(r, 2000));

    // Type text into active editor
    console.log("Injecting reply text...");
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
    const typedProof = path.join(OUTPUT_DIR, "nabarun_reply_typed_hw.png");
    await page.screenshot({ path: typedProof });
    console.log("📸 Typed Screenshot:", typedProof);

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

    console.log("Submit clicked:", submitted);
    await new Promise(r => setTimeout(r, 8000));

    const finalProof = path.join(OUTPUT_DIR, "nabarun_reply_live_hw.png");
    await page.screenshot({ path: finalProof });
    console.log("🎉 Final Proof:", finalProof);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await browser.close();
  }
}

run();
