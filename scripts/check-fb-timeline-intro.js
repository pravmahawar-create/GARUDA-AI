const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function checkTimelineIntro() {
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

    // Click "All" tab
    console.log("Clicking 'All' tab...");
    const clickedAll = await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll("a, div[role='tab']"));
      for (const t of tabs) {
        if ((t.innerText || "").trim() === "All") {
          t.click();
          return true;
        }
      }
      return false;
    });
    console.log("Clicked All tab?", clickedAll);
    await new Promise(r => setTimeout(r, 3000));

    // Scroll down 400px to see Intro card
    await page.evaluate(() => window.scrollBy(0, 450));
    await new Promise(r => setTimeout(r, 2000));

    const shotPath = path.join(OUTPUT_DIR, "fb_timeline_intro_view.png");
    await page.screenshot({ path: shotPath });
    console.log("Saved timeline intro screenshot:", shotPath);

    // Find all buttons on screen
    const btns = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("div[role='button'], button, a"))
        .map(b => (b.innerText || "").trim())
        .filter(t => t.length > 0 && t.length < 40);
    });
    console.log("Buttons on timeline:", Array.from(new Set(btns)).slice(0, 35));

  } finally {
    await browser.close();
  }
}

checkTimelineIntro().catch(console.error);
