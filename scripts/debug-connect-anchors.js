const puppeteer = require("puppeteer");
require("dotenv").config();

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,900"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setCookie({
    name: "li_at",
    value: process.env.LINKEDIN_LI_AT,
    domain: ".linkedin.com",
    path: "/"
  });

  await page.goto("https://www.linkedin.com/search/results/people/?keywords=software%20engineer%20infosys%20bangalore", { waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 6000));

  const aTags = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll("a, button"));
    return anchors.filter(a => {
      const txt = (a.innerText || "").trim();
      return txt.includes("Connect");
    }).map(a => {
      const r = a.getBoundingClientRect();
      return {
        tag: a.tagName,
        href: a.getAttribute("href"),
        text: (a.innerText || "").trim(),
        x: r.left + r.width / 2,
        y: r.top + r.height / 2
      };
    });
  });

  console.log("Connect targets found:", JSON.stringify(aTags, null, 2));
  await browser.close();
})();
