const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,900"]
  });
  const page = await browser.newPage();
  await page.setCookie({
    name: "li_at",
    value: process.env.LINKEDIN_LI_AT,
    domain: ".linkedin.com",
    path: "/"
  });

  // Intercept network requests / responses
  page.on("response", async (res) => {
    const url = res.url();
    if (url.includes("graphql") || url.includes("voyager") || url.includes("identity")) {
      const status = res.status();
      if (res.request().method() === "POST") {
        console.log(`[API RESPONSE ${status}] ${url.substring(0, 100)}`);
        try {
          const body = await res.text();
          console.log("RESPONSE BODY:", body.substring(0, 300));
        } catch (e) {}
      }
    }
  });

  await page.goto("https://www.linkedin.com/in/garuda-ai-ai-operating-system-227168432/edit/intro/", {
    waitUntil: "domcontentloaded",
    timeout: 45000
  });
  await new Promise(r => setTimeout(r, 4000));

  // 1. Headline
  const headline = "Founder & Chief Architect @ GARUDA OS | India's Sovereign AI Operating System | Autonomous Software Engineering, Multi-Agent Swarms & Enterprise Automation | www.garudaos.in";
  const editor = await page.$("div.tiptap.ProseMirror[contenteditable='true']");
  if (editor) {
    console.log("Setting headline...");
    await editor.click();
    await page.keyboard.down("Control");
    await page.keyboard.press("KeyA");
    await page.keyboard.up("Control");
    await page.keyboard.press("Backspace");
    await page.keyboard.type(headline, { delay: 5 });
  }

  // 2. Industry
  console.log("Focusing industry input...");
  const indInput = await page.$("input[aria-label='Industry']");
  if (indInput) {
    await indInput.click();
    await new Promise(r => setTimeout(r, 200));
    await page.keyboard.type("Software Development", { delay: 20 });
    console.log("Typed 'Software Development', waiting 2s...");
    await new Promise(r => setTimeout(r, 2000));

    // Check what dropdown elements appeared
    const optionsInfo = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll("[role='option'], [role='listbox'] div, .typeahead-results li, div[data-view-name]"));
      return els.map(e => ({
        tag: e.tagName,
        role: e.getAttribute("role"),
        text: e.innerText.trim(),
        className: e.className
      })).filter(e => e.text.length > 0 && e.text.length < 100);
    });
    console.log("OPTIONS FOUND:", JSON.stringify(optionsInfo.slice(0, 10), null, 2));

    // Try pressing ArrowDown and Enter
    console.log("Pressing ArrowDown and Enter...");
    await page.keyboard.press("ArrowDown");
    await new Promise(r => setTimeout(r, 300));
    await page.keyboard.press("Enter");
    await new Promise(r => setTimeout(r, 1000));
  }

  const screenBeforeSave = path.join(__dirname, "..", "output", "before_save_test.png");
  await page.screenshot({ path: screenBeforeSave });
  console.log("Saved before_save_test.png");

  // Check Save button
  console.log("Clicking Save button...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const saveBtn = btns.find(b => (b.innerText || "").trim() === "Save");
    if (saveBtn) saveBtn.click();
  });

  await new Promise(r => setTimeout(r, 4000));

  const screenAfterSave = path.join(__dirname, "..", "output", "after_save_test.png");
  await page.screenshot({ path: screenAfterSave });
  console.log("Saved after_save_test.png");

  const errors = await page.evaluate(() => {
    return Array.from(document.querySelectorAll(".artdeco-inline-feedback, [role='alert'], .artdeco-toast-item, .error"))
      .map(e => e.innerText.trim());
  });
  console.log("POST-SAVE ERRORS/TOASTS:", errors);

  await browser.close();
})().catch(console.error);
