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

  page.on("request", req => {
    if (req.url().includes("voyager/api/identity/profiles") || req.url().includes("graphql")) {
      console.log(`[REQ ${req.method()}] ${req.url()}`);
      if (req.postData()) console.log("DATA:", req.postData().substring(0, 150));
    }
  });

  page.on("response", async res => {
    if (res.url().includes("voyager/api/identity/profiles") || res.url().includes("graphql")) {
      console.log(`[RES ${res.status()}] ${res.url()}`);
      try {
        const t = await res.text();
        console.log("BODY:", t.substring(0, 300));
      } catch (e) {}
    }
  });

  await page.goto("https://www.linkedin.com/in/garuda-ai-ai-operating-system-227168432/edit/intro/", {
    waitUntil: "domcontentloaded",
    timeout: 45000
  });
  await new Promise(r => setTimeout(r, 4000));

  // 1. Set Headline
  const headline = "Founder & Chief Architect @ GARUDA OS | India's Sovereign AI Operating System | Autonomous Software Engineering, Multi-Agent Swarms & Enterprise Automation | www.garudaos.in";
  const editor = await page.$("div.tiptap.ProseMirror[contenteditable='true']");
  if (editor) {
    console.log("Entering headline...");
    await editor.click();
    await page.keyboard.down("Control");
    await page.keyboard.press("KeyA");
    await page.keyboard.up("Control");
    await page.keyboard.press("Backspace");
    await page.keyboard.type(headline, { delay: 4 });
  }

  // 2. Select Industry
  console.log("Interacting with Industry typeahead...");
  const indInput = await page.$("input[aria-label='Industry']");
  if (indInput) {
    await indInput.click();
    await page.keyboard.down("Control");
    await page.keyboard.press("KeyA");
    await page.keyboard.up("Control");
    await page.keyboard.press("Backspace");
    await page.keyboard.type("Software", { delay: 30 });
    console.log("Waiting for typeahead results...");
    await new Promise(r => setTimeout(r, 2000));

    // Find bounding box of option containing Software Development
    const optionRect = await page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll("[role='option'], div[role='button']"));
      for (const el of candidates) {
        if (el.innerText.includes("Software Development")) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, text: el.innerText };
          }
        }
      }
      return null;
    });

    console.log("Option rect:", optionRect);
    if (optionRect) {
      console.log(`Clicking option at (${optionRect.x}, ${optionRect.y}) with text: ${optionRect.text}`);
      await page.mouse.click(optionRect.x, optionRect.y);
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  const screenBeforeSave = path.join(__dirname, "..", "output", "industry_selected_screen.png");
  await page.screenshot({ path: screenBeforeSave });
  console.log("Saved industry_selected_screen.png");

  // Click Save
  console.log("Clicking Save...");
  const saveBtn = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const b = btns.find(btn => (btn.innerText || "").trim() === "Save" && !btn.disabled);
    if (b) {
      b.click();
      return true;
    }
    return false;
  });
  console.log("Save clicked:", saveBtn);

  await new Promise(r => setTimeout(r, 6000));

  const screenAfterSave = path.join(__dirname, "..", "output", "intro_modal_after_save.png");
  await page.screenshot({ path: screenAfterSave });
  console.log("Saved intro_modal_after_save.png");

  const pageErrors = await page.evaluate(() => {
    return Array.from(document.querySelectorAll(".artdeco-inline-feedback, [role='alert'], .artdeco-toast-item, .error"))
      .map(e => e.innerText.trim());
  });
  console.log("Errors after save:", pageErrors);

  await browser.close();
})().catch(console.error);
