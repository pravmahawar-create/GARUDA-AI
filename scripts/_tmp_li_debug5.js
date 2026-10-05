const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const REPO = path.join(__dirname, "..");
const PROFILE = path.join(REPO, ".chrome-profile", "garuda");
const SHOT = path.join(REPO, "output", "client_hunt");
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

  // Open More menu with a real click
  const moreBtn = await page.$x("//main//button[contains(., 'More')] | //main//div[@role='button'][contains(., 'More')]");
  if (moreBtn.length) { await moreBtn[0].click(); console.log("MORE_OK"); } else console.log("MORE_MISS");
  await sleep(3000);
  await page.screenshot({ path: path.join(SHOT, "d5_menu.png") });

  // List menu items with handles
  const items = await page.$x("//div[@role='menu']//div[@role='menuitem'] | //div[@role='menu']//li");
  const labels = [];
  for (const it of items) labels.push(await it.evaluate(e => (e.textContent || "").trim().slice(0, 40)));
  console.log("ITEMS:", JSON.stringify(labels));

  const connectItems = await page.$x("//div[@role='menu']//*[self::div or self::button or self::li][contains(normalize-space(.), 'Connect')]");
  if (connectItems.length) {
    await connectItems[0].click();
    console.log("CONNECT_OK");
  } else console.log("CONNECT_MISS");
  await sleep(4000);
  await page.screenshot({ path: path.join(SHOT, "d5_after_connect.png") });

  const dump = await page.evaluate(() => ({
    url: location.href,
    dialogs: Array.from(document.querySelectorAll("div[role='dialog']")).map(d => (d.innerText || "").slice(0, 300)),
    modals: Array.from(document.querySelectorAll(".artdeco-modal, .deco-modal, div[class*='modal']")).map(d => ({ cls: d.className.slice(0, 60), txt: (d.innerText || "").slice(0, 300) })),
    textareas: Array.from(document.querySelectorAll("textarea, [contenteditable='true']")).map(a => ({ tag: a.tagName, id: a.id, cls: (a.className || "").slice(0, 50), ph: a.getAttribute("placeholder"), vis: a.offsetParent !== null }))
  }));
  console.log("DUMP:", JSON.stringify(dump, null, 1));

  // If no dialog, maybe invitation sent directly — check for pending state
  const pending = await page.evaluate(() => /Pending|Pending invitation|Invitation sent/i.test(document.body.innerText));
  console.log("PENDING_STATE:", pending);
  await page.screenshot({ path: path.join(SHOT, "d5_final.png") });
  await browser.close();
})().catch(e => { console.error("FATAL", e); process.exit(1); });
