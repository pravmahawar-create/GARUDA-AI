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
    defaultViewport: null, protocolTimeout: 300000
  });
  browser.on("targetcreated", async t => console.log("NEW_TARGET:", t.type(), t.url().slice(0, 120)));
  const page = (await browser.pages())[0] || await browser.newPage();
  page.setDefaultTimeout(30000);
  page.on("popup", p => console.log("POPUP:", p.url().slice(0, 120)));
  await page.goto("https://www.linkedin.com/in/pronojitsingh/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await sleep(7000);

  // Real CDP click on More
  const moreEl = await page.evaluateHandle(() => Array.from(document.querySelectorAll("*")).find(e =>
    e.children.length <= 3 && (e.textContent || "").trim() === "More" && e.offsetParent !== null &&
    (e.tagName === "BUTTON" || e.getAttribute("role") === "button")));
  const mEl = moreEl.asElement();
  if (!mEl) { console.log("NO_MORE"); process.exit(2); }
  await mEl.click();
  console.log("MORE_CLICKED");
  await sleep(3000);

  // Real CDP click on Connect inside menu
  const connEl = await page.evaluateHandle(() => {
    const menu = document.querySelector("div[role='menu']");
    const root = menu || document;
    const all = Array.from(root.querySelectorAll("*"));
    return all.find(e => (e.textContent || "").trim() === "Connect" && e.offsetParent !== null &&
      (e.getAttribute("role") === "menuitem" || e.tagName === "BUTTON" || e.tagName === "LI" || e.tagName === "A" || e.children.length <= 2));
  });
  const cEl = connEl.asElement();
  if (!cEl) { console.log("NO_CONNECT"); process.exit(2); }
  const box = await cEl.boundingBox();
  console.log("CONNECT_BOX:", JSON.stringify(box));
  if (box) await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  else await cEl.click();
  console.log("CONNECT_MOUSE_CLICKED");

  let found = false;
  for (let i = 1; i <= 6 && !found; i++) {
    await sleep(2500);
    const s = await page.evaluate(() => {
      const dlg = Array.from(document.querySelectorAll("div[role='dialog']"));
      const noteBtn = Array.from(document.querySelectorAll("button")).find(b => /Add a note/i.test(b.textContent || ""));
      const tas = Array.from(document.querySelectorAll("textarea")).filter(a => a.offsetParent !== null);
      return { dlgCount: dlg.length, dlgHead: dlg[0] ? (dlg[0].innerText || "").slice(0, 200) : "", noteBtn: !!noteBtn, tas: tas.map(t => t.id || t.name || t.className.slice(0, 30)) };
    });
    console.log(`T+${i * 2.5}s:`, JSON.stringify(s));
    if (s.dlgCount || s.noteBtn || s.tas.length) found = true;
  }

  try { await page.screenshot({ path: path.join(SHOT, "d8_final.png") }); } catch (e) { console.log("SHOT_FAIL", e.message); }
  if (found) {
    // Click Add a note if present
    const noteBtn = await page.evaluateHandle(() => Array.from(document.querySelectorAll("button")).find(b => /Add a note/i.test(b.textContent || "")));
    if (noteBtn.asElement()) { await noteBtn.asElement().click(); await sleep(3000); }
    const ta = await page.evaluate(() => Array.from(document.querySelectorAll("textarea")).filter(a => a.offsetParent !== null).map(a => ({ id: a.id, name: a.name, ph: a.placeholder })));
    console.log("TEXTAREA:", JSON.stringify(ta));
    try { await page.screenshot({ path: path.join(SHOT, "d8_note.png") }); } catch {}
  }
  await browser.close();
  console.log("DONE");
})().catch(e => { console.error("FATAL", e); process.exit(1); });
