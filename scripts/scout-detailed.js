const puppeteer = require("puppeteer");
require("dotenv").config();

async function scoutDetailed() {
  const cookieVal = process.env.LINKEDIN_LI_AT;
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,900"]
  });
  const page = await browser.newPage();
  await page.setCookie({
    name: "li_at",
    value: cookieVal,
    domain: ".linkedin.com",
    path: "/",
    httpOnly: true,
    secure: true
  });

  const query = "enterprise AI architecture bangalore";
  const searchUrl = `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(query)}&origin=GLOBAL_SEARCH_HEADER`;
  await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await new Promise(r => setTimeout(r, 5000));

  // Extract post links / activity URNs
  const posts = await page.evaluate(() => {
    const commentBtns = Array.from(document.querySelectorAll('button[aria-label="Comment"]'));
    return commentBtns.map((btn, idx) => {
      // Traverse up to find the container
      let cur = btn;
      let postContainer = null;
      for (let i = 0; i < 10; i++) {
        if (!cur) break;
        if (cur.getAttribute("data-urn") || cur.getAttribute("data-id") || cur.tagName === "LI" || cur.classList.contains("feed-shared-update-v2")) {
          postContainer = cur;
          break;
        }
        cur = cur.parentElement;
      }

      const text = postContainer ? (postContainer.innerText || "").slice(0, 250).replace(/\n+/g, " ") : "";
      const rect = btn.getBoundingClientRect();
      return {
        index: idx,
        text,
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2
      };
    });
  });

  console.log("Found Posts with Comment Buttons:", JSON.stringify(posts, null, 2));
  await browser.close();
}

scoutDetailed().catch(console.error);
