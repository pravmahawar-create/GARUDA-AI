/**
 * Extract exact post link using vanilla document.links
 */
require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');
const fs = require('fs');
puppeteer.use(StealthPlugin());

const SESSION_DIR = path.resolve(__dirname, '../data/browser-sessions/linkedin');

async function getLink() {
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
      await new Promise(r => setTimeout(r, 2000));
      await page.evaluate((em, pw) => {
        const e = document.querySelector('input[name="session_key"], input#username');
        const p = document.querySelector('input[name="session_password"], input#password');
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        setter.call(e, em); e.dispatchEvent(new Event("input", { bubbles: true }));
        setter.call(p, pw); p.dispatchEvent(new Event("input", { bubbles: true }));
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

    const links = await page.evaluate(() => {
      const out = [];
      for (let i = 0; i < document.links.length; i++) {
        const l = document.links[i];
        const t = (l.innerText || "").replace(/\s+/g, " ").trim();
        out.push({ href: l.href, text: t });
      }
      return out;
    });

    console.log(`Extracted ${links.length} total links.`);
    const interesting = links.filter(l => 
      l.text.includes("Nabarun") || 
      l.text.includes("boundaries") || 
      l.text.includes("Devin") || 
      l.href.includes("activity") || 
      l.href.includes("feed/update")
    );

    console.log("INTERESTING LINKS:", JSON.stringify(interesting, null, 2));
    fs.writeFileSync(path.resolve(__dirname, "../data/notif_links.json"), JSON.stringify(interesting, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
}

getLink();
