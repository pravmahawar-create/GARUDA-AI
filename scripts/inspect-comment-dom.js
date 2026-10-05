const puppeteer = require("puppeteer");
require("dotenv").config();

async function inspectSearchDOM() {
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

  const searchUrl = "https://www.linkedin.com/search/results/content/?keywords=enterprise%20AI%20architecture%20bangalore&origin=GLOBAL_SEARCH_HEADER";
  await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await new Promise(r => setTimeout(r, 5000));

  const details = await page.evaluate(() => {
    // Find all containers that have comment buttons or author names
    const commentButtons = Array.from(document.querySelectorAll("button, a")).filter(el => {
      const text = (el.innerText || el.textContent || "").toLowerCase();
      const aria = (el.getAttribute("aria-label") || "").toLowerCase();
      return text.includes("comment") || aria.includes("comment");
    });

    return {
      commentButtonsCount: commentButtons.length,
      buttons: commentButtons.slice(0, 5).map(b => ({
        tag: b.tagName,
        text: b.innerText.trim(),
        aria: b.getAttribute("aria-label"),
        className: b.className
      }))
    };
  });

  console.log("DOM Details:", JSON.stringify(details, null, 2));
  await browser.close();
}

inspectSearchDOM().catch(console.error);
