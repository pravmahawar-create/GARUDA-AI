const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const BASE_DIR = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(BASE_DIR, "output");

async function checkLikes() {
  const cookieVal = process.env.LINKEDIN_LI_AT;
  if (!cookieVal) throw new Error("Missing LINKEDIN_LI_AT in .env");

  console.log("🚀 [GARUDA RADAR] Launching browser to check latest post reactions...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,1000"]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1000 });
    await page.setCookie({
      name: "li_at",
      value: cookieVal,
      domain: ".linkedin.com",
      path: "/",
      httpOnly: true,
      secure: true
    });

    // 1. Check Notifications Page
    console.log("▶ [1/3] Checking Notifications page...");
    await page.goto("https://www.linkedin.com/notifications/", { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, "linkedin_notifications_latest.png") });

    const notifications = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll("article, .nt-card, .notification-card, .nt-card-wrapper"));
      return cards.slice(0, 8).map(c => (c.innerText || "").replace(/\n+/g, " | ").trim()).filter(Boolean);
    });
    console.log("Latest Notifications:", JSON.stringify(notifications, null, 2));

    // 2. Check Profile Recent Activity
    console.log("▶ [2/3] Checking Recent Activity page...");
    await page.goto("https://www.linkedin.com/in/garuda-ai-ai-operating-system-227168432/recent-activity/all/", { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise(r => setTimeout(r, 5000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, "linkedin_recent_activity_live.png") });

    // Look for reactions count
    const postDetails = await page.evaluate(() => {
      const allText = Array.from(document.querySelectorAll("*")).filter(e => {
        const t = (e.textContent || "").trim();
        return t.includes("reaction") || t.includes("like") || /^\d+\s+(reaction|like|impression)/i.test(t);
      }).map(e => (e.innerText || "").trim()).slice(0, 10);
      return allText;
    });
    console.log("Reaction text snippets found:", postDetails);

    // Try to find and click the reaction button / counter
    const reactionBtn = await page.$(".social-details-social-counts__reactions-count, button[aria-label*='reaction'], .reactions-count, .social-details-social-counts__item--right-aligned");
    if (reactionBtn) {
      console.log("▶ [3/3] Clicking reactions counter...");
      await reactionBtn.click();
      await new Promise(r => setTimeout(r, 3500));
      await page.screenshot({ path: path.join(OUTPUT_DIR, "linkedin_reactors_modal.png") });

      const reactors = await page.evaluate(() => {
        const modal = document.querySelector(".artdeco-modal, div[role='dialog']");
        if (!modal) return [];
        const items = Array.from(modal.querySelectorAll("li, .artdeco-entity-lockup"));
        return items.map(el => {
          const name = el.querySelector(".artdeco-entity-lockup__title, span[dir='ltr']")?.innerText || "";
          const subtitle = el.querySelector(".artdeco-entity-lockup__subtitle, .artdeco-entity-lockup__caption")?.innerText || "";
          return { name: name.trim(), subtitle: subtitle.trim() };
        }).filter(r => r.name);
      });
      console.log("Reactors extracted:", JSON.stringify(reactors, null, 2));
    } else {
      console.log("ℹ Reactions count button not directly clickable, check screenshots.");
    }

  } finally {
    await browser.close();
  }
}

checkLikes().catch(err => {
  console.error("❌ Error in checkLikes:", err);
  process.exit(1);
});
