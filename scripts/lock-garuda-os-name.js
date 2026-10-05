const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function clearAndType(page, input, text) {
  await input.click();
  await page.keyboard.down("Control");
  await page.keyboard.press("A");
  await page.keyboard.up("Control");
  await page.keyboard.press("Backspace");

  let remaining = await page.evaluate(el => el.value, input);
  if (remaining && remaining.length > 0) {
    for (let i = 0; i < remaining.length + 5; i++) {
      await page.keyboard.press("Backspace");
      await page.keyboard.press("Delete");
    }
  }

  await input.type(text, { delay: 25 });
}

async function lockGarudaOsName(code) {
  console.log(`🦅 [LOCK GARUDA OS] Applying 2FA code '${code}' at exact coordinates (720, 431)...`);
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

    console.log("1. Navigating to Name editor URL...");
    await page.goto("https://accountscenter.facebook.com/profiles/100036397273872/name/?entrypoint=fb_account_center", {
      waitUntil: "networkidle2",
      timeout: 45000
    });
    await new Promise(r => setTimeout(r, 3000));

    const inputs = await page.$$("input");
    if (inputs.length >= 3) {
      await clearAndType(page, inputs[0], "Garuda");
      await clearAndType(page, inputs[2], "Os");
      await new Promise(r => setTimeout(r, 800));

      // Click "Review change"
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
      const doneBtns = await page.$$("div[role='button'], button");
      for (const b of doneBtns) {
        const txt = await page.evaluate(el => el.innerText, b);
        if (txt && txt.trim() === "Done") {
          await b.click();
          break;
        }
      }
      console.log("2. Waiting 5s for 2FA screen...");
      await new Promise(r => setTimeout(r, 5000));

      // Click the exact input box at (720, 431)
      console.log(`3. Clicking exact input at (720, 431)...`);
      await page.mouse.click(720, 431);
      await new Promise(r => setTimeout(r, 500));

      // Type code
      console.log(`4. Typing code '${code}'...`);
      await page.keyboard.type(code.toString().trim(), { delay: 60 });
      await new Promise(r => setTimeout(r, 1000));

      const typedShot = path.join(OUTPUT_DIR, "fb_exact_code_typed.png");
      await page.screenshot({ path: typedShot });
      console.log("Saved screenshot:", typedShot);

      // Click Continue
      console.log("5. Clicking 'Continue' button...");
      const continueClicked = await page.evaluate(() => {
        const allBtns = Array.from(document.querySelectorAll("div[role='button'], button"));
        for (const b of allBtns) {
          if ((b.innerText || "").trim() === "Continue") {
            b.click();
            return true;
          }
        }
        return false;
      });
      console.log("Clicked Continue?", continueClicked);

      // Wait 12 seconds for Meta to process the 2FA code
      console.log("6. Waiting 12s for Meta confirmation...");
      await new Promise(r => setTimeout(r, 12000));

      const successShot = path.join(OUTPUT_DIR, "fb_garuda_os_locked_proof.png");
      await page.screenshot({ path: successShot });
      console.log("Saved final confirmation:", successShot);

      // Check current accounts center profiles
      await page.goto("https://accountscenter.facebook.com/profiles", { waitUntil: "networkidle2", timeout: 45000 });
      await new Promise(r => setTimeout(r, 4000));

      const acProfilesShot = path.join(OUTPUT_DIR, "fb_accounts_center_garuda_os_live.png");
      await page.screenshot({ path: acProfilesShot });
      console.log("Saved Accounts Center profiles screenshot:", acProfilesShot);
    }

  } finally {
    await browser.close();
  }
}

const code = process.argv[2] || "042678";
lockGarudaOsName(code).catch(console.error);
