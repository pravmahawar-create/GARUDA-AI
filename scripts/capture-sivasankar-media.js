const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,1400"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1400 });
  await page.setCookie({
    name: "li_at",
    value: process.env.LINKEDIN_LI_AT,
    domain: ".linkedin.com",
    path: "/"
  });

  console.log("▶ Loading post...");
  await page.goto("https://www.linkedin.com/posts/sivasankar-natarajan_aiagents-llmops-rag-share-7504431333255827456-rpuw/", {
    waitUntil: "domcontentloaded",
    timeout: 60000
  });

  await new Promise(r => setTimeout(r, 6000));

  // Find the exact image in the post
  const selector = "img[alt='View image'], img[src*='feedshare']";
  const el = await page.$(selector);
  if (el) {
    const box = await el.boundingBox();
    console.log("Found element bounding box:", box);
    await el.screenshot({ path: path.join(__dirname, "..", "output", "sivasankar_graphic.png") });
    console.log("✔ Screenshot saved to output/sivasankar_graphic.png");
  } else {
    console.log("Element not found with selector:", selector);
  }

  // Also take a screenshot of the main post container
  const postContainer = await page.$(".feed-shared-update-v2, article");
  if (postContainer) {
    await postContainer.screenshot({ path: path.join(__dirname, "..", "output", "sivasankar_post_card.png") });
    console.log("✔ Post container saved to output/sivasankar_post_card.png");
  }

  await browser.close();
})();
