const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--window-size=1280,900"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setCookie({ name: "li_at", value: process.env.LINKEDIN_LI_AT, domain: ".linkedin.com", path: "/" });

  await page.goto("https://www.linkedin.com/in/garuda-ai-ai-operating-system-227168432/edit/intro/", { waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 6000));

  // Set headline
  const editor = await page.$("div.tiptap.ProseMirror[contenteditable='true']");
  if (editor) {
    await editor.click();
    await new Promise(r => setTimeout(r, 300));
    await page.keyboard.down("Control");
    await page.keyboard.press("KeyA");
    await page.keyboard.up("Control");
    await page.keyboard.press("Backspace");
    await page.keyboard.type("Founder & Chief Architect @ GARUDA OS | India's Sovereign AI Operating System | Autonomous Software Engineering, Multi-Agent Swarms & Enterprise Automation | www.garudaos.in", { delay: 6 });
  }

  // Set industry
  const indInput = await page.$("input[id*='ri'], input[placeholder*='Search']");
  if (indInput) {
    await indInput.click();
    await new Promise(r => setTimeout(r, 300));
    await page.keyboard.down("Control");
    await page.keyboard.press("KeyA");
    await page.keyboard.up("Control");
    await page.keyboard.press("Backspace");
    await page.keyboard.type("Software Development", { delay: 15 });
    await new Promise(r => setTimeout(r, 1500));

    // Select the option from the dropdown list
    const selected = await page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll("div, p, span, li, [role='option']"));
      const match = candidates.find(c => (c.innerText || "").trim() === "Software Development" && c.tagName !== "INPUT" && c.closest(".artdeco-modal__content"));
      if (match) {
        match.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        match.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
        match.click();
        return true;
      }
      return false;
    });
    console.log("Selected industry option:", selected);
    await new Promise(r => setTimeout(r, 1500));
  }

  // Click Save
  console.log("Clicking Save button...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const saveBtn = btns.find(b => (b.innerText || "").trim() === "Save" && !b.disabled);
    if (saveBtn) saveBtn.click();
  });

  await new Promise(r => setTimeout(r, 6000));

  // Navigate to main profile to see result
  await page.goto("https://www.linkedin.com/in/me/", { waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 5000));

  await page.screenshot({ path: path.join(__dirname, "..", "output", "profile_after_headline_update.png") });
  console.log("Saved: output/profile_after_headline_update.png");

  await browser.close();
})();
