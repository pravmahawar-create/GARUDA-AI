const puppeteer = require("puppeteer");
const path = require("path");
const REPO = path.join(__dirname, "..");
const PROFILE = path.join(REPO, ".chrome-profile", "garuda");
const SHOT = path.join(REPO, "output", "client_hunt");
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const SLUGS = ["pronojitsingh", "mohit-jain-264a7315b"];

(async () => {
  const browser = await puppeteer.launch({
    headless: false, userDataDir: PROFILE,
    args: ["--no-sandbox", "--window-size=1440,900"],
    defaultViewport: null, protocolTimeout: 180000
  });
  const pages = await browser.pages();
  const page = pages[0] || await browser.newPage();
  page.setDefaultTimeout(20000);

  page.on("console", m => { const t = m.text(); if (/error|fail|invite|connect|429|captcha|challenge/i.test(t)) console.log("  CONSOLE:", t.slice(0, 200)); });
  page.on("requestfailed", r => console.log("  REQFAIL:", r.url().slice(0, 140), r.failure()?.errorText));
  page.on("response", r => { const u = r.url(); if (/voyager|invitation|invite|challenge|captcha/i.test(u)) console.log("  RESP:", r.status(), u.slice(0, 140)); });
  browser.on("targetcreated", t => console.log("  NEW_TARGET:", t.type(), t.url().slice(0, 120)));

  for (const slug of SLUGS) {
    console.log(`\n### ${slug}`);
    await page.goto(`https://www.linkedin.com/in/${slug}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await sleep(6000);
    const moreBox = await page.evaluate(() => {
      const hit = Array.from(document.querySelectorAll("main div[role='button'], main button")).find(e => (e.textContent||"").trim()==="More" && e.offsetParent!==null);
      if (!hit) return null;
      const r = hit.getBoundingClientRect();
      return { x: r.x + r.width/2, y: r.y + r.height/2 };
    });
    if (!moreBox) { console.log("  NO_MORE"); continue; }
    await page.mouse.click(moreBox.x, moreBox.y);
    await sleep(3000);
    const connBox = await page.evaluate(() => {
      const menu = document.querySelector("div[role='menu']");
      if (!menu) return null;
      const hit = Array.from(menu.querySelectorAll("[role='menuitem']")).find(e => (e.textContent||"").trim()==="Connect");
      if (!hit) return null;
      const r = hit.getBoundingClientRect();
      return { x: r.x + r.width/2, y: r.y + r.height/2 };
    });
    if (!connBox) { console.log("  NO_CONNECT"); await page.keyboard.press("Escape"); continue; }
    console.log("  clicking Connect via real mouse at", connBox);
    await page.mouse.click(connBox.x, connBox.y);
    for (let i = 1; i <= 10; i++) {
      await sleep(2000);
      const state = await page.evaluate(() => {
        const dlg = Array.from(document.querySelectorAll("[role='dialog'], [aria-modal='true'], [class*='artdeco-modal'], [class*='deco-modal']"));
        return {
          n: dlg.length,
          txt: dlg.map(e => (e.innerText||"").slice(0,120)),
          url: location.href,
          hasInvitationText: /invite .* to connect|invite pronojit|invite mohit/i.test(document.body.innerText)
        };
      });
      console.log(`  T+${i*2}s:`, JSON.stringify(state));
      if (state.n > 0) break;
    }
    await page.screenshot({ path: path.join(SHOT, `probe_${slug}.png`), timeout: 15000 }).catch(()=>{});
    const pagesNow = await browser.pages();
    console.log("  pages:", pagesNow.length, await Promise.all(pagesNow.map(p => p.url().catch(()=>"?"))));
    await page.keyboard.press("Escape");
    await sleep(3000);
  }
  await browser.close();
})().catch(e => { console.error("FATAL", e.message); process.exit(1); });
