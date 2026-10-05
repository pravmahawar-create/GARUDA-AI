const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function checkNameChange() {
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--window-size=1440,900"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");

  await page.setCookie(
    { name: "c_user", value: process.env.FB_C_USER.trim(), domain: ".facebook.com", path: "/", secure: true },
    { name: "xs", value: process.env.FB_XS.trim(), domain: ".facebook.com", path: "/", httpOnly: true, secure: true }
  );

  console.log("Navigating to Facebook Accounts Center Name Settings...");
  await page.goto("https://accountscenter.facebook.com/profiles", { waitUntil: "domcontentloaded", timeout: 45000 });
  await new Promise(r => setTimeout(r, 6000));

  const currentUrl = page.url();
  console.log("Accounts Center URL:", currentUrl);

  const screenshotPath = path.join(OUTPUT_DIR, "fb_accounts_center_profiles.png");
  await page.screenshot({ path: screenshotPath });
  console.log("Saved Accounts Center screenshot:", screenshotPath);

  await browser.close();
}

checkNameChange().catch(console.error);
