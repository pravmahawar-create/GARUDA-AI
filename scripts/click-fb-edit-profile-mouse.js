const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function clickEditProfileWithMouse() {
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

    console.log("Navigating to https://www.facebook.com/me ...");
    await page.goto("https://www.facebook.com/me", { waitUntil: "networkidle2", timeout: 45000 });
    await new Promise(r => setTimeout(r, 4000));

    // Scroll to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 1000));

    // Find bounding box of Edit profile
    const elements = await page.$$("div[role='button'], button, a");
    let editBox = null;
    for (const el of elements) {
      const text = await page.evaluate(e => (e.innerText || "").trim(), el);
      if (text === "Edit profile") {
        const box = await el.boundingBox();
        if (box && box.width > 0 && box.height > 0) {
          editBox = box;
          console.log("Found Edit Profile bounding box:", editBox);
          break;
        }
      }
    }

    if (editBox) {
      const clickX = editBox.x + editBox.width / 2;
      const clickY = editBox.y + editBox.height / 2;
      console.log(`Clicking mouse at (${clickX}, ${clickY})...`);
      await page.mouse.click(clickX, clickY);
      await new Promise(r => setTimeout(r, 5000));

      const shotPath = path.join(OUTPUT_DIR, "fb_edit_profile_dialog_opened.png");
      await page.screenshot({ path: shotPath });
      console.log("Saved screenshot:", shotPath);

      // Inspect dialog contents
      const dialogTexts = await page.evaluate(() => {
        const dialog = document.querySelector("div[role='dialog']");
        if (!dialog) return ["No dialog found"];
        return Array.from(dialog.querySelectorAll("span, div[role='button'], h2, h3, a, button"))
          .map(e => (e.innerText || "").trim())
          .filter(t => t.length > 0 && t.length < 50);
      });
      console.log("Dialog texts:", Array.from(new Set(dialogTexts)).slice(0, 30));
    } else {
      console.log("Could not find Edit profile button bounding box.");
    }

  } finally {
    await browser.close();
  }
}

clickEditProfileWithMouse().catch(console.error);
