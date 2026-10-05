const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function executeNameChange() {
  console.log("🦅 [GARUDA FB NAME CHANGER] Setting Facebook Name to 'Praveen Mahawar'...");
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

    console.log("Navigating to Name Editor URL...");
    await page.goto("https://accountscenter.facebook.com/profiles/100036397273872/name/?entrypoint=fb_account_center", {
      waitUntil: "networkidle2",
      timeout: 45000
    });
    await new Promise(r => setTimeout(r, 4000));

    // Get input elements
    const inputs = await page.$$("input");
    console.log(`Found ${inputs.length} inputs.`);

    if (inputs.length >= 2) {
      // First input is First Name ("Pyaari")
      console.log("Filling First Name: Praveen...");
      const firstInput = inputs[0];
      await firstInput.click({ clickCount: 3 });
      await page.keyboard.press("Backspace");
      // Double check clear
      await page.keyboard.down("Control");
      await page.keyboard.press("A");
      await page.keyboard.up("Control");
      await page.keyboard.press("Backspace");
      await firstInput.type("Praveen", { delay: 30 });

      // Third input is Last Name ("Pyaara")
      // In the array of 3 inputs (First, Middle, Last), index 0 is First, index 1 is Middle, index 2 is Last
      const lastInput = inputs.length >= 3 ? inputs[2] : inputs[1];
      console.log("Filling Last Name: Mahawar...");
      await lastInput.click({ clickCount: 3 });
      await page.keyboard.press("Backspace");
      await page.keyboard.down("Control");
      await page.keyboard.press("A");
      await page.keyboard.up("Control");
      await page.keyboard.press("Backspace");
      await lastInput.type("Mahawar", { delay: 30 });

      await new Promise(r => setTimeout(r, 2000));
      const filledScreenshot = path.join(OUTPUT_DIR, "fb_name_inputs_filled.png");
      await page.screenshot({ path: filledScreenshot });
      console.log("Saved filled screenshot:", filledScreenshot);

      // Click "Review change" button
      console.log("Finding 'Review change' button...");
      const reviewBtn = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("div[role='button'], button"));
        for (const b of btns) {
          if ((b.innerText || "").includes("Review change")) {
            b.scrollIntoView({ behavior: "instant", block: "center" });
            b.click();
            return true;
          }
        }
        return false;
      });
      console.log("Clicked 'Review change' button?", reviewBtn);

      await new Promise(r => setTimeout(r, 5000));

      const reviewScreenshot = path.join(OUTPUT_DIR, "fb_name_review_screen.png");
      await page.screenshot({ path: reviewScreenshot });
      console.log("Saved review change screen screenshot:", reviewScreenshot);

      const visibleTexts = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("span, div[role='button'], button, h1, h2, h3, label"))
          .map(e => (e.innerText || "").trim())
          .filter(t => t.length > 0 && t.length < 70);
      });
      console.log("Visible texts on Review Screen:", Array.from(new Set(visibleTexts)).slice(0, 35));

      // Check if there is a "Save changes" button
      const saveBtnFound = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("div[role='button'], button"));
        for (const b of btns) {
          const txt = (b.innerText || "").trim();
          if (txt === "Save changes" || txt === "Done") {
            b.click();
            return txt;
          }
        }
        return null;
      });

      if (saveBtnFound) {
        console.log(`Clicked '${saveBtnFound}' button!`);
        await new Promise(r => setTimeout(r, 6000));

        const finalSavedScreenshot = path.join(OUTPUT_DIR, "fb_name_change_final_saved.png");
        await page.screenshot({ path: finalSavedScreenshot });
        console.log("Saved final confirmation screenshot:", finalSavedScreenshot);
      } else {
        console.log("No direct 'Save changes' button auto-clicked; inspect review screen first.");
      }
    } else {
      console.error("Not enough input fields found!");
    }

  } finally {
    await browser.close();
  }
}

executeNameChange().catch(console.error);
