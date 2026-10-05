const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function inspectProfile() {
  const cookieVal = process.env.LINKEDIN_LI_AT;
  if (!cookieVal) throw new Error("Missing LINKEDIN_LI_AT");

  console.log("🦅 Inspecting Founder Praveen's current LinkedIn profile...");
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
    path: "/"
  });

  // Navigate to Me / Profile
  await page.goto("https://www.linkedin.com/in/me/", { waitUntil: "domcontentloaded", timeout: 45000 });
  await new Promise(r => setTimeout(r, 6000));

  const currentUrl = page.url();
  console.log("Profile URL:", currentUrl);

  const screenshotPath = path.join(OUTPUT_DIR, "current_linkedin_profile.png");
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log("✔ Screenshot saved:", screenshotPath);

  // Extract current profile elements
  const profileDetails = await page.evaluate(() => {
    const nameEl = document.querySelector("h1");
    const headlineEl = document.querySelector(".text-body-medium");
    const locationEl = document.querySelector(".text-body-small.inline.t-black--light.break-words");
    const aboutEl = document.querySelector("#about ~ .display-flex .inline-show-more-text, section[data-section='summary']");

    return {
      name: nameEl ? nameEl.innerText.trim() : "N/A",
      headline: headlineEl ? headlineEl.innerText.trim() : "N/A",
      location: locationEl ? locationEl.innerText.trim() : "N/A",
      about: aboutEl ? aboutEl.innerText.trim() : "N/A"
    };
  });

  console.log("Current Profile Data:", JSON.stringify(profileDetails, null, 2));
  await browser.close();
}

inspectProfile().catch(console.error);
