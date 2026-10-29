const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const SESSION_DIR = path.resolve(__dirname, "../data/browser-sessions/linkedin");
const EMAIL = process.env.LINKEDIN_EMAIL || "garudaos.ai@gmail.com";
const PASS = process.env.LINKEDIN_PASS || "Ayeshapm1@";

async function getLink() {
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
    const page = (await browser.pages())[0];
    await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded" });
    await new Promise((r) => setTimeout(r, 4000));

    if (page.url().includes("/login") || page.url().includes("/uas/login")) {
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
        const submitBtn = btns.find((b) => (b.innerText || "").trim() === "Sign in");
        if (submitBtn) submitBtn.click();
      });
      await new Promise((r) => setTimeout(r, 8000));
    }

    console.log("Navigating to People search...");
    await page.goto("https://www.linkedin.com/search/results/people/?keywords=Rohit%20Kohli&origin=GLOBAL_SEARCH_HEADER", { waitUntil: "domcontentloaded" });
    await new Promise((r) => setTimeout(r, 6000));

    const result = await page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      const found = [];
      while ((node = walker.nextNode())) {
        if (node.nodeValue && node.nodeValue.includes("Rohit Kohli")) {
          let el = node.parentElement;
          let aTag = null;
          while (el && el !== document.body) {
            if (el.tagName.toLowerCase() === "a") {
              aTag = el.href;
              break;
            }
            el = el.parentElement;
          }
          found.push({ text: node.nodeValue.trim(), href: aTag });
        }
      }
      return found;
    });

    console.log("TreeWalker matches:", JSON.stringify(result, null, 2));

    // Also get all hrefs on the page
    const allLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("a"))
        .map((a) => a.href)
        .filter((h) => h.includes("/in/"));
    });
    console.log("All /in/ links:", JSON.stringify(allLinks, null, 2));
  } finally {
    await browser.close();
  }
}

getLink().catch(console.error);
