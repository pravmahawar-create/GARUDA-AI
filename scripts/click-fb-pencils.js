const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function clickFloatingPencilAndPersonalDetails() {
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

    await page.goto("https://www.facebook.com/me", { waitUntil: "networkidle2", timeout: 45000 });
    await new Promise(r => setTimeout(r, 4000));

    // Scroll down to reveal personal details
    await page.evaluate(() => window.scrollBy(0, 450));
    await new Promise(r => setTimeout(r, 2000));

    // Click the pencil next to Personal details
    console.log("Clicking pencil next to Personal details...");
    const clickedPencil = await page.evaluate(() => {
      const personalDetailsHeader = Array.from(document.querySelectorAll("span, div")).find(el => (el.innerText || "").trim() === "Personal details");
      if (personalDetailsHeader) {
        let parent = personalDetailsHeader.parentElement;
        while (parent && !parent.querySelector("div[role='button'], i, svg")) {
          parent = parent.parentElement;
        }
        if (parent) {
          const btn = parent.querySelector("div[role='button']");
          if (btn) {
            btn.click();
            return true;
          }
        }
      }
      return false;
    });

    console.log("Clicked Personal details pencil?", clickedPencil);
    await new Promise(r => setTimeout(r, 4000));

    const shot1 = path.join(OUTPUT_DIR, "fb_personal_details_clicked.png");
    await page.screenshot({ path: shot1 });
    console.log("Saved screenshot:", shot1);

    // Also check what the floating pencil at the bottom right does
    console.log("Clicking floating pencil at bottom right...");
    await page.mouse.click(1405, 860); // approx coords for floating bottom right button on 1440x900 viewport
    await new Promise(r => setTimeout(r, 3000));

    const shot2 = path.join(OUTPUT_DIR, "fb_floating_pencil_clicked.png");
    await page.screenshot({ path: shot2 });
    console.log("Saved floating pencil screenshot:", shot2);

  } finally {
    await browser.close();
  }
}

clickFloatingPencilAndPersonalDetails().catch(console.error);
