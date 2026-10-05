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

  const saveBtnInfo = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const save = btns.find(b => (b.innerText || "").trim() === "Save");
    if (!save) return { error: "No Save button found" };
    return {
      outerHTML: save.outerHTML,
      disabled: save.disabled,
      type: save.type,
      formId: save.form ? save.form.id : null,
      parentFormHTML: save.closest("form") ? save.closest("form").outerHTML.substring(0, 300) : "no form parent",
      rect: save.getBoundingClientRect()
    };
  });

  console.log("SAVE BTN INFO:", JSON.stringify(saveBtnInfo, null, 2));
  await browser.close();
})().catch(console.error);
