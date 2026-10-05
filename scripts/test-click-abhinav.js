const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--window-size=1280,900"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setCookie({ name: "li_at", value: process.env.LINKEDIN_LI_AT, domain: ".linkedin.com", path: "/" });
  await page.goto("https://www.linkedin.com/search/results/content/?keywords=Gen%20AI%20architecture%20Bangalore", { waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 6000));

  const btns = await page.$$("button[aria-label='Comment']");
  console.log("Found buttons:", btns.length);

  if (btns.length > 1) {
    console.log("Clicking button 1 (Abhinav Kumar)...");
    await btns[1].evaluate(b => {
      b.scrollIntoView({ behavior: "instant", block: "center" });
      b.click();
    });
    await new Promise(r => setTimeout(r, 3500));

    await page.screenshot({ path: path.join(__dirname, "..", "output", "abhinav_comment_open_proof.png") });
    console.log("Screenshot saved: abhinav_comment_open_proof.png");

    const editors = await page.$$("div[role='textbox']");
    console.log("Total editors open:", editors.length);
  }

  await browser.close();
})();
