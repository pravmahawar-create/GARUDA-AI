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

  page.on("request", (req) => {
    if (req.method() === "POST" || req.method() === "PUT" || req.method() === "PATCH") {
      console.log(`>>> [REQ ${req.method()}] ${req.url()}`);
      console.log("POST DATA:", req.postData()?.substring(0, 200));
    }
  });

  page.on("response", async (res) => {
    const req = res.request();
    if (req.method() === "POST" || req.method() === "PUT" || req.method() === "PATCH") {
      console.log(`<<< [RES ${res.status()}] ${res.url()}`);
      try {
        const text = await res.text();
        console.log("RES TEXT:", text.substring(0, 500));
      } catch (e) {}
    }
  });

  await page.goto("https://www.linkedin.com/in/garuda-ai-ai-operating-system-227168432/edit/intro/", {
    waitUntil: "domcontentloaded",
    timeout: 45000
  });
  await new Promise(r => setTimeout(r, 4000));

  const headline = "Founder & Chief Architect @ GARUDA OS | India's Sovereign AI Operating System | Autonomous Software Engineering, Multi-Agent Swarms & Enterprise Automation | www.garudaos.in";
  const editor = await page.$("div.tiptap.ProseMirror[contenteditable='true']");
  if (editor) {
    console.log("Replacing headline text...");
    await editor.click();
    await page.keyboard.down("Control");
    await page.keyboard.press("KeyA");
    await page.keyboard.up("Control");
    await page.keyboard.press("Backspace");
    await page.keyboard.type(headline, { delay: 4 });
  }

  await new Promise(r => setTimeout(r, 1000));

  console.log("Clicking Save...");
  const clicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const saveBtn = btns.find(b => (b.innerText || "").trim() === "Save");
    if (saveBtn) {
      saveBtn.click();
      return true;
    }
    return false;
  });

  console.log("Save clicked:", clicked);
  await new Promise(r => setTimeout(r, 5000));

  const screenAfter = path.join(__dirname, "..", "output", "headline_only_save.png");
  await page.screenshot({ path: screenAfter });
  console.log("Screenshot saved to:", screenAfter);

  const errors = await page.evaluate(() => {
    return Array.from(document.querySelectorAll(".artdeco-inline-feedback, [role='alert'], .artdeco-toast-item, .error, .artdeco-inline-feedback--error"))
      .map(e => e.innerText.trim());
  });
  console.log("ERRORS ON PAGE:", errors);

  await browser.close();
})().catch(console.error);
