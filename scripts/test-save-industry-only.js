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

  page.on("response", async (res) => {
    const req = res.request();
    if (req.method() === "POST") {
      console.log(`[HTTP ${res.status()}] POST ${req.url()}`);
      try {
        const text = await res.text();
        console.log("RESPONSE:", text.substring(0, 400));
      } catch (e) {}
    }
  });

  await page.goto("https://www.linkedin.com/in/garuda-ai-ai-operating-system-227168432/edit/intro/", {
    waitUntil: "domcontentloaded",
    timeout: 45000
  });
  await new Promise(r => setTimeout(r, 4000));

  const indInput = await page.$("input[aria-label='Industry']");
  if (indInput) {
    console.log("Selecting Software Development...");
    await indInput.click();
    await page.keyboard.type("Software", { delay: 30 });
    await new Promise(r => setTimeout(r, 2000));

    await page.evaluate(() => {
      const options = Array.from(document.querySelectorAll("div[role='option']"));
      const match = options.find(o => o.innerText.trim().startsWith("Software Development"));
      if (match) {
        const btn = match.querySelector("[role='button']") || match;
        btn.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
        btn.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true }));
        btn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      }
    });
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log("Clicking Save...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const saveBtn = btns.find(b => (b.innerText || "").trim() === "Save");
    if (saveBtn) saveBtn.click();
  });

  await new Promise(r => setTimeout(r, 5000));

  const shot = path.join(__dirname, "..", "output", "test_save_industry_only.png");
  await page.screenshot({ path: shot });
  console.log("Saved screenshot:", shot);

  const errors = await page.evaluate(() => {
    return Array.from(document.querySelectorAll(".artdeco-inline-feedback, [role='alert'], .artdeco-toast-item, .error"))
      .map(e => e.innerText.trim());
  });
  console.log("ERRORS:", errors);

  await browser.close();
})().catch(console.error);
