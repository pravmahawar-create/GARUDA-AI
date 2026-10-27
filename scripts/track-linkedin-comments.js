/**
 * 🦅 GARUDA AUTONOMOUS LINKEDIN COMMENT TRACKER
 * Tracks comments, commenter profiles, and notifications on recent LinkedIn posts.
 */

require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');
const fs = require('fs');

puppeteer.use(StealthPlugin());

const SESSION_DIR = path.resolve(__dirname, '../data/browser-sessions/linkedin');
const OUTPUT_DIR = path.resolve(__dirname, '../output');
const DATA_DIR = path.resolve(__dirname, '../data');

const LINKEDIN_EMAIL = process.env.LINKEDIN_EMAIL || 'garudaos.ai@gmail.com';
const LINKEDIN_PASS = process.env.LINKEDIN_PASS || 'Ayeshapm1@';

async function trackComments() {
  console.log("==========================================================================");
  console.log("🦅 GARUDA LINKEDIN COMMENT & LEAD TRACKER");
  console.log("==========================================================================\n");

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(DATA_DIR, { recursive: true });

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

    console.log("▶ [1/4] Navigating to LinkedIn...");
    await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise((r) => setTimeout(r, 5000));

    let currentUrl = page.url();
    console.log("Current URL:", currentUrl);

    // If redirected to login, authenticate
    if (currentUrl.includes("/login") || currentUrl.includes("/uas/login") || currentUrl.includes("checkpoint")) {
      console.log("Performing robust login...");
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
        const vis = (el) => el.offsetParent !== null;
        const btns = Array.from(document.querySelectorAll("button")).filter(vis);
        const submitBtn = btns.find((b) => {
          const txt = (b.innerText || "").trim();
          return txt === "Sign in" && !txt.includes("Microsoft") && !txt.includes("Apple");
        });
        if (submitBtn) submitBtn.click();
      });

      console.log("Waiting 10s for login redirect...");
      await new Promise((r) => setTimeout(r, 10000));
    }

    // Now go to notifications
    console.log("▶ [2/4] Navigating to Notifications...");
    await page.goto("https://www.linkedin.com/notifications/", { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise((r) => setTimeout(r, 6000));

    const notifScreenshot = path.join(OUTPUT_DIR, "linkedin_notifications.png");
    await page.screenshot({ path: notifScreenshot, fullPage: false });
    console.log("📸 Notifications screenshot saved:", notifScreenshot);

    const notifications = await page.evaluate(() => {
      const items = [];
      const cards = Array.from(document.querySelectorAll("article, div[data-finite-scroll-hotkey-item], .notification-card, .nt-card, div.nt-card__headline"));
      for (const card of cards.slice(0, 20)) {
        const text = (card.innerText || "").trim().replace(/\s+/g, " ");
        const linkEl = card.closest("a") || card.querySelector("a");
        const link = linkEl ? linkEl.href : null;
        if (text.length > 5 && !items.some(i => i.text === text)) {
          items.push({ text, link });
        }
      }
      return items;
    });

    console.log(`Found ${notifications.length} notification cards.`);

    // Now go to user's recent posts / activity to get the exact comment details
    console.log("▶ [3/4] Navigating to Recent Posts Activity...");
    await page.goto("https://www.linkedin.com/in/me/recent-activity/all/", { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise((r) => setTimeout(r, 6000));

    // Scroll to load comments
    await page.evaluate(() => window.scrollBy(0, 500));
    await new Promise((r) => setTimeout(r, 3000));

    const activityScreenshot = path.join(OUTPUT_DIR, "linkedin_recent_activity.png");
    await page.screenshot({ path: activityScreenshot });
    console.log("📸 Activity screenshot saved:", activityScreenshot);

    // Extract all posts and comments on the page
    const extractedData = await page.evaluate(() => {
      // Find comment elements
      const comments = [];
      const commentItems = Array.from(document.querySelectorAll(".comments-comment-item, .comments-comments-list__comment-item, article[aria-label*='Comment'], [data-finite-scroll-hotkey-item*='comment'], div.comments-comment-entity"));
      
      for (const el of commentItems) {
        const nameEl = el.querySelector(".comments-post-meta__name-text, a.comments-post-meta__actor-link, a[data-control-name*='actor'], .feed-shared-actor__name");
        const authorName = nameEl ? (nameEl.innerText || "").trim() : "Unknown";
        const authorLink = (nameEl && nameEl.href) ? nameEl.href : (nameEl && nameEl.closest('a') ? nameEl.closest('a').href : "");

        const headlineEl = el.querySelector(".comments-post-meta__headline, .feed-shared-actor__description");
        const headline = headlineEl ? (headlineEl.innerText || "").trim() : "";

        const textEl = el.querySelector(".comments-comment-item__main-content, .update-components-text, .comment-body, span.attributed-text-segment-list__content");
        const commentText = textEl ? (textEl.innerText || "").trim() : "";

        const timeEl = el.querySelector("time, .comments-comment-item__timestamp");
        const time = timeEl ? (timeEl.innerText || "").trim() : "";

        if (commentText.length > 0 || authorName !== "Unknown") {
          comments.push({ authorName, authorLink, headline, commentText, time });
        }
      }

      // Also grab all full feed text
      const feedTexts = Array.from(document.querySelectorAll("div.feed-shared-update-v2, div.feed-shared-update-v2__description-wrapper, div.feed-shared-text")).map(d => (d.innerText || "").slice(0, 1000));

      return {
        comments,
        feedTexts
      };
    });

    const report = {
      timestamp: new Date().toISOString(),
      notifications,
      comments: extractedData.comments,
      feedTexts: extractedData.feedTexts
    };

    const jsonPath = path.join(DATA_DIR, "linkedin_comments_tracker.json");
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    console.log("\n✔ [4/4] Extracted Data Saved to:", jsonPath);
    console.log("Report Summary:", JSON.stringify(report, null, 2));

    return report;
  } catch (err) {
    console.error("❌ Tracking Error:", err.message);
    const errPath = path.join(OUTPUT_DIR, "linkedin_tracker_error.png");
    try {
      const pages = await browser.pages();
      if (pages.length) await pages[0].screenshot({ path: errPath });
      console.log("Error screenshot captured:", errPath);
    } catch (_) {}
    throw err;
  } finally {
    await new Promise((r) => setTimeout(r, 4000));
    await browser.close();
  }
}

trackComments().catch((err) => {
  console.error(err);
  process.exit(1);
});
