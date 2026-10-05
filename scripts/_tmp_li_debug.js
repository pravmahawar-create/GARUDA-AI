const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const REPO = path.join(__dirname, "..");
const PROFILE = path.join(REPO, ".chrome-profile", "garuda");
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: false, userDataDir: PROFILE,
    args: ["--no-sandbox", "--window-size=1440,900", "--start-maximized"],
    defaultViewport: null, protocolTimeout: 180000
  });
  const page = (await browser.pages())[0] || await browser.newPage();
  page.setDefaultTimeout(30000);
  await page.goto("https://www.linkedin.com/in/pronojitsingh/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await sleep(7000);

  const state1 = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("a,button,div[role='button']"))
      .filter(e => e.offsetParent !== null)
      .map(e => (e.textContent || "").trim())
      .filter(t => t && t.length < 30);
    return { url: location.href, texts: [...new Set(btns)].slice(0, 60) };
  });
  console.log("BUTTONS:", JSON.stringify(state1.texts));
  console.log("URL:", state1.url);

  // Click Message via aria-label or text
  const clicked = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll("main a, main button, main div[role='button']"));
    const hit = els.find(e => /^(Message|✉\s*Message|Message Pronojit)/i.test((e.textContent || "").trim()) && e.offsetParent !== null);
    if (hit) { hit.click(); return (e => e)(hit.textContent.trim()); }
    return null;
  });
  console.log("CLICKED:", clicked);
  await sleep(8000);

  const state2 = await page.evaluate(() => {
    const boxes = Array.from(document.querySelectorAll('[contenteditable="true"]')).map(e => ({
      cls: e.className.slice(0, 80), role: e.getAttribute("role"), vis: e.offsetParent !== null
    }));
    const forms = Array.from(document.querySelectorAll('[class*="msg-form"]')).map(e => e.className.slice(0, 60));
    return { url: location.href, boxes, forms: [...new Set(forms)].slice(0, 10) };
  });
  console.log("AFTER_MSG_CLICK:", JSON.stringify(state2, null, 1));
  await page.screenshot({ path: path.join(REPO, "output", "client_hunt", "debug_msg_flow.png") });
  await browser.close();
})().catch(e => { console.error("FATAL", e); process.exit(1); });
