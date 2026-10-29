const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const path = require("path");
const fs = require("fs");

const SESSION_DIR = path.resolve(__dirname, "../data/browser-sessions/linkedin");
const OUTPUT_DIR = path.resolve(__dirname, "../output");

async function findRohit() {
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

    console.log("Navigating to People search for Rohit Kohli CTO...");
    await page.goto("https://www.linkedin.com/search/results/people/?keywords=Rohit%20Kohli%20CTO", { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise((r) => setTimeout(r, 5000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, "rohit_people_search.png") });

    const people = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll(".reusable-search__result-container, .search-results-container li"));
      return items.slice(0, 5).map((el) => {
        const titleLink = el.querySelector("a.app-aware-link, a[href*='/in/']");
        const name = (titleLink ? titleLink.innerText : "").trim();
        const href = titleLink ? titleLink.href : "";
        const desc = (el.innerText || "").trim().replace(/\n+/g, " | ");
        return { name, href, desc: desc.substring(0, 200) };
      });
    });

    console.log("Found People:", JSON.stringify(people, null, 2));
  } finally {
    await browser.close();
  }
}

findRohit().catch(console.error);
