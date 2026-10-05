const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function executeHeadlineAndIndustryUpdate() {
  const cookieVal = process.env.LINKEDIN_LI_AT;
  if (!cookieVal) throw new Error("Missing LINKEDIN_LI_AT");

  console.log("🦅 Updating Headline & Industry on LinkedIn...");
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
  console.log("Navigating to:", introUrl);
  await page.goto(introUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await new Promise(r => setTimeout(r, 6000));

  // 1. Set Headline
  const headlineText = "Founder & Chief Architect @ GARUDA OS | India's Sovereign AI Operating System | Autonomous Software Engineering, Multi-Agent Swarms & Enterprise Automation | www.garudaos.in";

  const editor = await page.$("div.tiptap.ProseMirror[contenteditable='true']");
  if (editor) {
    console.log("Typing headline...");
    await editor.click();
    await new Promise(r => setTimeout(r, 200));
    await page.keyboard.down("Control");
    await page.keyboard.press("KeyA");
    await page.keyboard.up("Control");
    await page.keyboard.press("Backspace");
    await new Promise(r => setTimeout(r, 200));
    await page.keyboard.type(headlineText, { delay: 6 });
    await new Promise(r => setTimeout(r, 500));
  }

  // 2. Set Industry
  console.log("Typing and selecting Industry...");
  const indInput = await page.$("input[id*='ri'], input[placeholder*='Search']");
  if (indInput) {
    await indInput.click();
    await new Promise(r => setTimeout(r, 200));
    await page.keyboard.down("Control");
    await page.keyboard.press("KeyA");
    await page.keyboard.up("Control");
    await page.keyboard.press("Backspace");
    await page.keyboard.type("Software Development", { delay: 15 });

    console.log("Waiting for div[role='option']...");
    await page.waitForSelector("div[role='option']", { timeout: 8000 });
    await new Promise(r => setTimeout(r, 500));

    // Click the first role="option"
    const option = await page.$("div[role='option']");
    if (option) {
      console.log("Clicking role='option'...");
      await option.click();
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  const previewPath = path.join(OUTPUT_DIR, "headline_and_industry_ready.png");
  await page.screenshot({ path: previewPath });
  console.log("Saved preview:", previewPath);

  // 3. Click Save
  console.log("Clicking Save button...");
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

  console.log("✔ Save clicked! Waiting 6s for LinkedIn update...");
  await new Promise(r => setTimeout(r, 6000));

  // 4. Navigate to profile and capture full page confirmation
  await page.goto("https://www.linkedin.com/in/me/", { waitUntil: "domcontentloaded", timeout: 45000 });
  await new Promise(r => setTimeout(r, 6000));

  const finalProofPath = path.join(OUTPUT_DIR, "profile_headline_updated_live.png");
  await page.screenshot({ path: finalProofPath, fullPage: true });
  console.log("✔ Saved final proof screenshot:", finalProofPath);

  await browser.close();
  console.log("🎉 HEADLINE & INDUSTRY SUCCESSFULLY PUBLISHED LIVE!");
}

executeHeadlineAndIndustryUpdate().catch(err => {
  console.error("❌ Error updating headline and industry:", err);
  process.exit(1);
});
