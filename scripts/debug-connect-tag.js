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

  const connectElements = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll("*"));
    return all.filter(el => {
      const txt = (el.innerText || "").trim();
      return txt === "Connect" || txt === "+ Connect";
    }).map(el => ({
      tagName: el.tagName,
      className: el.className,
      role: el.getAttribute("role"),
      rect: el.getBoundingClientRect()
    }));
  });

  console.log("Connect elements found:", JSON.stringify(connectElements.slice(0, 10), null, 2));
  await browser.close();
})();
