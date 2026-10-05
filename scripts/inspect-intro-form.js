const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--window-size=1280,900"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setCookie({ name: "li_at", value: process.env.LINKEDIN_LI_AT, domain: ".linkedin.com", path: "/" });

  const introUrl = "https://www.linkedin.com/in/garuda-ai-ai-operating-system-227168432/edit/intro/";
  console.log("Navigating directly to Edit Intro form:", introUrl);
  await page.goto(introUrl, { waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 6000));

  await page.screenshot({ path: path.join(__dirname, "..", "output", "edit_intro_form.png") });
  console.log("Screenshot saved: edit_intro_form.png");

  // Extract form input fields
  const inputs = await page.evaluate(() => {
    const list = Array.from(document.querySelectorAll("input, textarea, select"));
    return list.map(el => ({
      tag: el.tagName,
      id: el.id,
      name: el.name,
      value: el.value?.slice(0, 50),
      placeholder: el.placeholder
    }));
  });

  console.log("Form inputs:", JSON.stringify(inputs, null, 2));
  await browser.close();
})();
