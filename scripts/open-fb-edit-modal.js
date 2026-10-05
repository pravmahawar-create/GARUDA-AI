const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function openEditProfileModal() {
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

    // Find and click "Edit profile"
    console.log("Finding and clicking 'Edit profile'...");
    const clicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("div[role='button'], button, span"));
      for (const b of btns) {
        if ((b.innerText || "").trim().toLowerCase() === "edit profile") {
          b.scrollIntoView({ behavior: "instant", block: "center" });
          b.click();
          return true;
        }
      }
      return false;
    });

    console.log("Clicked Edit Profile:", clicked);
    await new Promise(r => setTimeout(r, 4000));

    const modalScreenshot = path.join(OUTPUT_DIR, "fb_edit_profile_modal.png");
    await page.screenshot({ path: modalScreenshot });
    console.log("Saved Edit Profile Modal screenshot:", modalScreenshot);

    // List sections in Edit Profile Modal
    const sections = await page.evaluate(() => {
      const dialog = document.querySelector("div[role='dialog']");
      if (!dialog) return ["No dialog found"];
      return Array.from(dialog.querySelectorAll("span, div[role='button'], h2, h3, a"))
        .map(e => (e.innerText || "").trim())
        .filter(t => t.length > 0 && t.length < 50);
    });

    console.log("Sections in Modal:", Array.from(new Set(sections)).slice(0, 30));

  } finally {
    await browser.close();
  }
}

openEditProfileModal().catch(console.error);
