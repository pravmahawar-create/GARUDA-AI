const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function testCoverPhotoFlow() {
  const cUser = process.env.FB_C_USER;
  const xs = process.env.FB_XS;

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");

    await page.setCookie(
      { name: "c_user", value: cUser.trim(), domain: ".facebook.com", path: "/", secure: true },
      { name: "xs", value: xs.trim(), domain: ".facebook.com", path: "/", httpOnly: true, secure: true }
    );

    await page.goto("https://www.facebook.com/me", { waitUntil: "domcontentloaded", timeout: 60000 });
    await new Promise(r => setTimeout(r, 6000));

    console.log("▶ Clicking 'Add cover photo' button...");
    const clickedCover = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("div[role='button'], button, span"));
      for (const b of btns) {
        if (b.innerText && b.innerText.includes("Add cover photo")) {
          b.click();
          return true;
        }
      }
      return false;
    });

    console.log("▶ Clicked 'Add cover photo'?", clickedCover);
    await new Promise(r => setTimeout(r, 2500));

    await page.screenshot({ path: path.join(OUTPUT_DIR, "fb_cover_menu_open.png") });
    console.log("Saved screenshot: output/fb_cover_menu_open.png");

    // Look for "Upload photo" option in the dropdown/menu
    const menuOptions = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll("div[role='menuitem'], div[role='button'], span"));
      return items.map(i => i.innerText?.trim()).filter(t => t && (t.includes("Upload") || t.includes("Select") || t.includes("Create")));
    });

    console.log("Cover Menu Options:", menuOptions);

    // Also check DP (profile picture) trigger
    console.log("▶ Inspecting Profile Picture (DP) camera trigger...");
    const dpInfo = await page.evaluate(() => {
      const dpButtons = Array.from(document.querySelectorAll("div[role='button'], svg, div[aria-label*='profile' i], div[aria-label*='picture' i]")).map(el => ({
        ariaLabel: el.getAttribute("aria-label"),
        text: el.innerText?.trim()
      })).filter(x => x.ariaLabel || x.text);
      return dpButtons.slice(0, 15);
    });

    console.log("DP Triggers:", JSON.stringify(dpInfo, null, 2));

  } finally {
    await browser.close();
  }
}

testCoverPhotoFlow().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
