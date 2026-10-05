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

  const result = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    return btns.map(b => ({
      text: (b.innerText || "").trim(),
      aria: b.getAttribute("aria-label"),
      outer: b.outerHTML.slice(0, 120)
    })).filter(b => b.text.toLowerCase().includes("connect") || (b.aria && b.aria.toLowerCase().includes("connect")) || (b.aria && b.aria.toLowerCase().includes("invite")));
  });

  console.log("Connect buttons matching:", JSON.stringify(result, null, 2));
  await browser.close();
})();
