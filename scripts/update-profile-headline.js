const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function updateHeadline() {
  const cookieVal = process.env.LINKEDIN_LI_AT;
  if (!cookieVal) throw new Error("Missing LINKEDIN_LI_AT");

  console.log("🦅 Updating LinkedIn Headline & Intro...");
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

  const introUrl = "https://www.linkedin.com/in/garuda-ai-ai-operating-system-227168432/edit/intro/";
  console.log("Navigating to Edit Intro form...");
  await page.goto(introUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await new Promise(r => setTimeout(r, 6000));

  const newHeadline = "Founder & Chief Architect @ GARUDA OS | India's Sovereign AI Operating System | Autonomous Software Engineering, Multi-Agent Swarms & Enterprise Automation | www.garudaos.in 🦅";

  // Focus ProseMirror editor
  const editor = await page.$("div.tiptap.ProseMirror[contenteditable='true']");
  if (!editor) throw new Error("Headline ProseMirror editor not found!");

  console.log("Found headline editor. Clearing existing text and typing new headline...");
  await editor.click();
  await new Promise(r => setTimeout(r, 500));

  // Select all and replace
  await page.keyboard.down("Control");
  await page.keyboard.press("KeyA");
  await page.keyboard.up("Control");
  await page.keyboard.press("Backspace");
  await new Promise(r => setTimeout(r, 500));

  await page.keyboard.type(newHeadline, { delay: 10 });
  await new Promise(r => setTimeout(r, 1000));

  // Screenshot preview before saving
  const previewPath = path.join(OUTPUT_DIR, "headline_edit_preview.png");
  await page.screenshot({ path: previewPath });
  console.log("✔ Preview screenshot saved:", previewPath);

  // Click Save button
  console.log("Clicking Save button...");
  const saved = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    for (const b of btns) {
      if ((b.innerText || "").trim() === "Save" && !b.disabled) {
        b.scrollIntoView({ behavior: "instant", block: "center" });
        b.click();
        return true;
      }
    }
    return false;
  });

  if (!saved) throw new Error("Could not find enabled Save button!");

  console.log("✔ Save clicked! Waiting 6s for LinkedIn update...");
  await new Promise(r => setTimeout(r, 6000));

  const confirmationPath = path.join(OUTPUT_DIR, "headline_saved_confirmation.png");
  await page.screenshot({ path: confirmationPath });
  console.log("✔ Saved confirmation screenshot:", confirmationPath);

  await browser.close();
  console.log("🎉 HEADLINE SUCCESSFULLY UPDATED ON LINKEDIN!");
}

updateHeadline().catch(err => {
  console.error("❌ Error updating headline:", err);
  process.exit(1);
});
