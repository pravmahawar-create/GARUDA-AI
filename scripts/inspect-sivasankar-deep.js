const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,1200"]
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1200 });
  await page.setCookie({
    name: "li_at",
    value: process.env.LINKEDIN_LI_AT,
    domain: ".linkedin.com",
    path: "/"
  });

  console.log("▶ Loading Sivasankar post...");
  await page.goto("https://www.linkedin.com/posts/sivasankar-natarajan_aiagents-llmops-rag-share-7504431333255827456-rpuw/", {
    waitUntil: "domcontentloaded",
    timeout: 60000
  });

  await new Promise(r => setTimeout(r, 6000));

  const postDetails = await page.evaluate(() => {
    const postContainer = document.querySelector(".feed-shared-update-v2") || document.querySelector("main") || document.body;

    // Check for videos
    const videos = Array.from(postContainer.querySelectorAll("video")).map(v => ({
      src: v.src || v.currentSrc,
      poster: v.poster,
      paused: v.paused,
      currentTime: v.currentTime,
      duration: v.duration
    }));

    // Check for iframes / embeds
    const iframes = Array.from(postContainer.querySelectorAll("iframe")).map(f => ({
      src: f.src,
      title: f.title
    }));

    // Check for document / carousel / slides
    const docs = Array.from(postContainer.querySelectorAll(".feed-shared-document, [data-view-name*='document'], canvas, .artdeco-carousel")).map(d => ({
      tag: d.tagName,
      className: d.className
    }));

    // Check for images / gifs
    const images = Array.from(postContainer.querySelectorAll("img")).map(img => ({
      src: img.src,
      alt: img.alt,
      width: img.width,
      height: img.height
    })).filter(i => i.width > 150 || i.height > 150);

    return {
      postHtmlSnippet: postContainer.innerHTML.slice(0, 2000),
      videos,
      iframes,
      docs,
      largeImages: images
    };
  });

  fs.writeFileSync(path.join(__dirname, "..", "output", "sivasankar_details.json"), JSON.stringify(postDetails, null, 2));
  console.log("✔ Details written to output/sivasankar_details.json");

  // Capture full page screenshot
  const screenshotPath = path.join(__dirname, "..", "output", "sivasankar_full_post.png");
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log("✔ Full page screenshot saved:", screenshotPath);

  await browser.close();
})();
