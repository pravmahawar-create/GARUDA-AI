const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function searchLinkedInGigs() {
  const cookieVal = process.env.LINKEDIN_LI_AT;
  if (!cookieVal) throw new Error("LINKEDIN_LI_AT missing in .env");

  console.log("🦅 [GARUDA LINKEDIN GIG SCOUT] Launching browser to find founders needing developers...");
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

    const searchUrl = "https://www.linkedin.com/search/results/content/?keywords=%22looking%20for%20a%20developer%22%20OR%20%22need%20a%20developer%22%20OR%20%22build%20an%20MVP%22&sortBy=%22date_posted%22";
    console.log(`▶ Navigating to LinkedIn Content Search: ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise(r => setTimeout(r, 6000));

    await page.evaluate(() => window.scrollBy(0, 500));
    await new Promise(r => setTimeout(r, 3000));

    const screenshotPath = path.join(OUTPUT_DIR, "linkedin_gigs_search.png");
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`✔ Saved screenshot: ${screenshotPath}`);

    // Check for comment buttons
    const commentBtns = await page.$$("button[aria-label*='Comment'], button[aria-label*='comment']");
    console.log(`▶ Found ${commentBtns.length} comment buttons on fresh gigs.`);

  } finally {
    await browser.close();
  }
}

searchLinkedInGigs().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
