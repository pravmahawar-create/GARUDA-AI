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

  await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 4000));

  // Find exact coordinate of "Start a post"
  const coords = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll("*"));
    const el = all.find(e => e.children.length === 0 && e.textContent && e.textContent.trim() === "Start a post");
    if (el) {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }
    return null;
  });

  console.log("Found coords for 'Start a post':", coords);
  if (coords) {
    await page.mouse.click(coords.x, coords.y);
    console.log("Clicked via page.mouse.click!");
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(__dirname, "..", "output", "mouse_click_modal.png") });
    console.log("Saved mouse_click_modal.png");
  }

  await browser.close();
})();
