const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function changeFacebookName() {
  console.log("🦅 [GARUDA FB NAME CHANGER] Starting Facebook Name Change to 'Praveen Mahawar'...");
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

    // Navigate directly to the profile modal URL or profiles page
    console.log("1. Navigating to https://accountscenter.facebook.com/profiles/100036397273872 ...");
    await page.goto("https://accountscenter.facebook.com/profiles/100036397273872", { waitUntil: "networkidle2", timeout: 45000 });
    await new Promise(r => setTimeout(r, 4000));

    // Check if "Name" button is visible
    console.log("2. Clicking 'Name' row...");
    const clickedName = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll("div[role='button'], span, div, a"));
      for (const el of elements) {
        if ((el.innerText || "").trim() === "Name") {
          let clickable = el;
          while (clickable && clickable.getAttribute("role") !== "button" && clickable.tagName !== "A" && clickable.parentElement) {
            if (clickable.getAttribute("role") === "button") break;
            clickable = clickable.parentElement;
          }
          if (clickable) {
            clickable.click();
            return true;
          }
          el.click();
          return true;
        }
      }
      return false;
    });

    console.log("Clicked Name option:", clickedName);
    await new Promise(r => setTimeout(r, 4000));

    const nameScreenShot = path.join(OUTPUT_DIR, "fb_name_change_form.png");
    await page.screenshot({ path: nameScreenShot });
    console.log("Saved name change form screenshot:", nameScreenShot);

    // Inspect inputs on the page
    const inputs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("input")).map(inp => ({
        name: inp.name,
        placeholder: inp.placeholder,
        value: inp.value,
        ariaLabel: inp.getAttribute("aria-label"),
        id: inp.id,
        type: inp.type
      }));
    });
    console.log("Inputs found on Name form:", JSON.stringify(inputs, null, 2));

    // Print all buttons on page
    const buttons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("div[role='button'], button, span"))
        .map(b => (b.innerText || "").trim())
        .filter(t => t.length > 0 && t.length < 40);
    });
    console.log("Buttons / Actions visible:", Array.from(new Set(buttons)).slice(0, 25));

  } finally {
    await browser.close();
  }
}

changeFacebookName().catch(console.error);
