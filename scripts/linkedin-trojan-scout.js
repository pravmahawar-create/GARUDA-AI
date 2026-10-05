const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function scoutPosts() {
  const cookieVal = process.env.LINKEDIN_LI_AT;
  if (!cookieVal) {
    throw new Error("LINKEDIN_LI_AT missing in .env");
  }

  console.log("🦅 [GARUDA TROJAN SCOUT] Launching browser to find high-impact Bangalore & AI posts...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--window-size=1280,900"
    ]
  });

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

  // Query: Bangalore AI Enterprise or Agentic AI Bangalore
  const queries = [
    "enterprise AI architecture bangalore",
    "Agentic AI enterprise",
    "Infosys generative AI"
  ];

  const searchUrl = `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(queries[0])}&origin=GLOBAL_SEARCH_HEADER`;
  console.log(`▶ Navigating to Content Search: ${searchUrl}`);

  await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await new Promise(r => setTimeout(r, 6000));

  // Scroll down a bit to load feed items
  await page.evaluate(() => window.scrollBy(0, 800));
  await new Promise(r => setTimeout(r, 3000));

  await page.screenshot({ path: path.join(OUTPUT_DIR, "trojan_scout_search.png"), fullPage: false });
  console.log("✔ Saved screenshot: output/trojan_scout_search.png");

  // Extract post details
  const posts = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll("[data-urn], .feed-shared-update-v2"));
    const results = [];

    for (const item of items) {
      const urn = item.getAttribute("data-urn") || item.getAttribute("data-id") || "";
      const textEl = item.querySelector(".feed-shared-update-v2__description, .break-words, .update-components-text");
      const authorEl = item.querySelector(".feed-shared-actor__name, .update-components-actor__name, span[aria-hidden='true']");
      const authorSubEl = item.querySelector(".feed-shared-actor__description, .update-components-actor__description");

      const author = authorEl ? authorEl.innerText.trim() : "Unknown";
      const authorSub = authorSubEl ? authorSubEl.innerText.trim() : "";
      const text = textEl ? textEl.innerText.trim().slice(0, 300) : "";

      if (text.length > 30) {
        results.push({
          urn,
          author,
          authorSub,
          snippet: text.replace(/\n+/g, " ")
        });
      }
    }
    return results.slice(0, 6);
  });

  console.log(`🎯 Found ${posts.length} Candidate Posts:`);
  console.log(JSON.stringify(posts, null, 2));

  await browser.close();
}

scoutPosts().catch(err => {
  console.error("❌ Scout Error:", err);
  process.exit(1);
});
