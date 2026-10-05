const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function executeClean2FA(code) {
  console.log(`🦅 [GARUDA FB 2FA] Executing clean flow with code ${code}...`);
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

    console.log("1. Navigating to Name editor...");
    await page.goto("https://accountscenter.facebook.com/profiles/100036397273872/name/?entrypoint=fb_account_center", {
      waitUntil: "networkidle2",
      timeout: 45000
    });
    await new Promise(r => setTimeout(r, 3000));

    // Fill "Garuda" & "OS" cleanly
    const inputs = await page.$$("input");
    console.log(`Found ${inputs.length} inputs on page.`);

    if (inputs.length >= 3) {
      // First Name
      await inputs[0].click({ clickCount: 3 });
      await page.keyboard.down("Control");
      await page.keyboard.press("A");
      await page.keyboard.up("Control");
      await page.keyboard.press("Backspace");
      await page.evaluate(el => { el.value = ""; }, inputs[0]);
      await inputs[0].type("Garuda", { delay: 30 });

      // Last Name
      await inputs[2].click({ clickCount: 3 });
      await page.keyboard.down("Control");
      await page.keyboard.press("A");
      await page.keyboard.up("Control");
      await page.keyboard.press("Backspace");
      await page.evaluate(el => { el.value = ""; }, inputs[2]);
      await inputs[2].type("OS", { delay: 30 });

      await new Promise(r => setTimeout(r, 1000));

      const inputValues = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("input")).map(i => i.value);
      });
      console.log("Verified input values before review:", inputValues);

      // Click "Review change"
      console.log("2. Clicking 'Review change'...");
      const btns = await page.$$("div[role='button'], button");
      for (const b of btns) {
        const txt = await page.evaluate(el => el.innerText, b);
        if (txt && txt.includes("Review change")) {
          await b.click();
          break;
        }
      }

      await new Promise(r => setTimeout(r, 3500));

      // Click "Done"
      console.log("3. Clicking 'Done'...");
      const doneBtns = await page.$$("div[role='button'], button");
      for (const b of doneBtns) {
        const txt = await page.evaluate(el => el.innerText, b);
        if (txt && txt.trim() === "Done") {
          await b.click();
          break;
        }
      }

      console.log("4. Waiting for 2FA / WhatsApp modal to appear...");
      try {
        await page.waitForFunction(() => {
          return document.body.innerText.includes("Check your WhatsApp messages") ||
                 document.body.innerText.includes("Enter the code") ||
                 document.body.innerText.includes("Two Step Verification");
        }, { timeout: 15000 });
        console.log("✔ 2FA Modal detected on screen!");
      } catch (e) {
        console.log("⚠ Wait for 2FA modal timed out, checking DOM directly...");
      }

      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(OUTPUT_DIR, "fb_2fa_modal_present.png") });

      // Find the code input inside the dialog
      console.log("5. Locating 2FA Code input box...");
      const dialogInputs = await page.$$("div[role='dialog'] input");
      console.log(`Found ${dialogInputs.length} inputs inside dialog.`);

      let codeInputHandle = null;
      if (dialogInputs.length > 0) {
        codeInputHandle = dialogInputs[dialogInputs.length - 1]; // usually the single or last input
      } else {
        const allInputs = await page.$$("input");
        codeInputHandle = allInputs[allInputs.length - 1];
      }

      if (codeInputHandle) {
        const box = await codeInputHandle.boundingBox();
        console.log("Code input bounding box:", box);
        if (box) {
          await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
          await new Promise(r => setTimeout(r, 500));
        } else {
          await codeInputHandle.focus();
        }

        console.log(`6. Typing code '${code}'...`);
        await page.keyboard.type(code.toString().trim(), { delay: 60 });
        await new Promise(r => setTimeout(r, 1500));

        await page.screenshot({ path: path.join(OUTPUT_DIR, "fb_2fa_code_entered.png") });
        console.log("Saved fb_2fa_code_entered.png screenshot!");

        // Click Continue
        console.log("7. Clicking 'Continue' button...");
        const continueBtnClicked = await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll("div[role='button'], button"));
          for (const b of btns) {
            const txt = (b.innerText || "").trim();
            if (txt === "Continue" && !b.disabled) {
              b.click();
              return true;
            }
          }
          return false;
        });
        console.log("Clicked Continue?", continueBtnClicked);

        console.log("8. Waiting 10 seconds for submission & confirmation...");
        await new Promise(r => setTimeout(r, 10000));

        const postContinueShot = path.join(OUTPUT_DIR, "fb_2fa_post_continue_result.png");
        await page.screenshot({ path: postContinueShot });
        console.log("Saved post continue screenshot:", postContinueShot);

        // Check if name is updated on Accounts Center
        const finalTexts = await page.evaluate(() => {
          return Array.from(document.querySelectorAll("span, h1, h2, h3, p"))
            .map(e => (e.innerText || "").trim())
            .filter(t => t.length > 0 && t.length < 80);
        });
        console.log("Screen texts after 2FA submission:", Array.from(new Set(finalTexts)).slice(0, 30));
      } else {
        console.log("Could not find code input handle!");
      }
    }

  } finally {
    await browser.close();
  }
}

const inputCode = process.argv[2] || "042678";
executeClean2FA(inputCode).catch(console.error);
