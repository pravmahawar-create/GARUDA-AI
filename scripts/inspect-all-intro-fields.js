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

  const info = await page.evaluate(() => {
    const orgSelect = Array.from(document.querySelectorAll("select")).find(s => {
      const lbl = document.querySelector(`label[for="${s.id}"]`);
      return lbl && lbl.innerText.includes("Organization");
    });

    let orgOptions = [];
    if (orgSelect) {
      orgOptions = Array.from(orgSelect.options).map(o => ({
        text: o.text,
        value: o.value,
        selected: o.selected
      }));
    }

    // Also check what other fields exist below Industry
    const allLabelsAndInputs = Array.from(document.querySelectorAll("label")).map(lbl => {
      const id = lbl.getAttribute("for");
      const el = id ? document.getElementById(id) : null;
      return {
        label: lbl.innerText.trim(),
        id,
        tagName: el?.tagName,
        type: el?.type,
        value: el?.value
      };
    });

    return { orgOptions, allLabelsAndInputs };
  });

  console.log("ORGANIZATION OPTIONS:", JSON.stringify(info.orgOptions, null, 2));
  console.log("ALL LABELS & INPUTS:", JSON.stringify(info.allLabelsAndInputs, null, 2));

  await browser.close();
})().catch(console.error);
