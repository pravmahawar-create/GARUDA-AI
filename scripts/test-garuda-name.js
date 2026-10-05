const puppeteer = require("puppeteer");
require("dotenv").config();

async function testNameOptions() {
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
      if (res.url().includes("graphql")) {
        try {
          const text = await res.text();
          if (text.includes("validate_name")) {
            console.log("Validation Result:", text);
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

    // Test: First Name = "Garuda", Last Name = "OS"
    const inputs = await page.$$("input");
    if (inputs.length >= 3) {
      console.log("Testing First: Garuda, Last: OS...");
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

      await new Promise(r => setTimeout(r, 4000));
      await page.screenshot({ path: "output/fb_test_garuda_os_validation.png" });

      const texts = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("span, div[role='dialog'], p, h2"))
          .map(e => (e.innerText || "").trim())
          .filter(t => t.length > 0 && t.length < 100);
      });
      console.log("Texts on screen after Review change for 'Garuda OS':", texts.slice(0, 25));
    }

  } finally {
    await browser.close();
  }
}

testNameOptions().catch(console.error);
