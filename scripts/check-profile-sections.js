const puppeteer = require("puppeteer");
require("dotenv").config();

async function checkSections() {
  const cookieVal = process.env.LINKEDIN_LI_AT;
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setCookie({ name: "li_at", value: cookieVal, domain: ".linkedin.com", path: "/" });
  await page.goto("https://www.linkedin.com/in/garuda-ai-ai-operating-system-227168432/", { waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 6000));

  const sections = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("section")).map(s => {
      const h2 = s.querySelector("h2");
      return h2 ? h2.innerText.trim() : "No-H2";
    });
  });

  console.log("Sections on profile:", sections);
  await browser.close();
}

checkSections().catch(console.error);
