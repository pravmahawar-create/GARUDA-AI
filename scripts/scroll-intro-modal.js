const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--window-size=1280,900"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setCookie({ name: "li_at", value: process.env.LINKEDIN_LI_AT, domain: ".linkedin.com", path: "/" });

  await page.goto("https://www.linkedin.com/in/garuda-ai-ai-operating-system-227168432/edit/intro/", { waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 6000));

  await page.evaluate(() => {
    const modal = document.querySelector(".artdeco-modal__content, div[role='dialog']");
    if (modal) modal.scrollBy(0, 600);
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(__dirname, "..", "output", "edit_intro_modal_scrolled.png") });
  console.log("Saved: output/edit_intro_modal_scrolled.png");

  // Check custom website / link fields
  const customLinkFields = await page.evaluate(() => {
    const modal = document.querySelector(".artdeco-modal__content, div[role='dialog']");
    return modal ? modal.innerText : "";
  });
  console.log("Modal inner text:\n", customLinkFields.slice(0, 1000));

  await browser.close();
})();
