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
    console.log("Typing 'Software'...");
    await indInput.click();
    await page.keyboard.type("Software", { delay: 40 });
    await new Promise(r => setTimeout(r, 2000));

    console.log("Finding option...");
    const clicked = await page.evaluate(() => {
      const options = Array.from(document.querySelectorAll("div[role='option']"));
      const match = options.find(o => o.innerText.trim().startsWith("Software Development"));
      if (match) {
        // Dispatch full mouse event sequence
        const btn = match.querySelector("[role='button']") || match;
        btn.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
        btn.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true }));
        btn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        return true;
      }
      return false;
    });

    console.log("Option clicked:", clicked);
    await new Promise(r => setTimeout(r, 1500));

    // Check input state now
    const stateAfterClick = await page.evaluate(() => {
      const inp = document.querySelector("input[aria-label='Industry']");
      const lazyCol = document.querySelector("[data-testid='lazy-column']");
      const chips = Array.from(document.querySelectorAll(".artdeco-pill, [data-pill]")).map(p => p.innerText);
      return {
        inputValue: inp?.value,
        dropdownStillOpen: !!lazyCol,
        chips,
        parentText: inp?.parentElement?.parentElement?.innerText
      };
    });
    console.log("STATE AFTER CLICK:", JSON.stringify(stateAfterClick, null, 2));

    const proof = path.join(__dirname, "..", "output", "test_click_option_state.png");
    await page.screenshot({ path: proof });
    console.log("Saved proof:", proof);
  }

  await browser.close();
})().catch(console.error);
