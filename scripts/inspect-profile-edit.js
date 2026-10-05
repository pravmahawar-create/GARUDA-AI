const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--window-size=1280,900"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setCookie({ name: "li_at", value: process.env.LINKEDIN_LI_AT, domain: ".linkedin.com", path: "/" });

  await page.goto("https://www.linkedin.com/in/me/", { waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 6000));

  // Click edit intro button
  const editBtn = await page.$("button[aria-label*='Edit intro'], a[aria-label*='Edit intro'], svg[data-test-icon='pencil-small']");
  if (editBtn) {
    console.log("Clicking edit intro pencil...");
    await editBtn.click();
    await new Promise(r => setTimeout(r, 4000));

    await page.screenshot({ path: path.join(__dirname, "..", "output", "profile_edit_modal.png") });
    console.log("Saved screenshot: output/profile_edit_modal.png");
  } else {
    // Try finding by pencil icon or edit button
    const btns = await page.evaluate(() => {
      const allBtns = Array.from(document.querySelectorAll("button"));
      for (const b of allBtns) {
        if (b.getAttribute("aria-label")?.includes("Edit intro")) {
          b.click();
          return true;
        }
      }
      return false;
    });
    console.log("Clicked via evaluate:", btns);
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: path.join(__dirname, "..", "output", "profile_edit_modal.png") });
  }

  await browser.close();
})();
