const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,900"]
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
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

  const indInput = await page.$("input[aria-label='Industry']");
  if (indInput) {
    console.log("Clicking industry input...");
    await indInput.click();
    await page.keyboard.type("Software", { delay: 50 });
    console.log("Waiting for option selector...");
    const option = await page.waitForSelector("div[role='option']", { visible: true, timeout: 10000 });
    console.log("Option found! Calling option.click()...");
    await option.click();
    await new Promise(r => setTimeout(r, 2000));

    const shot1 = path.join(__dirname, "..", "output", "after_option_click.png");
    await page.screenshot({ path: shot1 });
    console.log("Saved after_option_click.png");

    const inputVal = await page.evaluate(() => {
      const inp = document.querySelector("input[aria-label='Industry']");
      return inp ? inp.value : null;
    });
    console.log("Input value after click:", inputVal);
  }

  await browser.close();
})().catch(console.error);
