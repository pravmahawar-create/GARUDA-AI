const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function triggerGarudaOsNameChange() {
  console.log("🦅 [GARUDA FB NAME] Submitting 'Garuda OS' in Meta Accounts Center...");
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

      // Click Review change
      const btns = await page.$$("div[role='button'], button");
      for (const b of btns) {
        const txt = await page.evaluate(el => el.innerText, b);
        if (txt && txt.includes("Review change")) {
          await b.click();
          break;
        }
      }

      await new Promise(r => setTimeout(r, 3500));

      // Click Done
      console.log("Clicking 'Done' for Garuda OS...");
      const doneBtns = await page.$$("div[role='button'], button");
      for (const b of doneBtns) {
        const txt = await page.evaluate(el => el.innerText, b);
        if (txt && txt.trim() === "Done") {
          await b.click();
          break;
        }
      }

      console.log("Waiting 6 seconds for 2FA challenge response...");
      await new Promise(r => setTimeout(r, 6000));

      const shotPath = path.join(OUTPUT_DIR, "fb_garuda_os_2fa_triggered.png");
      await page.screenshot({ path: shotPath });
      console.log("Saved 2FA screenshot:", shotPath);

      const pageTexts = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("div[role='dialog'], span, h1, h2, h3, p"))
          .map(e => (e.innerText || "").trim())
          .filter(t => t.length > 0 && t.length < 100);
      });
      console.log("Page texts after Done:", Array.from(new Set(pageTexts)).slice(0, 25));
    }

  } finally {
    await browser.close();
  }
}

triggerGarudaOsNameChange().catch(console.error);
