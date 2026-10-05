const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function updateFacebookBioAndLinks() {
  const cUser = process.env.FB_C_USER;
  const xs = process.env.FB_XS;

  console.log("🦅 [GARUDA FB BIO UPDATE] Updating Bio and Links on Facebook...");
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

    // Look for "Add bio" or "Edit bio" button
    console.log("▶ Finding 'Add bio' or 'Edit bio' button...");
    const clickedBio = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("div[role='button'], span"));
      for (const b of btns) {
        const txt = (b.innerText || "").trim().toLowerCase();
        if (txt === "add bio" || txt === "edit bio" || txt.includes("bio")) {
          b.scrollIntoView({ behavior: "instant", block: "center" });
          b.click();
          return true;
        }
      }
      return false;
    });

    console.log("▶ Clicked Bio button?", clickedBio);
    await new Promise(r => setTimeout(r, 2500));

    // Look for textarea for Bio
    const bioTextarea = await page.$("textarea");
    if (bioTextarea) {
      console.log("▶ Found Bio textarea! Injecting founder bio...");
      await bioTextarea.click({ clickCount: 3 });
      await page.keyboard.press("Backspace");

      const bioContent = "Founder @ GARUDA OS | India's Sovereign AI Operating System. Building autonomous multi-agent software & rapid MVPs. https://www.garudaos.in";
      await page.keyboard.type(bioContent, { delay: 15 });
      await new Promise(r => setTimeout(r, 1500));

      // Click "Save" button for Bio
      console.log("▶ Clicking Save button for Bio...");
      const savedBio = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("div[role='button'], button"));
        for (const b of btns) {
          if ((b.innerText || "").trim() === "Save" && !b.disabled) {
            b.click();
            return true;
          }
        }
        return false;
      });
      console.log("▶ Saved Bio?", savedBio);
      await new Promise(r => setTimeout(r, 6000));
    } else {
      console.log("⚠ Bio textarea not found, taking screenshot for debug...");
    }

    const proofPath = path.join(OUTPUT_DIR, "fb_profile_masterpiece_clean.png");
    await page.screenshot({ path: proofPath });
    console.log("✔ Saved Masterpiece Clean Screenshot:", proofPath);

  } finally {
    await browser.close();
  }
}

updateFacebookBioAndLinks().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
