const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function findOpenBangalorePosts() {
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

  // Query targeting individuals posting about Gen AI in Bangalore
  const searchUrl = "https://www.linkedin.com/search/results/content/?keywords=Gen%20AI%20architecture%20Bangalore";
  console.log("Navigating to:", searchUrl);
  await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await new Promise(r => setTimeout(r, 6000));

  await page.screenshot({ path: path.join(OUTPUT_DIR, "bangalore_genai_search.png") });
  console.log("Screenshot saved: bangalore_genai_search.png");

  // Check comment buttons and authors
  const targets = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll(".feed-shared-update-v2"));
    return cards.map((card, i) => {
      const authorEl = card.querySelector(".update-components-actor__name, .feed-shared-actor__name");
      const author = authorEl ? authorEl.innerText.trim() : "Unknown";
      const descEl = card.querySelector(".update-components-actor__description, .feed-shared-actor__description");
      const desc = descEl ? descEl.innerText.trim() : "";
      const textEl = card.querySelector(".update-components-text, .feed-shared-update-v2__description");
      const text = textEl ? textEl.innerText.trim().slice(0, 200).replace(/\n+/g, " ") : "";
      const commentBtn = card.querySelector("button[aria-label*='Comment'], button[aria-label*='comment']");
      const isRestricted = card.innerText.includes("Only connections can comment");
      return {
        i,
        author,
        desc,
        text,
        hasCommentBtn: !!commentBtn,
        isRestricted
      };
    });
  });

  console.log("Found targets:", JSON.stringify(targets, null, 2));
  await browser.close();
}

findOpenBangalorePosts().catch(console.error);
