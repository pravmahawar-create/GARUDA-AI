const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const BASE_DIR = path.resolve(__dirname, "..");
const BANNER_IMAGE = path.join(BASE_DIR, "output", "garuda_linkedin_cover_master.jpg");

(async () => {
  const cookieVal = process.env.LINKEDIN_LI_AT;
  if (!cookieVal) throw new Error("Missing LINKEDIN_LI_AT");
  if (!fs.existsSync(BANNER_IMAGE)) throw new Error("Banner image not found: " + BANNER_IMAGE);

  console.log("🦅 Launching Chromium to update LinkedIn Profile Cover Banner...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,900"]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setCookie({
      name: "li_at",
      value: cookieVal,
      domain: ".linkedin.com",
      path: "/",
      httpOnly: true,
      secure: true
    });

    console.log("▶ Navigating to profile...");
    await page.goto("https://www.linkedin.com/in/garuda-ai-ai-operating-system-227168432/", { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise(r => setTimeout(r, 4000));

    console.log("▶ [1/4] Clicking 'Edit background image' pencil icon at (832, 112)...");
    await page.mouse.click(832, 112);
    await new Promise(r => setTimeout(r, 2000));

    console.log("▶ [2/4] Clicking 'Edit cover image' dropdown option...");
    const clickedOption = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll("div, span, button, li, a"));
      const editItem = items.find(el => (el.textContent || "").trim() === "Edit cover image");
      if (editItem) {
        editItem.click();
        return true;
      }
      return false;
    });

    if (!clickedOption) {
      console.log("  Clicking via coordinates (530, 195)...");
      await page.mouse.click(530, 195);
    }
    await new Promise(r => setTimeout(r, 3000));

    await page.screenshot({ path: path.join(BASE_DIR, "output", "banner_upload_dialog_open.png") });
    console.log("✔ Dialog opened, captured output/banner_upload_dialog_open.png");

    // Look for file input or 'Change photo' button
    let fileInput = await page.$("input[type='file']");
    if (!fileInput) {
      console.log("  Searching for 'Change photo' button inside modal...");
      const changeBtn = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button, label"));
        for (const b of btns) {
          const t = (b.textContent || "").toLowerCase();
          if (t.includes("change photo") || t.includes("upload") || t.includes("change")) {
            b.click();
            return true;
          }
        }
        return false;
      });
      console.log("  Clicked change button:", changeBtn);
      await new Promise(r => setTimeout(r, 2000));
      fileInput = await page.$("input[type='file']");
    }

    if (!fileInput) {
      throw new Error("Could not find file input in banner dialog!");
    }

    console.log("▶ [3/4] Uploading new 8K Masterpiece Banner: " + BANNER_IMAGE);
    await fileInput.uploadFile(BANNER_IMAGE);
    console.log("  Waiting 6s for image preview rendering...");
    await new Promise(r => setTimeout(r, 6000));

    await page.screenshot({ path: path.join(BASE_DIR, "output", "banner_preview_before_apply.png") });
    console.log("✔ Preview captured: output/banner_preview_before_apply.png");

    // Click 'Apply' button
    console.log("▶ [4/4] Clicking 'Apply' button...");
    const applyClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      for (const b of btns) {
        const t = (b.textContent || "").trim();
        if (t === "Apply" && !b.disabled) {
          b.click();
          return true;
        }
      }
      return false;
    });

    console.log("Apply button clicked result:", applyClicked);
    console.log("Waiting 12s for LinkedIn to save and commit background image...");
    await new Promise(r => setTimeout(r, 12000));

    await page.screenshot({ path: path.join(BASE_DIR, "output", "profile_after_banner_update.png") });
    console.log("🎉 SUCCESS! Saved final proof: output/profile_after_banner_update.png");

  } finally {
    await browser.close();
  }
})();
