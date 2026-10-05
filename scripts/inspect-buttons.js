const puppeteer = require("puppeteer");
require("dotenv").config();

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setCookie({ name: "li_at", value: process.env.LINKEDIN_LI_AT, domain: ".linkedin.com", path: "/" });
  await page.goto("https://www.linkedin.com/search/results/content/?keywords=Gen%20AI%20architecture%20Bangalore", { waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 6000));

  const info = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button[aria-label*='Comment'], button[aria-label*='comment']"));
    return btns.map((b, idx) => {
      let p = b.parentElement;
      for (let k = 0; k < 12 && p; k++) {
        if (p.innerText && p.innerText.length > 80) break;
        p = p.parentElement;
      }
      return {
        btnIndex: idx,
        ariaLabel: b.getAttribute("aria-label"),
        text: (b.innerText || "").trim(),
        snippet: p ? p.innerText.replace(/\n+/g, " ").slice(0, 120) : "NO_PARENT"
      };
    });
  });

  console.log("Found buttons:", JSON.stringify(info, null, 2));
  await browser.close();
})();
