const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function checkCommentSubmitButton() {
  const cookieVal = process.env.LINKEDIN_LI_AT;
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,900"]
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  await page.setCookie({
    name: "li_at",
    value: cookieVal,
    domain: ".linkedin.com",
    path: "/",
    httpOnly: true,
    secure: true
  });

  const searchUrl = "https://www.linkedin.com/search/results/content/?keywords=enterprise%20AI%20architecture%20bangalore&origin=GLOBAL_SEARCH_HEADER";
  await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await new Promise(r => setTimeout(r, 6000));

  const buttons = await page.$$('button[aria-label="Comment"]');
  if (buttons.length >= 2) {
    await buttons[1].click();
    await new Promise(r => setTimeout(r, 3000));

    // Focus editor and type a short test
    const editor = await page.$('div[role="textbox"]');
    if (editor) {
      await editor.click();
      await page.keyboard.type("Test");
      await new Promise(r => setTimeout(r, 1500));

      const submitBtns = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        return btns
          .filter(b => {
            const txt = (b.innerText || "").trim().toLowerCase();
            return txt === "comment" || txt === "post" || txt.includes("comment");
          })
          .map(b => ({
            text: b.innerText.trim(),
            className: b.className,
            aria: b.getAttribute("aria-label"),
            disabled: b.disabled
          }));
      });

      console.log("Candidate Submit Buttons:", JSON.stringify(submitBtns, null, 2));

      // Clear the editor so we don't leave "Test"
      await page.keyboard.down("Control");
      await page.keyboard.press("A");
      await page.keyboard.up("Control");
      await page.keyboard.press("Backspace");
    }
  }

  await browser.close();
}

checkCommentSubmitButton().catch(console.error);
