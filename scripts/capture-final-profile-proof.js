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

  const profileUrl = "https://www.linkedin.com/in/garuda-ai-ai-operating-system-227168432/";
  console.log("Navigating to profile:", profileUrl);
  await page.goto(profileUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await new Promise(r => setTimeout(r, 6000));

  // Dismiss any overlays if present
  await page.evaluate(() => {
    document.querySelectorAll("button[aria-label='Dismiss'], button[data-test-modal-close-btn], .artdeco-modal__dismiss").forEach(b => b.click());
  });
  await new Promise(r => setTimeout(r, 1000));

  const fullProofShot = path.join(__dirname, "..", "output", "linkedin_profile_final_live.png");
  await page.screenshot({ path: fullProofShot, fullPage: true });
  console.log("Saved full profile proof:", fullProofShot);

  const topCardShot = path.join(__dirname, "..", "output", "linkedin_top_card_live.png");
  await page.screenshot({ path: topCardShot });
  console.log("Saved viewport proof:", topCardShot);

  const cardDetails = await page.evaluate(() => {
    const headline = document.querySelector(".text-body-medium") || document.querySelector("div[data-generated-suggestion-target]");
    return {
      title: document.title,
      text: document.body.innerText.substring(0, 500)
    };
  });
  console.log("PAGE SUMMARY:", cardDetails.title);

  await browser.close();
  console.log("DONE!");
})().catch(console.error);
