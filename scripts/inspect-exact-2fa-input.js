const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

async function inspectExact2faInput() {
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

    // Fill Garuda Os
    const inputs = await page.$$("input");
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
    await inputs[2].type("Os", { delay: 20 });

    await new Promise(r => setTimeout(r, 1000));

    // Review change
    const btns = await page.$$("div[role='button'], button");
    for (const b of btns) {
      const txt = await page.evaluate(el => el.innerText, b);
      if (txt && txt.includes("Review change")) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 3000));

    // Done
    const doneBtns = await page.$$("div[role='button'], button");
    for (const b of doneBtns) {
      const txt = await page.evaluate(el => el.innerText, b);
      if (txt && txt.trim() === "Done") {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 5000));

    // Now find what element is at (720, 480)
    const elementAtPoint = await page.evaluate(() => {
      const el = document.elementFromPoint(720, 480);
      let chain = [];
      let curr = el;
      for (let i = 0; i < 5; i++) {
        if (!curr) break;
        chain.push({
          tag: curr.tagName,
          id: curr.id,
          className: curr.className,
          contentEditable: curr.contentEditable,
          tabIndex: curr.tabIndex,
          role: curr.getAttribute("role")
        });
        curr = curr.parentElement;
      }
      return {
        target: {
          tag: el ? el.tagName : null,
          id: el ? el.id : null,
          className: el ? el.className : null
        },
        chain,
        allInputs: Array.from(document.querySelectorAll("input, textarea, div[contenteditable='true']")).map(i => ({
          tag: i.tagName,
          id: i.id,
          placeholder: i.placeholder,
          value: i.value,
          type: i.type,
          visible: i.offsetParent !== null,
          box: {
            x: i.getBoundingClientRect().x,
            y: i.getBoundingClientRect().y,
            w: i.getBoundingClientRect().width,
            h: i.getBoundingClientRect().height
          }
        }))
      };
    });

    console.log("Element at (720, 480):", JSON.stringify(elementAtPoint, null, 2));

  } finally {
    await browser.close();
  }
}

inspectExact2faInput().catch(console.error);
