const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function searchFacebookCustomers() {
  const cUser = process.env.FB_C_USER;
  const xs = process.env.FB_XS;

  if (!cUser || !xs) {
    throw new Error("FB_C_USER or FB_XS missing in .env");
  }

  console.log("🦅 [GARUDA FB HUNTER] Initializing Facebook search for customers needing websites & bots...");

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

    // Search query for people looking for web developer / website / bot
    const queries = [
      "\"looking for a web developer\"",
      "\"need someone to build a website\"",
      "\"recommend a web developer\"",
      "\"need a bot developer\""
    ];

    const searchUrl = `https://www.facebook.com/search/posts/?q=${encodeURIComponent("looking for a web developer")}&filters=eyJyZWNlbnRfcG9zdHM6MCI6IntcIm5hbWVcIjpcInJlY2VudF9wb3N0c1wiLFwiYXJnc1wiOlwiXCJ9In0%3D`;
    console.log(`▶ Navigating to Facebook Recent Posts Search: ${searchUrl}`);

    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await new Promise(r => setTimeout(r, 6000));

    // Scroll down to load fresh results
    console.log("▶ Scrolling to load post feeds...");
    await page.evaluate(() => window.scrollBy(0, 1000));
    await new Promise(r => setTimeout(r, 4000));
    await page.evaluate(() => window.scrollBy(0, 1000));
    await new Promise(r => setTimeout(r, 4000));

    const screenshotPath = path.join(OUTPUT_DIR, "fb_customer_hunt_search.png");
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`✔ Saved screenshot: ${screenshotPath}`);

    // Extract posts
    const postsData = await page.evaluate(() => {
      // Find all post containers or feed cards
      const postElements = Array.from(document.querySelectorAll("div[role='feed'] > div, div[role='article']"));
      const extracted = [];

      for (const el of postElements) {
        const text = el.innerText || "";
        // Find links
        const links = Array.from(el.querySelectorAll("a[href]")).map(a => a.href);
        const permalink = links.find(l => l.includes("/posts/") || l.includes("/permalink/") || l.includes("story.php") || l.includes("/videos/")) || "";

        // Look for author
        const authorEl = el.querySelector("h2, h3, strong, a span");
        const author = authorEl ? authorEl.innerText.trim() : "Unknown";

        if (text.length > 50 && (text.toLowerCase().includes("developer") || text.toLowerCase().includes("website") || text.toLowerCase().includes("app") || text.toLowerCase().includes("build"))) {
          extracted.push({
            author,
            permalink,
            snippet: text.slice(0, 300).replace(/\n+/g, " ")
          });
        }
      }
      return extracted.slice(0, 8);
    });

    console.log(`🎯 Found ${postsData.length} relevant posts on Facebook:`);
    console.log(JSON.stringify(postsData, null, 2));

    fs.writeFileSync(path.join(__dirname, "..", "data", "fb_hunted_customers.json"), JSON.stringify(postsData, null, 2), "utf8");

  } finally {
    await browser.close();
  }
}

searchFacebookCustomers().catch(err => {
  console.error("❌ FB Hunter Error:", err.message);
  process.exit(1);
});
