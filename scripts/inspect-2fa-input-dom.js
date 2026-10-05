const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

async function inspect2faInputDom() {
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

    console.log("Navigating to Name settings...");
    await page.goto("https://accountscenter.facebook.com/profiles/100036397273872/name/?entrypoint=fb_account_center", {
      waitUntil: "networkidle2",
      timeout: 45000
    });
    await new Promise(r => setTimeout(r, 3000));

    const inputs = await page.$$("input");
    if (inputs.length >= 3) {
      await inputs[0].click({ clickCount: 3 });
      await page.keyboard.press("Backspace");
      await inputs[0].type("Garuda");

      await inputs[2].click({ clickCount: 3 });
      await page.keyboard.press("Backspace");
      await inputs[2].type("OS");

      await new Promise(r => setTimeout(r, 500));

      const btns = await page.$$("div[role='button'], button");
      for (const b of btns) {
        const txt = await page.evaluate(el => el.innerText, b);
        if (txt && txt.includes("Review change")) {
          await b.click();
          break;
        }
      }
      await new Promise(r => setTimeout(r, 3000));

      const doneBtns = await page.$$("div[role='button'], button");
      for (const b of doneBtns) {
        const txt = await page.evaluate(el => el.innerText, b);
        if (txt && txt.trim() === "Done") {
          await b.click();
          break;
        }
      }
      await new Promise(r => setTimeout(r, 4000));

      // Inspect elements inside dialog
      const elementsInDialog = await page.evaluate(() => {
        const dialog = document.querySelector("div[role='dialog']");
        if (!dialog) return { error: "No dialog found" };

        const all = Array.from(dialog.querySelectorAll("*"));
        const inputs = all.filter(e => e.tagName === "INPUT" || e.tagName === "TEXTAREA" || e.getAttribute("contenteditable") === "true");
        return {
          dialogText: dialog.innerText,
          inputs: inputs.map(i => ({
            tag: i.tagName,
            type: i.type,
            name: i.name,
            placeholder: i.placeholder,
            value: i.value,
            id: i.id,
            className: i.className,
            rect: i.getBoundingClientRect()
          }))
        };
      });

      console.log("Dialog inspection:", JSON.stringify(elementsInDialog, null, 2));

      // If input found, click via coordinates and type code
      if (elementsInDialog.inputs && elementsInDialog.inputs.length > 0) {
        const targetInput = elementsInDialog.inputs[0];
        const cx = targetInput.rect.x + targetInput.rect.width / 2;
        const cy = targetInput.rect.y + targetInput.rect.height / 2;
        console.log(`Clicking input via mouse at (${cx}, ${cy})...`);
        await page.mouse.click(cx, cy);
        await new Promise(r => setTimeout(r, 500));

        console.log("Typing 042678...");
        await page.keyboard.type("042678", { delay: 50 });
        await new Promise(r => setTimeout(r, 1000));

        await page.screenshot({ path: path.join(__dirname, "..", "output", "fb_code_typed_proof.png") });
        console.log("Saved screenshot fb_code_typed_proof.png");

        // Click Continue
        console.log("Clicking Continue button...");
        const clickedContinue = await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll("div[role='button'], button"));
          for (const b of btns) {
            if ((b.innerText || "").trim() === "Continue") {
              b.click();
              return true;
            }
          }
          return false;
        });
        console.log("Clicked Continue?", clickedContinue);

        await new Promise(r => setTimeout(r, 8000));

        const finalShot = path.join(__dirname, "..", "output", "fb_after_2fa_continue.png");
        await page.screenshot({ path: finalShot });
        console.log("Saved post-continue screenshot:", finalShot);

        const pageTexts = await page.evaluate(() => {
          return Array.from(document.querySelectorAll("div[role='dialog'], span, h1, h2, h3, p"))
            .map(e => (e.innerText || "").trim())
            .filter(t => t.length > 0 && t.length < 80);
        });
        console.log("Page texts after continue:", Array.from(new Set(pageTexts)).slice(0, 25));
      }
    }

  } finally {
    await browser.close();
  }
}

inspect2faInputDom().catch(console.error);
