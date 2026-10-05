const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function openNameSettings() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");

    await page.setCookie(
      { name: "c_user", value: process.env.FB_C_USER.trim(), domain: ".facebook.com", path: "/", secure: true },
      { name: "xs", value: process.env.FB_XS.trim(), domain: ".facebook.com", path: "/", httpOnly: true, secure: true }
    );

    console.log("Navigating directly to profile settings modal...");
    await page.goto("https://accountscenter.facebook.com/profiles/100036397273872", { waitUntil: "networkidle2", timeout: 45000 });
    await new Promise(r => setTimeout(r, 4000));

    // Find the element with text "Name"
    const elements = await page.$$("div[role='button'], span, div");
    let nameBox = null;
    for (const el of elements) {
      const text = await page.evaluate(e => (e.innerText || "").trim(), el);
      if (text === "Name") {
        const box = await el.boundingBox();
        if (box && box.width > 0 && box.height > 0) {
          nameBox = box;
          console.log("Found bounding box for 'Name':", nameBox);
          break;
        }
      }
    }

    if (nameBox) {
      const clickX = nameBox.x + nameBox.width / 2;
      const clickY = nameBox.y + nameBox.height / 2;
      console.log(`Clicking mouse at (${clickX}, ${clickY})...`);
      await page.mouse.click(clickX, clickY);
      await new Promise(r => setTimeout(r, 5000));

      const screenshotPath = path.join(OUTPUT_DIR, "fb_name_editor_screen.png");
      await page.screenshot({ path: screenshotPath });
      console.log("Saved screenshot:", screenshotPath);

      // Check current URL and inputs
      console.log("Current URL:", page.url());
      const inputs = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("input")).map(i => ({
          name: i.name,
          value: i.value,
          placeholder: i.placeholder,
          ariaLabel: i.getAttribute("aria-label"),
          className: i.className
        }));
      });
      console.log("Inputs found:", JSON.stringify(inputs, null, 2));

      const pageTexts = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("span, div[role='button'], button, h1, h2, h3"))
          .map(e => (e.innerText || "").trim())
          .filter(t => t.length > 0 && t.length < 50);
      });
      console.log("Unique visible texts:", Array.from(new Set(pageTexts)).slice(0, 30));
    } else {
      console.log("Could not find element with text 'Name'");
    }

  } finally {
    await browser.close();
  }
}

openNameSettings().catch(console.error);
