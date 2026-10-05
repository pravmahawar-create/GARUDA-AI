const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function inspectFacebookEditModal() {
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

    // Look for "Edit profile" button
    console.log("▶ Finding and clicking 'Edit profile' button...");
    const clicked = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll("div[role='button'], span"));
      for (const el of elements) {
        if (el.textContent && el.textContent.trim() === "Edit profile") {
          el.scrollIntoView({ behavior: "instant", block: "center" });
          el.click();
          return true;
        }
      }
      return false;
    });

    console.log("▶ Clicked 'Edit profile'?", clicked);
    await new Promise(r => setTimeout(r, 4000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, "facebook_edit_modal_open.png") });
    console.log("✔ Saved edit modal screenshot!");

    // Inspect buttons and sections inside the modal
    const modalSections = await page.evaluate(() => {
      const modal = document.querySelector("div[role='dialog']");
      if (!modal) return "No dialog found";
      
      const buttons = Array.from(modal.querySelectorAll("div[role='button'], button, span")).map(b => b.textContent?.trim()).filter(Boolean);
      return {
        title: modal.querySelector("h2")?.innerText,
        buttons: Array.from(new Set(buttons)).slice(0, 20)
      };
    });

    console.log("Modal Details:", JSON.stringify(modalSections, null, 2));

  } finally {
    await browser.close();
  }
}

inspectFacebookEditModal().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
