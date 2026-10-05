const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function navigateToNameEdit() {
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--window-size=1440,900"] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");

    await page.setCookie(
      { name: "c_user", value: process.env.FB_C_USER.trim(), domain: ".facebook.com", path: "/", secure: true },
      { name: "xs", value: process.env.FB_XS.trim(), domain: ".facebook.com", path: "/", httpOnly: true, secure: true }
    );

    console.log("Navigating to https://accountscenter.facebook.com/profiles ...");
    await page.goto("https://accountscenter.facebook.com/profiles", { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise(r => setTimeout(r, 4000));

    // Find and click on the profile row "Pyaari Pyaara"
    console.log("Clicking profile row...");
    const clicked = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll("div[role='button'], div, span, a"));
      for (const el of elements) {
        if ((el.innerText || "").includes("Pyaari Pyaara")) {
          // Find closest clickable or parent
          let target = el;
          while (target && target.tagName !== "DIV" && target.tagName !== "A" && target.getAttribute("role") !== "button") {
            target = target.parentElement;
          }
          if (target) {
            target.click();
            return true;
          }
        }
      }
      return false;
    });

    console.log("Clicked profile row:", clicked);
    await new Promise(r => setTimeout(r, 4000));

    const currentUrl = page.url();
    console.log("Current URL after click:", currentUrl);

    const screenshotPath = path.join(OUTPUT_DIR, "fb_accounts_center_profile_selected.png");
    await page.screenshot({ path: screenshotPath });
    console.log("Saved screenshot:", screenshotPath);

    // List all text/options on page
    const options = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("span, div[role='button'], a"))
        .map(e => e.innerText ? e.innerText.trim() : "")
        .filter(t => t.length > 0 && t.length < 50);
    });
    console.log("Visible text options on screen:", Array.from(new Set(options)).slice(0, 30));

  } finally {
    await browser.close();
  }
}

navigateToNameEdit().catch(console.error);
