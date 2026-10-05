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
  const clicked = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll("main a, main button, main div[role='button']"));
    const hit = els.find(e => /^Message$/i.test((e.textContent || "").trim()) && e.offsetParent !== null);
    if (hit) { hit.click(); return true; }
    return false;
  });
  console.log("CLICKED_MSG:", clicked);
  await sleep(12000);
  const state = await page.evaluate(() => ({
    url: location.href,
    boxes: Array.from(document.querySelectorAll('[contenteditable="true"]')).map(e => ({ cls: (e.className||"").slice(0,90), vis: e.offsetParent !== null })),
    textboxes: Array.from(document.querySelectorAll('div[role="textbox"]')).map(e => ({ cls: (e.className||"").slice(0,90), vis: e.offsetParent !== null })),
    iframes: document.querySelectorAll("iframe").length,
    bodyHead: (document.body.innerText || "").slice(0, 400)
  }));
  console.log(JSON.stringify(state, null, 1));
  await page.screenshot({ path: path.join(REPO, "output", "client_hunt", "debug_msg_flow2.png") });
  await browser.close();
})().catch(e => { console.error("FATAL", e); process.exit(1); });
