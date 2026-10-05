const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function inspectPhotoInputs() {
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

    // Look for Cover Photo button and file inputs
    const photoDetails = await page.evaluate(() => {
      const coverBtn = Array.from(document.querySelectorAll("div[role='button'], button, span")).find(b => (b.textContent || "").includes("Add cover photo") || (b.textContent || "").includes("Edit cover photo"));
      const fileInputs = Array.from(document.querySelectorAll("input[type='file']")).map(i => ({
        id: i.id,
        accept: i.accept,
        name: i.name
      }));
      return {
        hasCoverBtn: Boolean(coverBtn),
        coverBtnText: coverBtn ? coverBtn.innerText.trim() : null,
        fileInputs
      };
    });

    console.log("Photo Upload Details:", JSON.stringify(photoDetails, null, 2));

    // Also check "Edit profile" button click
    console.log("Clicking Edit profile button...");
    const editBtn = await page.$("div[aria-label='Edit profile'], div[role='button']:has-text('Edit profile')");
    
    const clicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("div[role='button']"));
      const btn = btns.find(b => b.innerText && b.innerText.includes("Edit profile"));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    console.log("Clicked Edit Profile?", clicked);
    await new Promise(r => setTimeout(r, 5000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, "facebook_edit_profile_dialog.png") });
    console.log("Saved dialog screenshot!");

  } finally {
    await browser.close();
  }
}

inspectPhotoInputs().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
