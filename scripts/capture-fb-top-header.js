const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--window-size=1440,900"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.setCookie(
    { name: "c_user", value: process.env.FB_C_USER.trim(), domain: ".facebook.com", path: "/", secure: true },
    { name: "xs", value: process.env.FB_XS.trim(), domain: ".facebook.com", path: "/", httpOnly: true, secure: true }
  );

  await page.goto("https://www.facebook.com/me", { waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 6000));

  await page.screenshot({ path: path.join(__dirname, "..", "output", "facebook_profile_header_live_proof.png") });
  console.log("Saved top header screenshot!");
  await browser.close();
})();
