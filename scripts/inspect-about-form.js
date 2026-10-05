const puppeteer = require("puppeteer");
require("dotenv").config();

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--window-size=1280,900"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setCookie({ name: "li_at", value: process.env.LINKEDIN_LI_AT, domain: ".linkedin.com", path: "/" });

  await page.goto("https://www.linkedin.com/in/garuda-ai-ai-operating-system-227168432/edit/forms/summary/new", { waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 6000));

  const info = await page.evaluate(() => {
    const textareas = Array.from(document.querySelectorAll("textarea, div[role='textbox']"));
    const btns = Array.from(document.querySelectorAll("button"));
    return {
      textareas: textareas.map(t => ({ tag: t.tagName, id: t.id, role: t.getAttribute("role"), class: t.className })),
      saveButtons: btns.filter(b => (b.innerText || "").trim() === "Save").map(b => ({ tag: b.tagName, text: b.innerText, disabled: b.disabled }))
    };
  });

  console.log("About Form Details:", JSON.stringify(info, null, 2));
  await browser.close();
})();
