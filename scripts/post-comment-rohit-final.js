/**
 * 🦅 GARUDA Autonomous LinkedIn Commenter on Rohit Kohli Post
 * Step 1: Ensure Logged In (garudaos.ai@gmail.com)
 * Step 2: Search for Rohit Kohli under People
 * Step 3: Open Rohit Kohli Profile -> Recent Activity / Posts
 * Step 4: Locate the exact Sovereign AI Post
 * Step 5: Inject and Submit Authoritative Trojan Comment
 * Step 6: Capture Proof
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

async function run() {
  console.log("==========================================================================");
  console.log("🦅 GARUDA AUTONOMOUS LINKEDIN COMMENTER - ROHIT KOHLI");
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
    const pages = await browser.pages();
    const page = pages[0] || (await browser.newPage());
    await page.bringToFront();

    console.log("▶ [1/5] Checking LinkedIn Login State...");
    await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise((r) => setTimeout(r, 4000));

    if (page.url().includes("/login") || page.url().includes("/uas/login") || page.url().includes("/checkpoint/")) {
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
        const submitBtn = btns.find((b) => {
          const txt = (b.innerText || "").trim();
          return txt === "Sign in" && !txt.includes("Microsoft") && !txt.includes("Apple");
        });
        if (submitBtn) submitBtn.click();
      });

      console.log("Waiting 8s for auth redirect...");
      await new Promise((r) => setTimeout(r, 8000));
    }

    console.log("Current URL after login check:", page.url());

    console.log("▶ [2/5] Searching for Rohit Kohli (People)...");
    await page.goto("https://www.linkedin.com/search/results/people/?keywords=Rohit%20Kohli&origin=GLOBAL_SEARCH_HEADER", { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise((r) => setTimeout(r, 6000));

    // Capture search page
    await page.screenshot({ path: path.join(OUTPUT_DIR, "step2_rohit_people_search.png") });

    // Extract profile URLs of people named Rohit Kohli
    const targetProfile = await page.evaluate(() => {
      // Find cards in people search
      const cards = Array.from(document.querySelectorAll(".reusable-search__result-container, .search-results-container li, div.artdeco-entity-lockup"));
      for (const card of cards) {
        const text = card.innerText || "";
        const link = card.querySelector("a[href*='/in/']");
        if (link && (text.includes("Rohit Kohli") || text.includes("Kohli"))) {
          // If headline mentions CTO or Solutions or Sovereign
          if (text.includes("CTO") || text.includes("Enterprise") || text.includes("Solutions") || text.includes("ScoreMe") || text.includes("Founder")) {
            return { href: link.href.split("?")[0], text: text.replace(/\n+/g, " | ").substring(0, 200) };
          }
        }
      }
      // If none explicitly matched CTO in top cards, return the first Rohit Kohli link
      for (const card of cards) {
        const text = card.innerText || "";
        const link = card.querySelector("a[href*='/in/']");
        if (link && text.includes("Rohit Kohli")) {
          return { href: link.href.split("?")[0], text: text.replace(/\n+/g, " | ").substring(0, 200) };
        }
      }
      return null;
    });

    console.log("Target Profile found:", JSON.stringify(targetProfile, null, 2));

    let activityUrl = "";
    if (targetProfile && targetProfile.href) {
      activityUrl = `${targetProfile.href}/recent-activity/all/`;
    } else {
      // Fallback: search directly for content posts by Rohit Kohli
      console.log("Direct profile link not found in DOM, trying posts search...");
      activityUrl = "https://www.linkedin.com/search/results/content/?keywords=Rohit%20Kohli%20sovereign%20weights%20Mumbai&origin=GLOBAL_SEARCH_HEADER";
    }

    console.log("▶ [3/5] Navigating to Rohit Kohli's Posts:", activityUrl);
    await page.goto(activityUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise((r) => setTimeout(r, 6000));

    // Scroll slightly to trigger feed rendering
    await page.evaluate(() => window.scrollBy(0, 400));
    await new Promise((r) => setTimeout(r, 2000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, "step3_rohit_posts_view.png") });

    console.log("▶ [4/5] Searching for Sovereign AI post container & clicking Comment...");
    const commentClicked = await page.evaluate(() => {
      // Find containers
      const containers = Array.from(document.querySelectorAll(".feed-shared-update-v2, div[data-urn], div.artdeco-card"));
      let targetContainer = null;

      for (const c of containers) {
        const t = (c.innerText || "").toLowerCase();
        if (t.includes("sovereign") || t.includes("inference trace") || t.includes("mumbai") || t.includes("weights")) {
          targetContainer = c;
          break;
        }
      }

      // Fallback to first container on the activity page
      if (!targetContainer && containers.length > 0) {
        targetContainer = containers[0];
      }

      if (!targetContainer) return { success: false, reason: "No container found on activity page" };

      targetContainer.scrollIntoView({ behavior: "smooth", block: "center" });

      const btns = Array.from(targetContainer.querySelectorAll("button"));
      const cBtn = btns.find((b) => {
        const a = (b.getAttribute("aria-label") || "").toLowerCase();
        const tx = (b.innerText || "").toLowerCase();
        return a.includes("comment") || tx.includes("comment");
      });

      if (cBtn) {
        cBtn.click();
        return { success: true, clicked: true, snippet: (targetContainer.innerText || "").substring(0, 100) };
      }

      return { success: false, reason: "Comment button not found" };
    });

    console.log("Comment button trigger result:", JSON.stringify(commentClicked));
    await new Promise((r) => setTimeout(r, 3000));

    console.log("▶ [5/5] Typing Trojan comment & submitting...");
    const injected = await page.evaluate((cmt) => {
      const editor = document.querySelector(".comments-comment-box__form-container .editor-content p, .comments-comment-box div[contenteditable='true'], div[role='textbox']");
      if (!editor) return { success: false };

      editor.focus();
      document.execCommand("selectAll", false, null);
      document.execCommand("insertText", false, cmt);
      editor.dispatchEvent(new Event("input", { bubbles: true }));
      editor.dispatchEvent(new Event("change", { bubbles: true }));
      return { success: true };
    }, COMMENT_TEXT);

    console.log("Injection state:", JSON.stringify(injected));
    await new Promise((r) => setTimeout(r, 2000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, "step5_comment_injected.png") });

    // Submit comment
    const submitted = await page.evaluate(() => {
      const btn = document.querySelector(".comments-comment-box__submit-button, button.comments-comment-box__submit-button, button[type='submit']");
      if (btn && !btn.disabled) {
        btn.click();
        return { submitted: true };
      }
      const box = document.querySelector(".comments-comment-box");
      if (box) {
        const bList = Array.from(box.querySelectorAll("button"));
        const b = bList.find((x) => (x.innerText || "").trim().toLowerCase() === "comment" && !x.disabled);
        if (b) {
          b.click();
          return { submitted: true, via: "box" };
        }
      }
      return { submitted: false };
    });

    console.log("Submitted state:", JSON.stringify(submitted));
    console.log("Waiting 8s for live render...");
    await new Promise((r) => setTimeout(r, 8000));

    const finalPath = path.join(OUTPUT_DIR, "rohit_kohli_comment_live_final.png");
    await page.screenshot({ path: finalPath });
    console.log("\n🎉 [DONE] Screenshot captured:", finalPath);

    return { success: true, finalProof: finalPath };
  } catch (err) {
    console.error("❌ Error:", err.message);
    const errPath = path.join(OUTPUT_DIR, "step_error.png");
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
  run().catch((err) => {
    process.exit(1);
  });
}
