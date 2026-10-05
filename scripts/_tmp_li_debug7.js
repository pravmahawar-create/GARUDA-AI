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
    ["pointerdown", "mousedown", "pointerup", "mouseup", "click"].forEach(t =>
      el.dispatchEvent(t.startsWith("pointer") ? new PointerEvent(t, { bubbles: true }) : new MouseEvent(t, { bubbles: true })));
    return true;
  }, expr);
}

(async () => {
  const browser = await puppeteer.launch({
    headless: false, userDataDir: PROFILE,
    args: ["--no-sandbox", "--window-size=1440,900", "--start-maximized"],
    defaultViewport: null, protocolTimeout: 300000
  });
  const page = (await browser.pages())[0] || await browser.newPage();
  page.setDefaultTimeout(30000);
  await page.goto("https://www.linkedin.com/in/pronojitsingh/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await sleep(7000);

  await xpathClick(page, "(//*[self::button or @role='button'][normalize-space(.)='More'])[1]");
  await sleep(3000);
  await xpathClick(page, "(//div[@role='menu']//*[normalize-space(.)='Connect'])[1]");
  console.log("CONNECT_CLICKED");

  for (let i = 1; i <= 4; i++) {
    await sleep(3000);
    const s = await page.evaluate(() => ({
      dlg: Array.from(document.querySelectorAll("div[role='dialog']")).map(d => (d.innerText || "").slice(0, 250)),
      allModals: Array.from(document.querySelectorAll("[class*='modal'], [class*='Modal']")).filter(e => e.offsetParent !== null).map(e => ({ cls: (e.className || "").toString().slice(0, 60), txt: (e.innerText || "").slice(0, 200) })).slice(0, 6),
      hasNoteBtn: !!Array.from(document.querySelectorAll("button")).find(b => /Add a note/i.test(b.textContent || "")),
      ta: Array.from(document.querySelectorAll("textarea")).filter(a => a.offsetParent !== null).map(a => a.id || a.name),
      head: (document.body.innerText || "").replace(/\s+/g, " ").slice(0, 250)
    }));
    console.log(`T+${i * 3}s:`, JSON.stringify(s));
    if (s.dlg.length || s.hasNoteBtn || s.ta.length) break;
  }

  // Try wait for dialog with catch
  try {
    await page.waitForSelector("div[role='dialog']", { timeout: 10000 });
    console.log("DIALOG_APPEARED");
  } catch { console.log("NO_DIALOG_10s"); }

  try { await page.screenshot({ path: path.join(SHOT, "d7_final.png") }); } catch (e) { console.log("SHOT_FAIL", e.message); }
  await browser.close();
})().catch(e => { console.error("FATAL", e); process.exit(1); });
