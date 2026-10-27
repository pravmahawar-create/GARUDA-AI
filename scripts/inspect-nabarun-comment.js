/**
 * 🦅 GARUDA LINKEDIN COMMENT FORENSIC EXTRACTOR
 * Clicks the notification from Nabarun Mondal, extracts the comment thread, and inspects his profile.
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

async function inspectComment() {
  console.log("==========================================================================");
  console.log("🦅 GARUDA COMMENT & LEAD INTELLIGENCE: NABARUN MONDAL");
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

    console.log("▶ [1/5] Checking LinkedIn session status...");
    await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise((r) => setTimeout(r, 4000));

    let currentUrl = page.url();
    console.log("Initial URL:", currentUrl);

    if (currentUrl.includes("/login") || currentUrl.includes("/uas/login") || currentUrl.includes("checkpoint")) {
      console.log("Authenticating via React-safe credential injection...");
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

    console.log("▶ [2/5] Navigating to Notifications...");
    await page.goto("https://www.linkedin.com/notifications/", { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise((r) => setTimeout(r, 5000));

    console.log("▶ [3/5] Locating and clicking Nabarun Mondal notification...");
    // Find coordinates or link of Nabarun Mondal's notification
    const clickCoords = await page.evaluate(() => {
      const allEls = Array.from(document.querySelectorAll("article, div.nt-card, div.notification-card, a.nt-card__headline, div"));
      for (const el of allEls) {
        const txt = el.innerText || "";
        if (txt.includes("Nabarun Mondal") && (txt.includes("commented on your post") || txt.includes("boundaries"))) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 20 && rect.height > 20 && rect.top >= 0) {
            return {
              x: rect.left + rect.width / 2,
              y: rect.top + Math.min(rect.height / 2, 50),
              text: txt.slice(0, 200)
            };
          }
        }
      }
      return null;
    });

    console.log("Notification Target Coords:", JSON.stringify(clickCoords));

    if (clickCoords) {
      console.log(`Clicking notification at (${clickCoords.x}, ${clickCoords.y})...`);
      await page.mouse.click(clickCoords.x, clickCoords.y);
      await new Promise((r) => setTimeout(r, 7000));
    } else {
      console.log("Falling back to clicking any link containing Nabarun...");
      await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll("a"));
        const target = links.find(a => (a.innerText || "").includes("Nabarun"));
        if (target) target.click();
      });
      await new Promise((r) => setTimeout(r, 7000));
    }

    const currentPostUrl = page.url();
    console.log("Active Post Thread URL:", currentPostUrl);

    // Capture thread screenshot
    const threadScreenshot = path.join(OUTPUT_DIR, "nabarun_comment_thread.png");
    await page.screenshot({ path: threadScreenshot, fullPage: false });
    console.log("📸 Comment thread screenshot saved:", threadScreenshot);

    // Extract comment details
    const commentDetails = await page.evaluate(() => {
      // Find comment author link
      const links = Array.from(document.querySelectorAll("a[href*='/in/']"));
      const authorLink = links.find(l => (l.innerText || "").includes("Nabarun") || (l.href || "").includes("nabarun"));

      return {
        url: window.location.href,
        pageTitle: document.title,
        bodySnippet: document.body.innerText.slice(0, 3000),
        authorHref: authorLink ? authorLink.href : null,
        authorText: authorLink ? authorLink.innerText.trim() : null
      };
    });

    console.log("Comment Thread Summary:", JSON.stringify({
      url: commentDetails.url,
      pageTitle: commentDetails.pageTitle,
      authorHref: commentDetails.authorHref,
      authorText: commentDetails.authorText
    }, null, 2));

    // Now navigate to Nabarun Mondal's profile if link found, or direct search
    let targetProfileUrl = commentDetails.authorHref;
    if (!targetProfileUrl) {
      console.log("Searching for Nabarun's profile via direct search or known URL...");
      // In notification image, author is "Nabarun Mondal"
      targetProfileUrl = "https://www.linkedin.com/search/results/all/?keywords=Nabarun%20Mondal";
    }

    console.log(`\n▶ [4/5] Navigating to Profile/Search: ${targetProfileUrl}...`);
    await page.goto(targetProfileUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise((r) => setTimeout(r, 6000));

    // If this is a search result, click the first top result
    if (page.url().includes("/search/")) {
      const topResultHref = await page.evaluate(() => {
        const link = document.querySelector(".search-results-container a[href*='/in/'], div.entity-result__title a[href*='/in/']");
        return link ? link.href : null;
      });
      if (topResultHref) {
        console.log("Opening top search result profile:", topResultHref);
        await page.goto(topResultHref, { waitUntil: "domcontentloaded", timeout: 45000 });
        await new Promise((r) => setTimeout(r, 6000));
      }
    }

    const profileScreenshot = path.join(OUTPUT_DIR, "nabarun_profile.png");
    await page.screenshot({ path: profileScreenshot, fullPage: false });
    console.log("📸 Profile screenshot saved:", profileScreenshot);

    const profileData = await page.evaluate(() => {
      const name = document.querySelector("h1") ? document.querySelector("h1").innerText.trim() : "Nabarun Mondal";
      const headline = document.querySelector(".text-body-medium") ? document.querySelector(".text-body-medium").innerText.trim() : "";
      const location = document.querySelector(".text-body-small.inline.t-black--light.break-words") ? document.querySelector(".text-body-small.inline.t-black--light.break-words").innerText.trim() : "";
      const about = document.querySelector("#about ~ div") ? document.querySelector("#about ~ div").innerText.slice(0, 500).trim() : "";

      return {
        url: window.location.href,
        name,
        headline,
        location,
        about
      };
    });

    console.log("\nProfile Intelligence Extracted:", JSON.stringify(profileData, null, 2));

    const finalReport = {
      timestamp: new Date().toISOString(),
      lead: profileData,
      comment: {
        notificationText: clickCoords ? clickCoords.text : "Nabarun Mondal commented on your post",
        postUrl: currentPostUrl,
        bodySnippet: commentDetails.bodySnippet
      },
      screenshots: {
        thread: threadScreenshot,
        profile: profileScreenshot
      }
    };

    const finalJsonPath = path.join(DATA_DIR, "nabarun_lead_intelligence.json");
    fs.writeFileSync(finalJsonPath, JSON.stringify(finalReport, null, 2));
    console.log("\n✔ [5/5] Lead Intelligence Saved:", finalJsonPath);

    return finalReport;
  } catch (err) {
    console.error("❌ Forensic Error:", err.message);
    const errPath = path.join(OUTPUT_DIR, "nabarun_forensic_error.png");
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

inspectComment().catch((err) => {
  console.error(err);
  process.exit(1);
});
