const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

(async () => {
  const sessionId = process.env.INSTAGRAM_SESSION_ID;
  const userId = process.env.INSTAGRAM_USER_ID;
  console.log("Testing Instagram session: userId exists?", Boolean(userId), "sessionId exists?", Boolean(sessionId));

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,900"]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");

    if (sessionId && userId) {
      await page.setCookie(
        { name: "sessionid", value: sessionId, domain: ".instagram.com", path: "/" },
        { name: "ds_user_id", value: userId, domain: ".instagram.com", path: "/" }
      );
    }

    await page.goto("https://www.instagram.com/", { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise(r => setTimeout(r, 6000));

    const currentUrl = page.url();
    const pageTitle = await page.title();
    console.log("Current URL:", currentUrl);
    console.log("Page Title:", pageTitle);
    await page.screenshot({ path: "output/instagram_session_check.png" });
    console.log("Saved screenshot to output/instagram_session_check.png");

    const status = await page.evaluate(() => {
      const isLoginScreen = Boolean(document.querySelector("input[name='username']"));
      const hasDirect = Boolean(document.querySelector("a[href*='direct']"));
      const hasNav = Boolean(document.querySelector("nav, div[role='navigation']"));
      return { isLoginScreen, hasDirect, hasNav };
    });
    console.log("Instagram Status:", status);

  } finally {
    await browser.close();
  }
})();
