const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const REPO = path.join(__dirname, "..");
const PROFILE = path.join(REPO, ".chrome-profile", "garuda");
const SHOT = path.join(REPO, "output", "client_hunt");
const LOG_PATH = path.join(REPO, "data", "leads", "client_hunt_dispatch_log.json");
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const TARGETS = [
  { key: "rank5_maxval_li", slug: "pronojitsingh", lead: "Pronojit Singh — MaxVal",
    note: "Pronojit — before MaxVal's web-dev hiring loop starts: dedicated build bench starts THIS WEEK vs 6-8 wk hire, scales per sprint vs ₹12-18L fixed cost. Websites ₹30,000 fixed, 50% milestone, proof per deploy. 15 min to compare?" },
  { key: "rank6_dojo_li", slug: "priyanshu-thakur-180094304", lead: "Dojo Eats (Shopify hiring)",
    note: "Saw the Shopify developer hiring signal for Dojo Eats. Food D2C store IS the margin: conversion-first build, launch QA (payment/shipping/tax), live in days. Fixed ₹30,000 + order automation ₹20-25K, 50% milestone, code 100% yours. Scope chat garudaos.in/chat?ref=dojo" },
  { key: "rank7_mohit_li", slug: "mohit-jain-264a7315b", lead: "Mohit Jain",
    note: "Mohit — saw you're hiring a freelance web dev. Freelancers vanish mid-project; agencies lock retainers. We're between: fixed-scope build ₹30,000, deployment proof per release, you own 100% code. Send scope — plan same-day." },
  { key: "rank8_ashok_li", slug: "vardhankore", lead: "Ashok Vardhan Kore",
    note: "Ashok — for your friend looking for a web dev: custom design, fast delivery, code they fully own. Fixed-scope website ₹30,000, 50% milestone, days-not-months with deploy proof. Have them share scope — plan same-day." }
];

async function textOf(page, selector) { return page.evaluate(s => Array.from(document.querySelectorAll(s)).map(e => (e.textContent || "").trim()), selector); }

(async () => {
  console.log("LI_CONNECT_FINAL start", new Date().toISOString());
  const log = JSON.parse(fs.readFileSync(LOG_PATH, "utf8"));
  const browser = await puppeteer.launch({
    headless: false, userDataDir: PROFILE,
    args: ["--no-sandbox", "--window-size=1440,900", "--start-maximized"],
    defaultViewport: null, protocolTimeout: 240000
  });
  const page = (await browser.pages())[0] || await browser.newPage();
  page.setDefaultTimeout(25000);

  for (const t of TARGETS) {
    if ((log.dispatched || []).some(d => d.key === t.key && d.status === "SENT")) { console.log("SKIP", t.key); continue; }
    const rec = { key: t.key, channel: "linkedin_connect_note", target: t.slug, lead: t.lead, at: new Date().toISOString() };
    try {
      await page.goto(`https://www.linkedin.com/in/${t.slug}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
      await sleep(7000);

      // Click More (action bar buttons)
      const moreClicked = await page.evaluate(() => {
        const cands = Array.from(document.querySelectorAll("main div[role='button'], main button"));
        const hit = cands.find(e => (e.textContent || "").trim() === "More" && e.offsetParent !== null);
        if (!hit) return false;
        const r = hit.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      });
      if (!moreClicked) throw new Error("MORE_NOT_FOUND");
      await page.mouse.click(moreClicked.x, moreClicked.y);
      await sleep(3000);
      console.log(`[${t.key}] More menu opened`);

      // Click Connect menuitem
      const connBox = await page.evaluate(() => {
        const menu = document.querySelector("div[role='menu']");
        if (!menu) return null;
        const hit = Array.from(menu.querySelectorAll("[role='menuitem'], a, button, div")).find(e => (e.textContent || "").trim() === "Connect" && e.offsetParent !== null);
        if (!hit) return null;
        const r = hit.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      });
      if (!connBox) throw new Error("CONNECT_NOT_IN_MENU");
      await page.mouse.click(connBox.x, connBox.y);
      console.log(`[${t.key}] Connect clicked`);

      // Wait for invite dialog
      let dialogSeen = false;
      try { await page.waitForSelector("div[role='dialog']", { timeout: 15000 }); dialogSeen = true; } catch {}
      if (!dialogSeen) {
        const dump = await page.evaluate(() => ({
          url: location.href,
          overlays: Array.from(document.querySelectorAll("[class*='artdeco-modal'], [class*='deco-modal'], [data-test-modal]")).map(e => (e.innerText || "").slice(0, 200)),
          bodyHas: /invite|invitation|Upgrade|Premium/i.test(document.body.innerText)
        }));
        throw new Error("NO_INVITE_DIALOG " + JSON.stringify(dump).slice(0, 300));
      }
      await sleep(2000);

      // Add a note
      const noteAdded = await page.evaluate(() => {
        const b = Array.from(document.querySelectorAll("div[role='dialog'] button")).find(x => /Add a note/i.test(x.textContent || ""));
        if (!b) return false;
        b.click();
        return true;
      });
      if (noteAdded) await sleep(2500);
      console.log(`[${t.key}] addNote=${noteAdded}`);

      // Type note
      const typed = await page.evaluate((txt) => {
        const ta = Array.from(document.querySelectorAll("div[role='dialog'] textarea, div[role='dialog'] [contenteditable='true']")).find(e => e.offsetParent !== null);
        if (!ta) return false;
        ta.focus();
        return true;
      }, t.note);
      if (!typed) throw new Error("NOTE_BOX_NOT_FOUND");
      await page.keyboard.type(t.note, { delay: 15 });
      await sleep(1500);
      try { await page.screenshot({ path: path.join(SHOT, `${t.key}_preview.png`), timeout: 15000 }); } catch (e) { console.log("shot fail", e.message); }

      // Send invitation
      const sent = await page.evaluate(() => {
        const b = Array.from(document.querySelectorAll("div[role='dialog'] button")).find(x => /^(Send invitation|Send)$/i.test((x.textContent || "").trim()));
        if (!b) return false;
        b.disabled ? (b.getAttribute("aria-disabled") === "true" ? false : (b.click(), true)) : (b.click(), true);
      });
      if (!sent) throw new Error("SEND_BTN_NOT_FOUND");
      await sleep(6000);
      try { await page.screenshot({ path: path.join(SHOT, `${t.key}_sent.png`), timeout: 15000 }); } catch {}
      rec.status = "SENT";
      rec.proof = [`output/client_hunt/${t.key}_preview.png`, `output/client_hunt/${t.key}_sent.png`];
      console.log(`✅ ${t.key} invite+note SENT`);
    } catch (e) {
      rec.status = "FAILED";
      rec.error = e.message;
      console.log(`❌ ${t.key}: ${e.message}`);
      try { await page.screenshot({ path: path.join(SHOT, `${t.key}_error.png`), timeout: 12000 }); } catch {}
    }
    log.dispatched.push(rec);
    fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2));
    await sleep(70000 + Math.random() * 50000);
  }

  await browser.close();
  console.log("LI_CONNECT_FINAL done");
})().catch(e => { console.error("FATAL", e.message); process.exit(1); });
