const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function testCommentFlow() {
  const cookieVal = process.env.LINKEDIN_LI_AT;
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,900"]
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  await page.setCookie({
    name: "li_at",
    value: cookieVal,
    domain: ".linkedin.com",
    path: "/",
    httpOnly: true,
    secure: true
  });

  const searchUrl = "https://www.linkedin.com/search/results/content/?keywords=enterprise%20AI%20architecture%20bangalore&origin=GLOBAL_SEARCH_HEADER";
  console.log("▶ Navigating to LinkedIn Search...");
  await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await new Promise(r => setTimeout(r, 6000));

  // Find comment buttons
  const buttons = await page.$$('button[aria-label="Comment"]');
  console.log(`Found ${buttons.length} comment buttons`);

  if (buttons.length >= 2) {
    // Click the second post (Shwetha Ananth - L&T Gen AI Architect Bangalore)
    console.log("▶ Clicking Comment button for Post 2 (Gen AI Architects Bangalore)...");
    await buttons[1].click();
    await new Promise(r => setTimeout(r, 3000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, "trojan_comment_box_open.png") });
    console.log("✔ Screenshot saved: trojan_comment_box_open.png");

    // Inspect open comment box elements
    const inputs = await page.evaluate(() => {
      const editables = Array.from(document.querySelectorAll('[contenteditable="true"], [role="textbox"], textarea'));
      return editables.map(el => ({
        tag: el.tagName,
        role: el.getAttribute("role"),
        ariaLabel: el.getAttribute("aria-label"),
        className: el.className,
        placeholder: el.getAttribute("placeholder") || el.getAttribute("data-placeholder")
      }));
    });

    console.log("Found Input / Comment Box Elements:", JSON.stringify(inputs, null, 2));
  }

  await browser.close();
}

testCommentFlow().catch(console.error);
