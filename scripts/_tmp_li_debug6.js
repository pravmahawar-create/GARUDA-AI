const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const REPO = path.join(__dirname, "..");
const PROFILE = path.join(REPO, ".chrome-profile", "garuda");
const SHOT = path.join(REPO, "output", "client_hunt");
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function xpathClick(page, expr) {
  return page.evaluate((xp) => {
    const r = document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    const el = r.singleNodeValue;
    if (!el) return false;
    el.scrollIntoView({ block: "center" });
    el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    el.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    el.click();
    return true;
  }, expr);
}

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

  const moreOk = await xpathClick(page, "(//*[self::button or @role='button'][normalize-space(.)='More'])[1]");
  console.log("MORE:", moreOk);
  await sleep(3000);

  const menuDump = await page.evaluate(() => Array.from(document.querySelectorAll("div[role='menu'] [role='menuitem']")).map(e => ({ t: (e.textContent || "").trim().slice(0, 30), vis: e.offsetParent !== null })));
  console.log("MENU:", JSON.stringify(menuDump));
  await page.screenshot({ path: path.join(SHOT, "d6_menu.png") });

  const connOk = await xpathClick(page, "(//div[@role='menu']//*[@role='menuitem'][normalize-space(.)='Connect'])[1] | (//div[@role='menu']//*[normalize-space(.)='Connect'])[1]");
  console.log("CONNECT:", connOk);
  await sleep(5000);
  await page.screenshot({ path: path.join(SHOT, "d6_after_connect.png") });

  const dump = await page.evaluate(() => ({
    dialogs: Array.from(document.querySelectorAll("div[role='dialog']")).map(d => (d.innerText || "").slice(0, 400)),
    modals: Array.from(document.querySelectorAll(".artdeco-modal, [class*='modal']")).filter(m => m.offsetParent !== null).map(m => ({ cls: (m.className || "").toString().slice(0, 70), txt: (m.innerText || "").slice(0, 400) })),
    textareas: Array.from(document.querySelectorAll("textarea")).map(a => ({ id: a.id, name: a.name, ph: a.placeholder, vis: a.offsetParent !== null }))
  }));
  console.log("DUMP:", JSON.stringify(dump, null, 1));

  // Try "Add a note"
  const noteOk = await xpathClick(page, "(//div[@role='dialog']//button[contains(., 'Add a note')])[1]");
  console.log("ADD_NOTE:", noteOk);
  await sleep(3500);

  const ta = await page.evaluate(() => Array.from(document.querySelectorAll("textarea")).map(a => ({ id: a.id, name: a.name, ph: a.placeholder, vis: a.offsetParent !== null })));
  console.log("TEXTAREAS:", JSON.stringify(ta));
  const dlgBtns = await page.evaluate(() => Array.from(document.querySelectorAll("div[role='dialog'] button")).map(b => (b.textContent || "").trim()).filter(Boolean));
  console.log("DLG_BTNS:", JSON.stringify(dlgBtns));
  await page.screenshot({ path: path.join(SHOT, "d6_note.png") });
  await browser.close();
})().catch(e => { console.error("FATAL", e); process.exit(1); });
