const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const REPO = path.join(__dirname, "..");
const PROFILE = path.join(REPO, ".chrome-profile", "garuda");
const SHOT = path.join(REPO, "output", "client_hunt");
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const SLUGS = ["pronojitsingh", "priyanshu-thakur-180094304", "mohit-jain-264a7315b", "vardhankore"];

(async () => {
  const browser = await puppeteer.launch({
    headless: false, userDataDir: PROFILE,
    args: ["--no-sandbox", "--window-size=1440,900"],
    defaultViewport: null, protocolTimeout: 180000
  });
  const page = (await browser.pages())[0] || await browser.newPage();
  page.setDefaultTimeout(20000);

  for (const slug of SLUGS) {
    await page.goto(`https://www.linkedin.com/in/${slug}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await sleep(6000);
    const moreBox = await page.evaluate(() => {
      const cands = Array.from(document.querySelectorAll("main div[role='button'], main button"));
      const hit = cands.find(e => (e.textContent || "").trim() === "More" && e.offsetParent !== null);
      if (!hit) return null;
      const r = hit.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    if (!moreBox) { console.log(`### ${slug}: NO_MORE_BUTTON`); continue; }
    await page.mouse.click(moreBox.x, moreBox.y);
    await sleep(2500);
    const menuDump = await page.evaluate(() => {
      const menu = document.querySelector("div[role='menu']");
      const allDialogs = Array.from(document.querySelectorAll("[role='dialog'], [role='menu'], [class*='modal']")).map(e => ({ cls: e.className.slice(0,60), txt: (e.innerText||"").slice(0,150) }));
      return {
        menuExists: !!menu,
        menuItems: menu ? Array.from(menu.querySelectorAll("[role='menuitem']")).map(e => (e.textContent||"").trim()) : [],
        dialogs: allDialogs
      };
    });
    console.log(`### ${slug}: ${JSON.stringify(menuDump)}`);
    await page.screenshot({ path: path.join(SHOT, `menu_${slug}.png`), timeout: 15000 }).catch(()=>{});

    // Click exact menuitem 'Connect' if present
    const clicked = await page.evaluate(() => {
      const menu = document.querySelector("div[role='menu']");
      if (!menu) return "NO_MENU";
      const hit = Array.from(menu.querySelectorAll("[role='menuitem']")).find(e => (e.textContent||"").trim() === "Connect");
      if (!hit) return "NO_CONNECT_ITEM";
      hit.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      hit.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      hit.click();
      return "CLICKED";
    });
    console.log(`  connectClick=${clicked}`);
    await sleep(5000);
    const after = await page.evaluate(() => ({
      url: location.href,
      dialogs: Array.from(document.querySelectorAll("[role='dialog']")).map(e => (e.innerText||"").slice(0,400)),
      popups: Array.from(document.querySelectorAll("input, textarea, [contenteditable='true']")).filter(e=>e.offsetParent!==null).map(e => (e.placeholder||e.getAttribute("aria-label")||e.tagName).slice(0,80))
    }));
    console.log(`  after=${JSON.stringify(after)}`);
    await page.screenshot({ path: path.join(SHOT, `afterconn_${slug}.png`), timeout: 15000 }).catch(()=>{});
    await sleep(8000);
    const late = await page.evaluate(() => ({
      dialogs: Array.from(document.querySelectorAll("[role='dialog']")).map(e => (e.innerText||"").slice(0,400)),
      toast: Array.from(document.querySelectorAll("[class*='artdeco-toast'], [class*='toast']")).map(e=>(e.innerText||"").slice(0,200))
    }));
    console.log(`  late=${JSON.stringify(late)}`);
    await page.keyboard.press("Escape");
    await sleep(2000);
  }
  await browser.close();
})().catch(e => { console.error("FATAL", e.message); process.exit(1); });
