const puppeteer = require("puppeteer");
require("dotenv").config();

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setCookie({ name: "li_at", value: process.env.LINKEDIN_LI_AT, domain: ".linkedin.com", path: "/" });
  await page.goto("https://www.linkedin.com/in/garuda-ai-ai-operating-system-227168432/edit/intro/", { waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 4000));

  const fields = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll("input, select, textarea"));
    return inputs.map(i => ({
      id: i.id,
      name: i.name,
      value: i.value,
      placeholder: i.placeholder,
      ariaLabel: i.getAttribute("aria-label"),
      labelText: document.querySelector(`label[for="${i.id}"]`)?.innerText?.trim()
    })).filter(f => f.value || f.labelText);
  });

  console.log("Form Inputs:", JSON.stringify(fields, null, 2));
  await browser.close();
})();
