const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function scoutFreshTrojanTargets() {
  const cookieVal = process.env.LINKEDIN_LI_AT;
  if (!cookieVal) {
    throw new Error("LINKEDIN_LI_AT missing in .env");
  }

  console.log("🦅 [GARUDA TROJAN SCOUT v2] Searching for fresh Bangalore Enterprise AI & Infosys Topaz discussions...");
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

  // Query: Infosys Topaz generative AI or Enterprise AI Bangalore
  const searchUrl = "https://www.linkedin.com/search/results/content/?keywords=Infosys%20Topaz%20AI&sortBy=%22date_posted%22";
  console.log(`▶ Navigating to Content Search: ${searchUrl}`);
  await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await new Promise(r => setTimeout(r, 6000));

  await page.evaluate(() => window.scrollBy(0, 600));
  await new Promise(r => setTimeout(r, 3000));

  const screenshotPath = path.join(OUTPUT_DIR, "trojan_scout_fresh_results.png");
  await page.screenshot({ path: screenshotPath });
  console.log("✔ Saved screenshot:", screenshotPath);

  // Extract visible posts text and comment buttons
  const postData = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll(".feed-shared-update-v2, div[data-view-name='feed-full-update']"));
    return cards.map((card, idx) => {
      const author = card.querySelector(".update-components-actor__name, .feed-shared-actor__name")?.innerText?.trim() || "Unknown Author";
      const headline = card.querySelector(".update-components-actor__description, .feed-shared-actor__description")?.innerText?.trim() || "";
      const text = card.querySelector(".feed-shared-update-v2__description, .update-components-text")?.innerText?.trim() || "";
      const hasCommentBtn = !!card.querySelector("button[aria-label*='Comment']");
      return {
        idx,
        author,
        headline,
        text: text.slice(0, 250).replace(/\n+/g, " "),
        hasCommentBtn
      };
    });
  });

  console.log("🎯 Fresh Candidate Posts Found:", postData.length);
  console.log(JSON.stringify(postData, null, 2));

  await browser.close();
}

scoutFreshTrojanTargets().catch(err => {
  console.error("❌ Scout Error:", err);
  process.exit(1);
});
