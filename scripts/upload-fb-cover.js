const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");
const COVER_PATH = path.join(__dirname, "..", "output", "garuda_linkedin_cover_master.jpg");

async function uploadFacebookCover() {
  const cUser = process.env.FB_C_USER;
  const xs = process.env.FB_XS;

  if (!fs.existsSync(COVER_PATH)) {
    throw new Error(`Cover image not found at ${COVER_PATH}`);
  }

  console.log(`🦅 [GARUDA FB COVER UPLOAD] Uploading master cover: ${COVER_PATH}`);
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

    console.log("▶ Clicking 'Add cover photo' / 'Edit cover photo'...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("div[role='button'], button, span"));
      for (const b of btns) {
        if (b.innerText && (b.innerText.includes("Add cover photo") || b.innerText.includes("Edit cover photo"))) {
          b.scrollIntoView({ behavior: "instant", block: "center" });
          b.click();
          break;
        }
      }
    });

    await new Promise(r => setTimeout(r, 2500));

    console.log("▶ Waiting for file chooser on 'Upload photo' click...");
    const [fileChooser] = await Promise.all([
      page.waitForFileChooser({ timeout: 15000 }),
      page.evaluate(() => {
        const items = Array.from(document.querySelectorAll("div[role='menuitem'], div[role='button'], span"));
        for (const item of items) {
          if (item.innerText && item.innerText.includes("Upload photo")) {
            item.click();
            break;
          }
        }
      })
    ]);

    console.log("▶ File chooser triggered! Passing cover photo file...");
    await fileChooser.accept([COVER_PATH]);

    console.log("▶ File accepted! Waiting 10s for upload preview to render...");
    await new Promise(r => setTimeout(r, 10000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, "fb_cover_upload_preview.png") });
    console.log("✔ Saved preview screenshot: output/fb_cover_upload_preview.png");

    // Look for "Save changes" button
    console.log("▶ Looking for 'Save changes' button...");
    const saveClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("div[role='button'], button, span"));
      for (const b of btns) {
        if (b.innerText && (b.innerText.includes("Save changes") || b.innerText.trim() === "Save")) {
          b.scrollIntoView({ behavior: "instant", block: "center" });
          b.click();
          return true;
        }
      }
      return false;
    });

    console.log("▶ Clicked 'Save changes'?", saveClicked);
    await new Promise(r => setTimeout(r, 8000));

    const finalPath = path.join(OUTPUT_DIR, "fb_cover_final_proof.png");
    await page.screenshot({ path: finalPath });
    console.log("✔ Saved final proof screenshot:", finalPath);

  } finally {
    await browser.close();
  }
}

uploadFacebookCover().catch(err => {
  console.error("❌ Cover Upload Error:", err.message);
  process.exit(1);
});
