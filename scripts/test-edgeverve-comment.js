const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function inspectEdgeverve() {
  const cookieVal = process.env.LINKEDIN_LI_AT;
  if (!cookieVal) throw new Error("Missing LINKEDIN_LI_AT");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,900"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setCookie({
    name: "li_at",
    value: cookieVal,
    domain: ".linkedin.com",
    path: "/"
  });

  const searchUrl = "https://www.linkedin.com/search/results/content/?keywords=Infosys%20Topaz%20AI&sortBy=%22date_posted%22";
  console.log("Navigating to EdgeVerve post search...");
  await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await new Promise(r => setTimeout(r, 6000));

  // Find the first comment button
  const commentButtons = await page.$$("button[aria-label*='Comment'], button[aria-label*='comment']");
  console.log(`Found ${commentButtons.length} comment buttons.`);

  if (commentButtons.length > 0) {
    console.log("Clicking first comment button (EdgeVerve post)...");
    await commentButtons[0].click();
    await new Promise(r => setTimeout(r, 3500));

    await page.screenshot({ path: path.join(OUTPUT_DIR, "edgeverve_comment_box_open.png") });
    console.log("✔ Screenshot saved: edgeverve_comment_box_open.png");

    const editor = await page.$("div[role='textbox']");
    console.log("Editor textbox present:", !!editor);
  }

  await browser.close();
}

inspectEdgeverve().catch(console.error);
