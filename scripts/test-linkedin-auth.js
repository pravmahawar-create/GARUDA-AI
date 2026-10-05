const puppeteer = require("puppeteer");
require("dotenv").config();

async function testLinkedIn() {
  const cookieVal = process.env.LINKEDIN_LI_AT;
  if (!cookieVal) {
    console.error("[-] LINKEDIN_LI_AT not found in .env");
    process.exit(1);
  }

  console.log("🔍 Testing LinkedIn authentication via li_at cookie...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Set cookies
    await page.setCookie(
      {
        name: "li_at",
        value: cookieVal,
        domain: ".linkedin.com",
        path: "/",
        httpOnly: true,
        secure: true
      },
      {
        name: "JSESSIONID",
        value: "\"ajax:9098750362\"",
        domain: ".www.linkedin.com",
        path: "/",
        secure: true
      },
      {
        name: "bcookie",
        value: "\"v=2&20260926-garuda\"",
        domain: ".linkedin.com",
        path: "/",
        secure: true
      }
    );

    console.log("▶ Navigating to https://www.linkedin.com/feed/...");
    await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded", timeout: 30000 });

    const currentUrl = page.url();
    console.log("Current URL after navigation:", currentUrl);

    if (currentUrl.includes("/feed") || currentUrl.includes("/in/")) {
      console.log("🎉 SUCCESS! LinkedIn session authenticated successfully!");
      
      // Extract profile name if visible
      const title = await page.title();
      console.log("Page Title:", title);
      
      return true;
    } else {
      console.log("⚠️ Redirected to login/challenge page:", currentUrl);
      return false;
    }
  } catch (err) {
    console.error("[-] Error during LinkedIn verification:", err.message);
    return false;
  } finally {
    await browser.close();
  }
}

testLinkedIn();
