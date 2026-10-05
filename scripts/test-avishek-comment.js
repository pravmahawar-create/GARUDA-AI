const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--window-size=1280,900"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setCookie({ name: "li_at", value: process.env.LINKEDIN_LI_AT, domain: ".linkedin.com", path: "/" });

  const searchUrl = "https://www.linkedin.com/search/results/content/?keywords=enterprise%20AI%20architecture%20bangalore&origin=GLOBAL_SEARCH_HEADER";
  await page.goto(searchUrl, { waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 6000));

  const buttons = await page.$$("button[aria-label='Comment']");
  console.log("Buttons found:", buttons.length);

  if (buttons.length > 0) {
    console.log("Clicking button 0 (Avishek Mishra - Ralph Lauren Bangalore)...");
    await buttons[0].click();
    await new Promise(r => setTimeout(r, 3500));

    await page.screenshot({ path: path.join(__dirname, "..", "output", "avishek_comment_open.png") });
    console.log("Screenshot saved: avishek_comment_open.png");

    const editor = await page.$("div[role='textbox']");
    console.log("Editor on Avishek Mishra present:", !!editor);
  }

  await browser.close();
})();
