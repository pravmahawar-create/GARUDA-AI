const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--window-size=1280,900"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setCookie({ name: "li_at", value: process.env.LINKEDIN_LI_AT, domain: ".linkedin.com", path: "/" });

  await page.goto("https://www.linkedin.com/in/me/", { waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 6000));

  // Find Add industry button
  const clicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button, a"));
    const addInd = btns.find(b => (b.innerText || "").trim() === "Add industry");
    if (addInd) {
      addInd.click();
      return true;
    }
    return false;
  });

  console.log("Clicked Add industry:", clicked);
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: path.join(__dirname, "..", "output", "add_industry_modal.png") });
  console.log("Screenshot saved: add_industry_modal.png");

  await browser.close();
})();
