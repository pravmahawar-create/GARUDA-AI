const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const liAt = "AQEDAW1NST8CkpiwAAABoOiLevsAAAGhDJf--1YASUnkDapKj8ZYiC_WlHRhAcFV_SWRGKSsKaV2Mf_F667OnxJrtX_dqdaHpMmf1mi31Ae1iwQdNoNZxylxCegtqeX6TLNFRkhiJr_5kmLUr8-36htb";
const jsessionId = '"ajax:8912913176490188972"';

async function run() {
  console.log("Launching real Chrome 153 binary with stealth...");
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--window-size=1280,900"
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.8010.53 Safari/537.36");

    await page.setCookie(
      { name: "li_at", value: liAt, domain: ".linkedin.com", path: "/" },
      { name: "JSESSIONID", value: jsessionId, domain: ".linkedin.com", path: "/" }
    );

    console.log("Navigating to https://www.linkedin.com/feed/...");
    const res = await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded", timeout: 35000 });
    console.log("Status:", res ? res.status() : "null", "URL:", page.url());
    console.log("Title:", await page.title());

    await page.screenshot({ path: path.resolve(__dirname, "../output/billing/v4_1/real_chrome_feed.png") });
    console.log("Screenshot saved: output/billing/v4_1/real_chrome_feed.png");

    if (page.url().includes("/feed")) {
      console.log("✔ FEED ACCESS SUCCESSFUL!");

      // Now navigate to Company setup page to create the page autonomously!
      console.log("\n▶ Navigating to LinkedIn Company Page Setup...");
      await page.goto("https://www.linkedin.com/company/setup/new/", { waitUntil: "domcontentloaded", timeout: 35000 });
      await new Promise(r => setTimeout(r, 4000));
      console.log("Company Setup URL:", page.url());
      await page.screenshot({ path: path.resolve(__dirname, "../output/billing/v4_1/company_setup_page.png") });
    }
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await browser.close();
  }
}

run();
