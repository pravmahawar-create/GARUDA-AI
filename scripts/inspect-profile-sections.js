const puppeteer = require("puppeteer");
require("dotenv").config();

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,900"]
  });
  const page = await browser.newPage();
  await page.setCookie({
    name: "li_at",
    value: process.env.LINKEDIN_LI_AT,
    domain: ".linkedin.com",
    path: "/"
  });

  await page.goto("https://www.linkedin.com/in/me/", { waitUntil: "domcontentloaded", timeout: 45000 });
  await new Promise(r => setTimeout(r, 4000));

  const sections = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("section")).map(s => {
      const h2 = s.querySelector("h2");
      return {
        header: h2 ? h2.innerText.trim() : "No H2",
        text: s.innerText.trim().substring(0, 300)
      };
    });
  });

  console.log("PROFILE SECTIONS:", JSON.stringify(sections, null, 2));
  await browser.close();
})().catch(console.error);
