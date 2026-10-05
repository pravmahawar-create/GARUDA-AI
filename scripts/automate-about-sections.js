const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function automateAboutSections() {
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

    console.log("Navigating to https://www.facebook.com/me/about ...");
    await page.goto("https://www.facebook.com/me/about", { waitUntil: "networkidle2", timeout: 45000 });
    await new Promise(r => setTimeout(r, 4000));

    // Click "Work" tab on the left sidebar
    console.log("Clicking 'Work' tab...");
    const clickedWork = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll("a, span, div[role='button']"));
      for (const item of items) {
        if ((item.innerText || "").trim() === "Work") {
          item.click();
          return true;
        }
      }
      return false;
    });
    console.log("Clicked Work tab?", clickedWork);
    await new Promise(r => setTimeout(r, 3000));

    const workShot = path.join(OUTPUT_DIR, "fb_about_work_section.png");
    await page.screenshot({ path: workShot });
    console.log("Saved Work section screenshot:", workShot);

    // Click "Links" tab on the left sidebar
    console.log("Clicking 'Links' tab...");
    const clickedLinks = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll("a, span, div[role='button']"));
      for (const item of items) {
        if ((item.innerText || "").trim() === "Links") {
          item.click();
          return true;
        }
      }
      return false;
    });
    console.log("Clicked Links tab?", clickedLinks);
    await new Promise(r => setTimeout(r, 3000));

    const linksShot = path.join(OUTPUT_DIR, "fb_about_links_section.png");
    await page.screenshot({ path: linksShot });
    console.log("Saved Links section screenshot:", linksShot);

    // Click "Details about you" tab on the left sidebar
    console.log("Clicking 'Details about you' tab...");
    const clickedDetails = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll("a, span, div[role='button']"));
      for (const item of items) {
        if ((item.innerText || "").trim() === "Details about you") {
          item.click();
          return true;
        }
      }
      return false;
    });
    console.log("Clicked Details about you tab?", clickedDetails);
    await new Promise(r => setTimeout(r, 3000));

    const detailsShot = path.join(OUTPUT_DIR, "fb_about_details_about_you_section.png");
    await page.screenshot({ path: detailsShot });
    console.log("Saved Details section screenshot:", detailsShot);

  } finally {
    await browser.close();
  }
}

automateAboutSections().catch(console.error);
