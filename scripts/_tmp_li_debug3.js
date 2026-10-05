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

  // Step 1: click "More" on profile actions
  const moreClicked = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll("main button, main a, main div[role='button']"));
    const hit = els.find(e => /^More$/i.test((e.textContent || "").trim()) && e.offsetParent !== null);
    if (hit) { hit.click(); return true; }
    return false;
  });
  console.log("MORE:", moreClicked);
  await sleep(3500);

  // Step 2: dropdown items
  const items = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("div[role='menuitem'], div.dropdown-items li, ul li button, div[role='menu'] *"))
      .filter(e => e.offsetParent !== null)
      .map(e => (e.textContent || "").trim())
      .filter(t => t && t.length < 40);
  });
  console.log("MENU:", JSON.stringify([...new Set(items)]));

  // Step 3: click Connect in dropdown
  const connectClicked = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll("div[role='menuitem'], button, a, div[role='menu'] *"));
    const hit = els.find(e => /^Connect$/i.test((e.textContent || "").trim()) && e.offsetParent !== null);
    if (hit) { hit.click(); return true; }
    return false;
  });
  console.log("CONNECT:", connectClicked);
  await sleep(5000);

  await page.screenshot({ path: path.join(REPO, "output", "client_hunt", "debug_connect_modal.png") });

  // Step 4: modal state
  const modal = await page.evaluate(() => {
    const texts = Array.from(document.querySelectorAll("div[role='dialog'] *, .artdeco-modal *"))
      .map(e => (e.textContent || "").trim())
      .filter(t => t && t.length < 60);
    const areas = Array.from(document.querySelectorAll("textarea")).map(a => ({ id: a.id, name: a.name, ph: a.placeholder, vis: a.offsetParent !== null }));
    return { texts: [...new Set(texts)].slice(0, 40), areas };
  });
  console.log("MODAL:", JSON.stringify(modal, null, 1));

  // Step 5: click "Add a note"
  const noteClicked = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll("button, div[role='button'], a"));
    const hit = els.find(e => /Add a note/i.test((e.textContent || "").trim()) && e.offsetParent !== null);
    if (hit) { hit.click(); return true; }
    return false;
  });
  console.log("ADD_NOTE:", noteClicked);
  await sleep(3500);

  const area2 = await page.evaluate(() => Array.from(document.querySelectorAll("textarea")).map(a => ({ id: a.id, name: a.name, ph: a.placeholder, vis: a.offsetParent !== null })));
  console.log("TEXTAREAS:", JSON.stringify(area2));
  await page.screenshot({ path: path.join(REPO, "output", "client_hunt", "debug_connect_note.png") });

  await browser.close();
})().catch(e => { console.error("FATAL", e); process.exit(1); });
