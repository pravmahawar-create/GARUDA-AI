const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,900"]
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setCookie({
    name: "li_at",
    value: process.env.LINKEDIN_LI_AT,
    domain: ".linkedin.com",
    path: "/"
  });

  await page.evaluateOnNewDocument(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
      if (url.includes("saveProfileIntroForm")) {
        try {
          const clone = response.clone();
          const text = await clone.text();
          console.log("[SDUI_SAVE_RESULT] " + text.substring(0, 500));
        } catch (e) {}
      }
      return response;
    };
  });

  page.on("console", msg => {
    if (msg.text().includes("[SDUI_SAVE_RESULT]")) {
      console.log(msg.text());
    }
  });

  const introUrl = "https://www.linkedin.com/in/garuda-ai-ai-operating-system-227168432/edit/intro/";
  await page.goto(introUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await new Promise(r => setTimeout(r, 4000));

  // Headline WITHOUT URL
  const headline = "Founder & Chief Architect at GARUDA OS | India's Sovereign AI Operating System | Autonomous Software Engineering, Multi-Agent Swarms & Enterprise Automation";
  const editor = await page.$("div.tiptap.ProseMirror[contenteditable='true']");
  if (editor) {
    console.log("Setting clean headline (no URL)...");
    await editor.click();
    await new Promise(r => setTimeout(r, 200));
    await page.keyboard.down("Control");
    await page.keyboard.press("KeyA");
    await page.keyboard.up("Control");
    await page.keyboard.press("Backspace");
    await new Promise(r => setTimeout(r, 200));
    await page.keyboard.type(headline, { delay: 4 });
  }

  // Set Industry
  const indInput = await page.$("input[aria-label='Industry']");
  if (indInput) {
    console.log("Selecting Industry...");
    await indInput.click();
    await page.keyboard.type("Software", { delay: 30 });
    const option = await page.waitForSelector("div[role='option']", { visible: true, timeout: 10000 });
    await option.click();
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log("Clicking Save...");
  const saveBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    return btns.find(b => (b.innerText || "").trim() === "Save" && !b.disabled);
  });
  if (saveBtn) await saveBtn.asElement().click();

  await new Promise(r => setTimeout(r, 7000));

  const proofShot = path.join(__dirname, "..", "output", "test_no_url_save.png");
  await page.screenshot({ path: proofShot });
  console.log("Screenshot saved:", proofShot);

  await browser.close();
})().catch(console.error);
