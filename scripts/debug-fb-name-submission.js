const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function debugNameSubmission() {
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

    page.on("response", async res => {
      const url = res.url();
      if (url.includes("graphql") || url.includes("async")) {
        try {
          const text = await res.text();
          if (text.includes("error") || text.includes("password") || text.includes("Praveen") || text.includes("challenge")) {
            console.log("GraphQL/Async match in response:", text.slice(0, 400));
          }
        } catch (e) {}
      }
    });

    console.log("Navigating to Name editor URL...");
    await page.goto("https://accountscenter.facebook.com/profiles/100036397273872/name/?entrypoint=fb_account_center", {
      waitUntil: "networkidle2",
      timeout: 45000
    });
    await new Promise(r => setTimeout(r, 3000));

    const inputs = await page.$$("input");
    console.log(`Found ${inputs.length} inputs.`);

    if (inputs.length >= 3) {
      await inputs[0].click({ clickCount: 3 });
      await page.keyboard.press("Backspace");
      await page.keyboard.down("Control");
      await page.keyboard.press("A");
      await page.keyboard.up("Control");
      await page.keyboard.press("Backspace");
      await inputs[0].type("Praveen", { delay: 30 });

      await inputs[2].click({ clickCount: 3 });
      await page.keyboard.press("Backspace");
      await page.keyboard.down("Control");
      await page.keyboard.press("A");
      await page.keyboard.up("Control");
      await page.keyboard.press("Backspace");
      await inputs[2].type("Mahawar", { delay: 30 });

      await new Promise(r => setTimeout(r, 1000));

      console.log("Clicking 'Review change'...");
      const btns = await page.$$("div[role='button'], button");
      for (const b of btns) {
        const txt = await page.evaluate(el => el.innerText, b);
        if (txt && txt.includes("Review change")) {
          await b.click();
          break;
        }
      }

      await new Promise(r => setTimeout(r, 4000));

      console.log("Clicking 'Done'...");
      const doneBtns = await page.$$("div[role='button'], button");
      for (const b of doneBtns) {
        const txt = await page.evaluate(el => el.innerText, b);
        if (txt && txt.trim() === "Done") {
          await b.click();
          break;
        }
      }

      console.log("Waiting 10 seconds for completion or secondary modal...");
      await new Promise(r => setTimeout(r, 10000));

      const screenshotPath = path.join(OUTPUT_DIR, "fb_name_change_debug_after_10s.png");
      await page.screenshot({ path: screenshotPath });
      console.log("Saved debug screenshot:", screenshotPath);

      const pageTexts = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("div[role='dialog'], span, h1, h2, h3, p"))
          .map(e => (e.innerText || "").trim())
          .filter(t => t.length > 0 && t.length < 100);
      });
      console.log("Page texts:", Array.from(new Set(pageTexts)).slice(0, 30));
    }

  } finally {
    await browser.close();
  }
}

debugNameSubmission().catch(console.error);
