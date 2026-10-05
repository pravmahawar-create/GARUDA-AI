const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function testEditProfileDirect() {
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

    const editUrl = "https://www.facebook.com/profile.php?fb_profile_edit_entry_point=%7B%22click_point%22%3A%22edit_profile_button%22%2C%22feature%22%3A%22profile_header%22%7D&id=100036397273872&sk=about";
    console.log("Navigating directly to Edit Profile URL...");
    await page.goto(editUrl, { waitUntil: "networkidle2", timeout: 45000 });
    await new Promise(r => setTimeout(r, 5000));

    const shotPath = path.join(OUTPUT_DIR, "fb_edit_profile_direct_url.png");
    await page.screenshot({ path: shotPath });
    console.log("Saved direct edit profile screenshot:", shotPath);

    const dialogTexts = await page.evaluate(() => {
      const dialog = document.querySelector("div[role='dialog']");
      return dialog ? dialog.innerText : "No dialog";
    });
    console.log("Dialog content:", dialogTexts);

  } finally {
    await browser.close();
  }
}

testEditProfileDirect().catch(console.error);
