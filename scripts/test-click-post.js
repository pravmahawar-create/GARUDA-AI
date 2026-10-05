const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

async function testClickPost() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,900"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  await page.setCookie({
    name: "li_at",
    value: process.env.LINKEDIN_LI_AT,
    domain: ".linkedin.com",
    path: "/",
    httpOnly: true,
    secure: true
  });

  console.log("▶ Going to feed...");
  await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await new Promise(r => setTimeout(r, 4000));

  console.log("▶ Clicking 'Start a post'...");
  const clicked = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll("button, span, div"));
    const target = all.find(el => el.textContent && el.textContent.trim() === "Start a post" && el.offsetParent !== null);
    if (target) {
      target.click();
      return true;
    }
    return false;
  });

  console.log("Clicked result:", clicked);
  await new Promise(r => setTimeout(r, 3000));

  await page.screenshot({ path: path.join(__dirname, "..", "output", "test_post_modal.png") });
  console.log("Saved test_post_modal.png");

  await browser.close();
}

testClickPost().catch(console.error);
