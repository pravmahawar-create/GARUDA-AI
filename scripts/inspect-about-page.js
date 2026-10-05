const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

async function inspectAboutPage() {
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

    const screenshotPath = path.join(__dirname, "..", "output", "fb_about_full_page.png");
    await page.screenshot({ path: screenshotPath });
    console.log("Saved screenshot:", screenshotPath);

    // Get all navigation links in the About tab left sidebar
    const aboutNav = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll("a, div[role='button']"));
      return links.map(l => ({ text: (l.innerText || "").trim(), href: l.href })).filter(x => x.text.length > 0 && x.text.length < 40);
    });
    console.log("About Navigation Links:", JSON.stringify(aboutNav.slice(0, 25), null, 2));

  } finally {
    await browser.close();
  }
}

inspectAboutPage().catch(console.error);
