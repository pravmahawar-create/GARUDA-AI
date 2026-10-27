/**
 * Probe notifications DOM to get exact post URL
 */
require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');
const fs = require('fs');

puppeteer.use(StealthPlugin());
const SESSION_DIR = path.resolve(__dirname, '../data/browser-sessions/linkedin');

async function probe() {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: false,
    defaultViewport: null,
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
    await page.goto("https://www.linkedin.com/notifications/", { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise(r => setTimeout(r, 6000));

    // If login
    if (page.url().includes("/login")) {
      console.log("Logging in...");
      await page.goto("https://www.linkedin.com/login", { waitUntil: "domcontentloaded" });
      await new Promise(r => setTimeout(r, 2000));
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
      await new Promise(r => setTimeout(r, 5000));
    }

    const data = await page.evaluate(() => {
      // Find all articles or cards
      const elements = Array.from(document.querySelectorAll("article, [data-finite-scroll-hotkey-item], li.nt-card"));
      const items = [];
      for (const el of elements) {
        const txt = (el.innerText || "").replace(/\s+/g, " ").trim();
        const links = Array.from(el.querySelectorAll("a")).map(a => ({ text: (a.innerText || "").trim(), href: a.href }));
        items.push({ txt: txt.slice(0, 150), links });
      }
      return items;
    });

    console.log("NOTIFICATIONS DUMP:");
    console.log(JSON.stringify(data, null, 2));
    fs.writeFileSync(path.resolve(__dirname, "../data/notifs_dump.json"), JSON.stringify(data, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
}

probe();
