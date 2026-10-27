/**
 * 🦅 EXTRACT EXACT NABARUN COMMENT THREAD
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

async function getExactComment() {
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

    console.log("Navigating to notifications...");
    await page.goto("https://www.linkedin.com/notifications/", { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise(r => setTimeout(r, 6000));

    // Extract exact link from notification
    const targetHref = await page.evaluate(() => {
      const allA = Array.from(document.querySelectorAll("a"));
      for (const a of allA) {
        if ((a.innerText || "").includes("Nabarun Mondal")) {
          return a.href;
        }
      }
      return null;
    });

    console.log("Found Target Notification Href:", targetHref);

    if (targetHref) {
      console.log("Navigating directly to post thread...");
      await page.goto(targetHref, { waitUntil: "domcontentloaded", timeout: 45000 });
      await new Promise(r => setTimeout(r, 6000));

      await page.evaluate(() => window.scrollBy(0, 300));
      await new Promise(r => setTimeout(r, 2000));

      const screenshotPath = path.join(OUTPUT_DIR, "nabarun_exact_post_comment.png");
      await page.screenshot({ path: screenshotPath });
      console.log("📸 Screenshot saved:", screenshotPath);

      // Extract all comments text
      const fullPostData = await page.evaluate(() => {
        const comments = Array.from(document.querySelectorAll("article[aria-label*='Comment'], .comments-comment-item, div.feed-shared-update-v2")).map(el => (el.innerText || "").trim());
        return {
          title: document.title,
          url: window.location.href,
          bodySnippet: document.body.innerText.slice(0, 4000),
          comments
        };
      });

      fs.writeFileSync(path.join(DATA_DIR, "nabarun_exact_comment.json"), JSON.stringify(fullPostData, null, 2));
      console.log("✔ Exact comment data saved.");
    }
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
}

getExactComment();
