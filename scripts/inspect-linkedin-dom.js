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

  await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 4000));

  const result = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    return btns.map(b => ({
      text: (b.innerText || "").trim(),
      className: b.className,
      ariaLabel: b.getAttribute("aria-label"),
      id: b.id
    })).filter(b => b.text.toLowerCase().includes("start") || b.text.toLowerCase().includes("photo") || (b.ariaLabel && b.ariaLabel.toLowerCase().includes("post")));
  });

  console.log("Matching elements:", JSON.stringify(result, null, 2));
  await browser.close();
})();
