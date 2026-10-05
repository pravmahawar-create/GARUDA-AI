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

  await page.goto("https://www.linkedin.com/in/garuda-ai-ai-operating-system-227168432/edit/intro/", {
    waitUntil: "domcontentloaded",
    timeout: 45000
  });
  await new Promise(r => setTimeout(r, 4000));

  const industryDetails = await page.evaluate(() => {
    const label = Array.from(document.querySelectorAll("label")).find(l => l.innerText.includes("Industry"));
    if (!label) return { error: "No Industry label found" };
    const inputId = label.getAttribute("for");
    const input = document.getElementById(inputId);
    const parent = label.closest(".artdeco-text-input--container, .fb-single-typeahead-entity-form-component, div");
    return {
      inputId,
      inputTag: input?.tagName,
      inputOuterHTML: input?.outerHTML,
      parentHTML: parent?.innerHTML
    };
  });

  console.log("INDUSTRY DETAILS:", JSON.stringify(industryDetails, null, 2));
  await browser.close();
})().catch(console.error);
