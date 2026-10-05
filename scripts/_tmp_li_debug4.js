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

  // Real click on More
  const moreHandle = await page.evaluateHandle(() => {
    const els = Array.from(document.querySelectorAll("main button, main a, main div[role='button']"));
    return els.find(e => /^More$/i.test((e.textContent || "").trim()) && e.offsetParent !== null) || null;
  });
  if (!moreHandle || !(await moreHandle.asElement())) { console.log("NO_MORE"); process.exit(2); }
  await moreHandle.asElement().click();
  console.log("MORE_CLICKED");
  await sleep(3500);

  // Real click on Connect menuitem
  const connectHandle = await page.evaluateHandle(() => {
    const els = Array.from(document.querySelectorAll("div[role='menuitem'], li, button, a, div[role='menu'] div"));
    return els.find(e => /^Connect$/i.test((e.textContent || "").trim()) && e.offsetParent !== null) || null;
  });
  const cEl = connectHandle.asElement();
  if (!cEl) { console.log("NO_CONNECT"); process.exit(2); }
  await cEl.click();
  console.log("CONNECT_CLICKED");
  await sleep(6000);

  let modal = await page.evaluate(() => {
    const dlg = document.querySelector("div[role='dialog']");
    return {
      hasDialog: !!dlg,
      texts: dlg ? Array.from(dlg.querySelectorAll("h2, h3, button, label")).map(e => (e.textContent || "").trim()).filter(Boolean).slice(0, 25) : [],
      textareas: Array.from(document.querySelectorAll("textarea")).map(a => ({ id: a.id, name: a.name, ph: a.placeholder, vis: a.offsetParent !== null }))
    };
  });
  console.log("MODAL1:", JSON.stringify(modal, null, 1));
  await page.screenshot({ path: path.join(REPO, "output", "client_hunt", "debug_connect_modal2.png") });

  if (!modal.textareas.some(t => t.vis)) {
    // Click "Add a note"
    const noteHandle = await page.evaluateHandle(() => {
      const els = Array.from(document.querySelectorAll("button, div[role='button'], a"));
      return els.find(e => /Add a note/i.test((e.textContent || "").trim()) && e.offsetParent !== null) || null;
    });
    const nEl = noteHandle.asElement();
    if (nEl) { await nEl.click(); console.log("ADD_NOTE_CLICKED"); await sleep(3500); }
    else console.log("NO_ADD_NOTE");
    modal = await page.evaluate(() => ({
      textareas: Array.from(document.querySelectorAll("textarea")).map(a => ({ id: a.id, name: a.name, ph: a.placeholder, vis: a.offsetParent !== null })),
      dialogBtns: Array.from(document.querySelectorAll("div[role='dialog'] button")).map(b => (b.textContent || "").trim()).filter(Boolean)
    }));
    console.log("MODAL2:", JSON.stringify(modal, null, 1));
    await page.screenshot({ path: path.join(REPO, "output", "client_hunt", "debug_connect_note2.png") });
  }
  await browser.close();
})().catch(e => { console.error("FATAL", e); process.exit(1); });
