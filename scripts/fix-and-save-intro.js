const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function fixAndSaveIntro() {
  const cookieVal = process.env.LINKEDIN_LI_AT;
  if (!cookieVal) throw new Error("Missing LINKEDIN_LI_AT");

  console.log("🦅 Updating Headline and selecting Industry cleanly...");
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
    path: "/"
  });

  await page.goto("https://www.linkedin.com/in/garuda-ai-ai-operating-system-227168432/edit/intro/", { waitUntil: "domcontentloaded", timeout: 45000 });
  await new Promise(r => setTimeout(r, 6000));

  // 1. Set Headline
  const cleanHeadline = "Founder & Chief Architect @ GARUDA OS | India's Sovereign AI Operating System | Autonomous Software Engineering, Multi-Agent Swarms & Enterprise Automation | www.garudaos.in";

  const editor = await page.$("div.tiptap.ProseMirror[contenteditable='true']");
  if (editor) {
    console.log("Setting Headline...");
    await editor.click();
    await new Promise(r => setTimeout(r, 300));
    await page.keyboard.down("Control");
    await page.keyboard.press("KeyA");
    await page.keyboard.up("Control");
    await page.keyboard.press("Backspace");
    await new Promise(r => setTimeout(r, 300));
    await page.keyboard.type(cleanHeadline, { delay: 8 });
    await new Promise(r => setTimeout(r, 500));
  }

  // 2. Set Industry properly with autocomplete click
  console.log("Finding Industry input...");
  const industryInput = await page.$("input[id*='ri'], input[aria-label*='Industry'], input[placeholder*='Industry']");
  if (industryInput) {
    console.log("Clicking Industry input and typing 'Software Development'...");
    await industryInput.click();
    await new Promise(r => setTimeout(r, 300));
    await page.keyboard.down("Control");
    await page.keyboard.press("KeyA");
    await page.keyboard.up("Control");
    await page.keyboard.press("Backspace");
    await page.keyboard.type("Software Development", { delay: 20 });
    await new Promise(r => setTimeout(r, 2000));

    // Look for typeahead dropdown option and click it
    console.log("Locating and clicking Industry dropdown item...");
    const clickedItem = await page.evaluate(() => {
      // Find visible elements with text 'Software Development' that are inside dropdown/popover/listbox
      const options = Array.from(document.querySelectorAll("div[role='option'], div[role='listbox'] div, .basic-typeahead__selectable, div[data-view-name*='typeahead']"));
      for (const opt of options) {
        if (opt.innerText && opt.innerText.includes("Software Development")) {
          opt.scrollIntoView({ behavior: "instant", block: "center" });
          opt.click();
          return true;
        }
      }
      // Fallback: click any element with exact text
      const allDivs = Array.from(document.querySelectorAll("div, p, span, li"));
      for (const d of allDivs) {
        if (d.innerText && d.innerText.trim() === "Software Development" && d.offsetParent !== null) {
          d.click();
          return true;
        }
      }
      return false;
    });

    console.log("Dropdown item clicked:", clickedItem);
    await new Promise(r => setTimeout(r, 1500));
  }

  const previewPath = path.join(OUTPUT_DIR, "headline_and_industry_preview.png");
  await page.screenshot({ path: previewPath });
  console.log("Saved preview:", previewPath);

  // 3. Click Save
  console.log("Clicking Save...");
  const saved = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const saveBtn = btns.find(b => (b.innerText || "").trim() === "Save" && !b.disabled);
    if (saveBtn) {
      saveBtn.scrollIntoView({ behavior: "instant", block: "center" });
      saveBtn.click();
      return true;
    }
    return false;
  });

  if (!saved) throw new Error("Could not find enabled Save button!");

  console.log("✔ Save clicked! Waiting 6s for confirmation...");
  await new Promise(r => setTimeout(r, 6000));

  const confirmationPath = path.join(OUTPUT_DIR, "headline_final_saved_proof.png");
  await page.screenshot({ path: confirmationPath });
  console.log("✔ Saved final confirmation:", confirmationPath);

  await browser.close();
  console.log("🎉 HEADLINE & INTRO SAVED SUCCESSFULLY!");
}

fixAndSaveIntro().catch(err => {
  console.error("❌ Error fixing intro:", err);
  process.exit(1);
});
