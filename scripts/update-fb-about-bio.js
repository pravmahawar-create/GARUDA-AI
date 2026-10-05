const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function updateFacebookBio() {
  console.log("🦅 [GARUDA FB BIO UPDATER] Starting Bio injection on Facebook...");
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

    console.log("1. Navigating to https://www.facebook.com/me/about ...");
    await page.goto("https://www.facebook.com/me/about", { waitUntil: "networkidle2", timeout: 45000 });
    await new Promise(r => setTimeout(r, 4000));

    // Find and click "About you" or "Add a bio"
    console.log("2. Clicking 'About you' row to open Bio textarea...");
    const clickedAboutYou = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll("div[role='button'], span, div"));
      for (const el of elements) {
        const txt = (el.innerText || "").trim();
        if (txt === "About you" || txt.includes("About you")) {
          let btn = el;
          while (btn && btn.getAttribute("role") !== "button" && btn.parentElement) {
            btn = btn.parentElement;
          }
          if (btn) {
            btn.click();
            return true;
          }
          el.click();
          return true;
        }
      }
      return false;
    });

    console.log("Clicked 'About you'?", clickedAboutYou);
    await new Promise(r => setTimeout(r, 3000));

    // Check for textarea
    const textarea = await page.$("textarea");
    if (textarea) {
      console.log("3. Found Bio textarea! Typing founder bio...");
      await textarea.click();
      await page.keyboard.down("Control");
      await page.keyboard.press("A");
      await page.keyboard.up("Control");
      await page.keyboard.press("Backspace");

      const bioText = "Founder & Chief Architect @ GARUDA OS | India's Sovereign AI Operating System. Building autonomous multi-agent software & rapid MVPs. https://www.garudaos.in";
      await page.keyboard.type(bioText, { delay: 20 });
      await new Promise(r => setTimeout(r, 1500));

      const typedScreenshot = path.join(OUTPUT_DIR, "fb_bio_typed.png");
      await page.screenshot({ path: typedScreenshot });
      console.log("Saved typed bio screenshot:", typedScreenshot);

      // Click Save button
      console.log("4. Finding and clicking Save button...");
      const saved = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("div[role='button'], button"));
        for (const b of btns) {
          const txt = (b.innerText || "").trim();
          if (txt === "Save" && !b.disabled && b.getAttribute("aria-disabled") !== "true") {
            b.click();
            return true;
          }
        }
        return false;
      });

      console.log("Clicked Save button?", saved);
      await new Promise(r => setTimeout(r, 6000));

      const savedScreenshot = path.join(OUTPUT_DIR, "fb_bio_saved_proof.png");
      await page.screenshot({ path: savedScreenshot });
      console.log("Saved bio confirmation screenshot:", savedScreenshot);
    } else {
      console.log("Textarea not found after clicking 'About you'. Taking debug screenshot...");
      const debugScreenshot = path.join(OUTPUT_DIR, "fb_bio_debug_no_textarea.png");
      await page.screenshot({ path: debugScreenshot });
    }

  } finally {
    await browser.close();
  }
}

updateFacebookBio().catch(console.error);
