const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function submitWhatsAppCode(code) {
  if (!code) {
    console.error("❌ Please provide the 6-digit WhatsApp code as argument: node submit-fb-whatsapp-code.js 123456");
    process.exit(1);
  }

  console.log(`🦅 [GARUDA FB 2FA] Injecting code '${code}' for 'Garuda OS' name change...`);
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

    await page.goto("https://accountscenter.facebook.com/profiles/100036397273872/name/?entrypoint=fb_account_center", {
      waitUntil: "networkidle2",
      timeout: 45000
    });
    await new Promise(r => setTimeout(r, 3000));

    // Fill "Garuda" & "OS"
    const inputs = await page.$$("input");
    if (inputs.length >= 3) {
      await inputs[0].click({ clickCount: 3 });
      await page.keyboard.press("Backspace");
      await page.keyboard.down("Control");
      await page.keyboard.press("A");
      await page.keyboard.up("Control");
      await page.keyboard.press("Backspace");
      await inputs[0].type("Garuda", { delay: 20 });

      await inputs[2].click({ clickCount: 3 });
      await page.keyboard.press("Backspace");
      await page.keyboard.down("Control");
      await page.keyboard.press("A");
      await page.keyboard.up("Control");
      await page.keyboard.press("Backspace");
      await inputs[2].type("OS", { delay: 20 });

      await new Promise(r => setTimeout(r, 1000));

      const btns = await page.$$("div[role='button'], button");
      for (const b of btns) {
        const txt = await page.evaluate(el => el.innerText, b);
        if (txt && txt.includes("Review change")) {
          await b.click();
          break;
        }
      }
      await new Promise(r => setTimeout(r, 3500));

      const doneBtns = await page.$$("div[role='button'], button");
      for (const b of doneBtns) {
        const txt = await page.evaluate(el => el.innerText, b);
        if (txt && txt.trim() === "Done") {
          await b.click();
          break;
        }
      }
      await new Promise(r => setTimeout(r, 5000));
    }

    // Now look for 2FA Code input
    console.log("Looking for 2FA Code input...");
    const codeInput = await page.evaluate(() => {
      const allInputs = Array.from(document.querySelectorAll("input"));
      for (const inp of allInputs) {
        if (inp.placeholder === "Code" || (inp.name || "").includes("code") || inp.getAttribute("aria-label") === "Code") {
          inp.focus();
          return true;
        }
      }
      // fallback to last visible text input
      const visible = allInputs.filter(i => i.type !== "hidden");
      if (visible.length > 0) {
        visible[visible.length - 1].focus();
        return true;
      }
      return false;
    });

    if (codeInput) {
      console.log(`Typing code ${code}...`);
      await page.keyboard.type(code.toString().trim(), { delay: 40 });
      await new Promise(r => setTimeout(r, 1500));

      // Click "Continue" button
      console.log("Clicking 'Continue'...");
      const continueClicked = await page.evaluate(() => {
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
      console.log("Clicked Continue?", continueClicked);

      console.log("Waiting 8 seconds for confirmation...");
      await new Promise(r => setTimeout(r, 8000));

      const finalShot = path.join(OUTPUT_DIR, "fb_name_change_garuda_os_success.png");
      await page.screenshot({ path: finalShot });
      console.log("Saved success confirmation screenshot:", finalShot);

      // Verify on main Facebook profile
      await page.goto("https://www.facebook.com/me", { waitUntil: "networkidle2", timeout: 45000 });
      await new Promise(r => setTimeout(r, 5000));

      const profileShot = path.join(OUTPUT_DIR, "fb_profile_garuda_os_live.png");
      await page.screenshot({ path: profileShot });
      console.log("Saved live profile screenshot:", profileShot);
    } else {
      console.log("Could not find 2FA code input on screen.");
    }

  } finally {
    await browser.close();
  }
}

const inputCode = process.argv[2];
submitWhatsAppCode(inputCode).catch(console.error);
