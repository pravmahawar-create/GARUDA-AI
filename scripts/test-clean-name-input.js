const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function clearAndType(page, input, text) {
  await input.click();
  // Select all via shortcut
  await page.keyboard.down("Control");
  await page.keyboard.press("A");
  await page.keyboard.up("Control");
  await page.keyboard.press("Backspace");

  // Check if anything remains and delete char by char
  let remaining = await page.evaluate(el => el.value, input);
  if (remaining && remaining.length > 0) {
    for (let i = 0; i < remaining.length + 5; i++) {
      await page.keyboard.press("Backspace");
      await page.keyboard.press("Delete");
    }
  }

  // Type the desired text
  await input.type(text, { delay: 35 });
  await new Promise(r => setTimeout(r, 300));
}

async function testCleanName() {
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

    console.log("Navigating to Name editor URL...");
    await page.goto("https://accountscenter.facebook.com/profiles/100036397273872/name/?entrypoint=fb_account_center", {
      waitUntil: "networkidle2",
      timeout: 45000
    });
    await new Promise(r => setTimeout(r, 3000));

    const inputs = await page.$$("input");
    console.log(`Found ${inputs.length} inputs.`);

    if (inputs.length >= 3) {
      // First Name: Garuda
      console.log("Entering First Name: Garuda...");
      await clearAndType(page, inputs[0], "Garuda");

      // Last Name: Os
      console.log("Entering Last Name: Os...");
      await clearAndType(page, inputs[2], "Os");

      await new Promise(r => setTimeout(r, 1000));

      const vals = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("input")).map(i => i.value);
      });
      console.log("Actual input values:", vals);

      await page.screenshot({ path: path.join(OUTPUT_DIR, "fb_test_clean_garuda_os_inputs.png") });

      // Click "Review change"
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
      await page.screenshot({ path: path.join(OUTPUT_DIR, "fb_test_clean_garuda_os_review.png") });

      const dialogText = await page.evaluate(() => {
        const d = document.querySelector("div[role='dialog']");
        return d ? d.innerText : document.body.innerText;
      });
      console.log("Dialog text after Review change:", dialogText);
    }

  } finally {
    await browser.close();
  }
}

testCleanName().catch(console.error);
