/**
 * Open exact post via direct notification click
 */
require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');
const fs = require('fs');

puppeteer.use(StealthPlugin());
const SESSION_DIR = path.resolve(__dirname, '../data/browser-sessions/linkedin');
const OUTPUT_DIR = path.resolve(__dirname, '../output');

async function openPost() {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      `--user-data-dir=${SESSION_DIR}`
    ]
  });

  try {
    const pages = await browser.pages();
    const page = pages[0] || (await browser.newPage());
    await page.setViewport({ width: 1920, height: 1080 });

    console.log("Navigating to Notifications...");
    await page.goto("https://www.linkedin.com/notifications/", { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise(r => setTimeout(r, 6000));

    if (page.url().includes("/login")) {
      console.log("Logging in...");
      await page.goto("https://www.linkedin.com/login", { waitUntil: "domcontentloaded" });
      await new Promise(r => setTimeout(r, 3000));
      await page.evaluate((em, pw) => {
        const emailEl = document.querySelector('input[name="session_key"], input#username, input[type="email"]');
        const passEl = document.querySelector('input[name="session_password"], input#password, input[type="password"]');
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        setter.call(emailEl, em);
        emailEl.dispatchEvent(new Event("input", { bubbles: true }));
        setter.call(passEl, pw);
        passEl.dispatchEvent(new Event("input", { bubbles: true }));
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

    console.log("Current page on notifications:", page.url());
    await page.screenshot({ path: path.join(OUTPUT_DIR, "notif_check_before_click.png") });

    // Click on the post preview inside Nabarun's notification card (X: 550, Y: 430)
    console.log("Clicking post card inside notification at (550, 430)...");
    await page.mouse.click(550, 430);
    await new Promise(r => setTimeout(r, 7000));

    const openedUrl = page.url();
    console.log("Opened URL after click:", openedUrl);

    const postScreenshot = path.join(OUTPUT_DIR, "nabarun_post_opened.png");
    await page.screenshot({ path: postScreenshot });
    console.log("📸 Post opened screenshot saved:", postScreenshot);

    // Now look for Reply button or comment input
    const postInfo = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        bodySnippet: document.body.innerText.slice(0, 2000)
      };
    });

    console.log("Post Info:", JSON.stringify(postInfo, null, 2));
    fs.writeFileSync(path.join(OUTPUT_DIR, "nabarun_opened_post_data.json"), JSON.stringify(postInfo, null, 2));

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await browser.close();
  }
}

openPost();
