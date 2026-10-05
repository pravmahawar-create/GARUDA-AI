const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

async function clickProfileRow() {
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--window-size=1440,900"] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");

    await page.setCookie(
      { name: "c_user", value: process.env.FB_C_USER.trim(), domain: ".facebook.com", path: "/", secure: true },
      { name: "xs", value: process.env.FB_XS.trim(), domain: ".facebook.com", path: "/", httpOnly: true, secure: true }
    );

    console.log("Navigating to Accounts Center profiles...");
    await page.goto("https://accountscenter.facebook.com/profiles", { waitUntil: "networkidle2", timeout: 45000 });
    await new Promise(r => setTimeout(r, 3000));

    const allElements = await page.$$("div[role='button'], div, span");
    let targetBox = null;
    for (const h of allElements) {
      const text = await page.evaluate(el => el.innerText, h);
      if (text && text.includes("Pyaari Pyaara") && text.length < 50) {
        targetBox = await h.boundingBox();
        console.log("Found bounding box for Pyaari Pyaara:", targetBox, "Text:", text);
        break;
      }
    }

    if (targetBox) {
      const clickX = targetBox.x + targetBox.width / 2;
      const clickY = targetBox.y + targetBox.height / 2;
      console.log(`Clicking mouse at (${clickX}, ${clickY})...`);
      await page.mouse.click(clickX, clickY);
      await new Promise(r => setTimeout(r, 5000));

      console.log("Current URL after click:", page.url());
      const screenshotPath = path.join(__dirname, "..", "output", "fb_after_click_profile.png");
      await page.screenshot({ path: screenshotPath });
      console.log("Saved screenshot:", screenshotPath);

      // Print all visible texts
      const visibleTexts = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("span, h1, h2, h3, div[role='button']"))
          .map(e => (e.innerText || "").trim())
          .filter(t => t.length > 0 && t.length < 60);
      });
      console.log("Visible texts:", Array.from(new Set(visibleTexts)).slice(0, 35));
    } else {
      console.log("Could not find span with text 'Pyaari Pyaara'");
    }
  } finally {
    await browser.close();
  }
}

clickProfileRow().catch(console.error);
