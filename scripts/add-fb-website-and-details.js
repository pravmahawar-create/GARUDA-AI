const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function addWebsiteAndDetails() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");

    await page.setCookie(
      { name: "c_user", value: process.env.FB_C_USER.trim(), domain: ".facebook.com", path: "/", secure: true },
      { name: "xs", value: process.env.FB_XS.trim(), domain: ".facebook.com", path: "/", httpOnly: true, secure: true }
    );

    console.log("Navigating to https://www.facebook.com/me/about ...");
    await page.goto("https://www.facebook.com/me/about", { waitUntil: "networkidle2", timeout: 45000 });
    await new Promise(r => setTimeout(r, 4000));

    // 1. Click "Links" on the left menu
    console.log("Clicking 'Links' on the left...");
    const linksFound = await page.$$("span, a, div");
    for (const el of linksFound) {
      const txt = await page.evaluate(e => (e.innerText || "").trim(), el);
      if (txt === "Links") {
        const box = await el.boundingBox();
        if (box && box.width > 0 && box.height > 0) {
          await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
          break;
        }
      }
    }
    await new Promise(r => setTimeout(r, 3000));

    // 2. Click "Websites, blogs, portfolios"
    console.log("Clicking 'Websites, blogs, portfolios'...");
    const websiteItems = await page.$$("span, div");
    for (const el of websiteItems) {
      const txt = await page.evaluate(e => (e.innerText || "").trim(), el);
      if (txt.includes("Websites, blogs, portfolios")) {
        const box = await el.boundingBox();
        if (box && box.width > 0 && box.height > 0) {
          console.log("Found Websites box:", box);
          await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
          break;
        }
      }
    }
    await new Promise(r => setTimeout(r, 3000));

    const shot1 = path.join(OUTPUT_DIR, "fb_links_form_opened.png");
    await page.screenshot({ path: shot1 });
    console.log("Saved screenshot:", shot1);

    // Check inputs on page
    const inputs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("input, textarea")).map(i => ({
        tag: i.tagName,
        placeholder: i.placeholder,
        value: i.value,
        ariaLabel: i.getAttribute("aria-label"),
        name: i.name
      }));
    });
    console.log("Inputs found on Links form:", JSON.stringify(inputs, null, 2));

  } finally {
    await browser.close();
  }
}

addWebsiteAndDetails().catch(console.error);
