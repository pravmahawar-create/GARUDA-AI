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

  const formInfo = await page.evaluate(() => {
    const fields = [];
    document.querySelectorAll("input, select, textarea, [role=textbox]").forEach(el => {
      fields.push({
        tag: el.tagName,
        id: el.id,
        name: el.name,
        type: el.type,
        role: el.getAttribute("role"),
        value: el.value || el.innerText || "",
        placeholder: el.placeholder || ""
      });
    });
    const labels = Array.from(document.querySelectorAll("label")).map(l => ({
      for: l.getAttribute("for"),
      text: l.innerText.trim()
    }));
    return { fields, labels };
  });

  console.log("FIELDS:", JSON.stringify(formInfo, null, 2));
  await browser.close();
})().catch(console.error);
