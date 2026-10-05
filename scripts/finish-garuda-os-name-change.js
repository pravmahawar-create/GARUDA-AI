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

  await input.type(text, { delay: 30 });
}

async function finishGarudaOsNameChange(code) {
  console.log(`🦅 [GARUDA FB FINALIZE] Applying 'Garuda Os' with 2FA code '${code}'...`);
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
    console.log(`Found ${inputs.length} inputs.`);

    if (inputs.length >= 3) {
      console.log("Setting First Name: Garuda...");
      await clearAndType(page, inputs[0], "Garuda");

      console.log("Setting Last Name: Os...");
      await clearAndType(page, inputs[2], "Os");

      await new Promise(r => setTimeout(r, 1000));

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

      console.log("4. Waiting for 2FA screen...");
      await new Promise(r => setTimeout(r, 6000));

      await page.screenshot({ path: path.join(OUTPUT_DIR, "fb_step4_2fa_ready.png") });

      // Click coordinates for 2FA input box (x: 720, y: 480)
      console.log(`5. Clicking code input at (720, 480) and typing '${code}'...`);
      await page.mouse.click(720, 480);
      await new Promise(r => setTimeout(r, 500));
      await page.keyboard.type(code.toString().trim(), { delay: 50 });
      await new Promise(r => setTimeout(r, 1500));

      await page.screenshot({ path: path.join(OUTPUT_DIR, "fb_step5_code_typed.png") });
      console.log("Saved fb_step5_code_typed.png!");

      // Click "Continue" button at (720, 610)
      console.log("6. Clicking 'Continue' button...");
      // Try both mouse coordinate and DOM selector
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
      console.log("DOM Continue clicked?", continueClicked);
      if (!continueClicked) {
        await page.mouse.click(720, 610);
      }

      console.log("7. Waiting 10 seconds for confirmation...");
      await new Promise(r => setTimeout(r, 10000));

      const finalResultShot = path.join(OUTPUT_DIR, "fb_garuda_os_final_confirmed.png");
      await page.screenshot({ path: finalResultShot });
      console.log("Saved final confirmation screenshot:", finalResultShot);

      // Check current profile name
      console.log("8. Checking live Facebook profile...");
      await page.goto("https://www.facebook.com/me", { waitUntil: "networkidle2", timeout: 45000 });
      await new Promise(r => setTimeout(r, 5000));

      const liveProfileShot = path.join(OUTPUT_DIR, "fb_profile_garuda_os_live_final.png");
      await page.screenshot({ path: liveProfileShot });
      console.log("Saved live profile screenshot:", liveProfileShot);

      const title = await page.title();
      console.log("Live Profile Page Title:", title);
    }

  } finally {
    await browser.close();
  }
}

const code = process.argv[2] || "042678";
finishGarudaOsNameChange(code).catch(console.error);
