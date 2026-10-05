const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");
const DP_PATH = path.join(__dirname, "..", "public", "garuda-sigil.png");

async function uploadFacebookDP() {
  const cUser = process.env.FB_C_USER;
  const xs = process.env.FB_XS;

  console.log(`🦅 [GARUDA FB DP UPLOAD] Uploading master sigil: ${DP_PATH}`);
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

    console.log("▶ Clicking 'Profile picture actions'...");
    await page.evaluate(() => {
      const el = document.querySelector("div[aria-label*='Profile picture actions' i]");
      if (el) el.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    console.log("▶ Clicking 'Choose profile picture'...");
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll("div[role='menuitem'], span"));
      for (const item of items) {
        if (item.innerText && item.innerText.includes("Choose profile picture")) {
          item.click();
          break;
        }
      }
    });

    console.log("▶ Waiting for Choose Profile Picture modal...");
    await new Promise(r => setTimeout(r, 4000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, "fb_choose_dp_modal.png") });
    console.log("Saved choose modal screenshot: output/fb_choose_dp_modal.png");

    console.log("▶ Looking for 'Upload photo' button in modal...");
    const [fileChooser] = await Promise.all([
      page.waitForFileChooser({ timeout: 15000 }),
      page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("div[role='dialog'] div[role='button'], div[role='dialog'] span"));
        for (const b of btns) {
          if (b.innerText && b.innerText.includes("Upload photo")) {
            b.click();
            break;
          }
        }
      })
    ]);

    console.log("▶ File chooser triggered! Passing GARUDA Sigil file...");
    await fileChooser.accept([DP_PATH]);

    console.log("▶ File accepted! Waiting 8s for crop dialog...");
    await new Promise(r => setTimeout(r, 8000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, "fb_dp_crop_modal.png") });
    console.log("✔ Saved crop modal screenshot: output/fb_dp_crop_modal.png");

    // Click Save button
    console.log("▶ Clicking Save button...");
    const saveClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("div[role='dialog'] div[role='button'], div[role='dialog'] button"));
      for (const b of btns) {
        if (b.innerText && b.innerText.trim() === "Save") {
          b.click();
          return true;
        }
      }
      return false;
    });

    console.log("▶ Clicked Save?", saveClicked);
    await new Promise(r => setTimeout(r, 8000));

    const finalPath = path.join(OUTPUT_DIR, "fb_dp_final_proof.png");
    await page.screenshot({ path: finalPath });
    console.log("✔ Saved final DP proof screenshot:", finalPath);

  } finally {
    await browser.close();
  }
}

uploadFacebookDP().catch(err => {
  console.error("❌ DP Upload Error:", err.message);
  process.exit(1);
});
