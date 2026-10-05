const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function inspectLink() {
  const cookieVal = process.env.LINKEDIN_LI_AT;
  const targetUrl = "https://lnkd.in/p/dMG4vQGd";

  console.log("🦅 [GARUDA LINK INSPECTOR] Inspecting:", targetUrl);
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,900"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  if (cookieVal) {
    await page.setCookie({
      name: "li_at",
      value: cookieVal,
      domain: ".linkedin.com",
      path: "/"
    });
  }

  console.log("▶ Navigating...");
  const response = await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await new Promise(r => setTimeout(r, 6000));

  const finalUrl = page.url();
  console.log("✔ Final Redirected URL:", finalUrl);

  const title = await page.title();
  console.log("✔ Page Title:", title);

  const snapPath = path.join(OUTPUT_DIR, "inspect_lnkd_target.png");
  await page.screenshot({ path: snapPath, fullPage: false });
  console.log("✔ Screenshot saved to:", snapPath);

  const pageData = await page.evaluate(() => {
    // Extract main text or post/profile text
    const h1 = document.querySelector("h1")?.innerText || "";
    const h2 = document.querySelector("h2")?.innerText || "";
    const bodyText = document.body?.innerText?.slice(0, 3000) || "";
    return { h1, h2, bodyText };
  });

  fs.writeFileSync(path.join(OUTPUT_DIR, "inspect_lnkd_data.json"), JSON.stringify({ finalUrl, title, pageData }, null, 2));
  console.log("✔ Data written to inspect_lnkd_data.json");

  await browser.close();
}

inspectLink().catch(err => {
  console.error("❌ Error inspecting link:", err.message);
  process.exit(1);
});
