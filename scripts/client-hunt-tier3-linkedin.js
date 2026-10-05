/**
 * GARUDA Multi-Tier Client Hunt — TIER 3: LINKEDIN DM / CONNECT-NOTE DISPATCH (4 leads)
 * Aadesh: founder 2026-10-01 — 3-4 tier attack, personal hot-list feel, rates per their work.
 * Flow per profile: Message button available → full DM; else → Connect with personalized note (≤280 chars).
 * Anti-ban: 4 profiles only, 70-130s human delays, persistent GARUDA profile, proof screenshot each.
 */
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const REPO = path.join(__dirname, "..");
const PROFILE = path.join(REPO, ".chrome-profile", "garuda");
const LOG_PATH = path.join(REPO, "data", "leads", "client_hunt_dispatch_log.json");
const SHOT_DIR = path.join(REPO, "output", "client_hunt");
fs.mkdirSync(SHOT_DIR, { recursive: true });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const human = () => sleep(70000 + Math.random() * 60000);

const TARGETS = [
  {
    key: "rank5_maxval_li", slug: "pronojitsingh", lead: "Pronojit Singh — MaxVal",
    dm: "Hi Pronojit — saw MaxVal is expanding the web team. Quick reframe before the hiring loop starts: for project-based web delivery, a dedicated build partner beats a new full-time hire — start this week vs 6-8 weeks sourcing, scale per sprint vs fixed ₹12-18L cost between projects. We run as an invisible delivery unit: design + full-stack + QA with deployment proof per release. Rates: websites ₹30,000 · automation ₹25,000 · custom software ₹50,000 (fixed, 50% milestone). Worth 15 minutes vs your hiring plan? https://www.garudaos.in/chat?ref=maxval",
    note: "Pronojit — before MaxVal's web-dev hiring loop starts: dedicated build bench starts THIS WEEK vs 6-8 wk hire cycle, scales per sprint vs ₹12-18L fixed cost. Websites ₹30,000 fixed, 50% milestone, proof per deploy. 15 min to compare?"
  },
  {
    key: "rank6_dojo_li", slug: "priyanshu-thakur-180094304", lead: "Ashutosh Nandi — Dojo Eats",
    dm: "Hi Ashutosh — saw Dojo Eats is hiring a freelance Shopify developer. For a food D2C brand the store IS the margin: every extra second at mobile checkout costs real orders. We ship conversion-first builds, custom brand design, launch QA (payment/shipping/tax tested end-to-end) — live in days. Fixed rates: store build ₹30,000 · order automation ₹20,000-25,000, 50% milestone, code 100% yours. Scope: https://www.garudaos.in/chat?ref=dojo",
    note: "Ashutosh — saw Dojo Eats is hiring a freelance Shopify dev. Store IS the margin for food D2C: conversion-first build, launch QA (payment/shipping/tax), live in days. Fixed ₹30,000 + order automation ₹20-25K, 50% milestone. Scope?"
  },
  {
    key: "rank7_mohit_li", slug: "mohit-jain-264a7315b", lead: "Mohit Jain",
    dm: "Hi Mohit — saw you're hiring a freelance web developer. Straight comparison: freelancers vanish mid-project (you re-hire twice), agencies lock you into retainers. We're in between — fixed-scope builds, deployment proof per release, you own 100% code from day one. Rate: website ₹30,000 fixed, 50% milestone, timeline locked same-day on scope. What needs building? https://www.garudaos.in/chat?ref=mohit",
    note: "Mohit — saw you're hiring a freelance web dev. Freelancers vanish mid-project; agencies lock retainers. We're between: fixed-scope build ₹30,000, deployment proof per release, you own 100% code. Send scope, get plan same-day."
  },
  {
    key: "rank8_ashok_li", slug: "vardhankore", lead: "Ashok Vardhan Kore",
    dm: "Hi Ashok — saw your post that a friend is looking for a web developer. Happy to point them right either way. If they want it built properly (custom design, fast delivery, code they fully own), we take fixed-scope projects: website ₹30,000 fixed, 50% milestone, shipped in days with deployment proof. Have them share scope: https://www.garudaos.in/chat?ref=ashok",
    note: "Ashok — for your friend looking for a web dev: custom design, fast delivery, code they fully own. Fixed-scope website ₹30,000, 50% milestone, days-not-months with deploy proof. Have them share scope — plan same-day."
  }
];

async function findByText(page, selectors, pattern) {
  return page.evaluate((sels, reSrc) => {
    const re = new RegExp(reSrc, "i");
    for (const sel of sels) {
      const els = Array.from(document.querySelectorAll(sel));
      const hit = els.find(e => re.test((e.textContent || "").trim()) && e.offsetParent !== null);
      if (hit) { hit.scrollIntoView({ block: "center" }); hit.click(); return true; }
    }
    return false;
  }, selectors, pattern);
}

(async () => {
  console.log("=====================================================");
  console.log("GARUDA TIER-3 LINKEDIN DISPATCH — 4 leads");
  console.log("=====================================================");
  const log = JSON.parse(fs.readFileSync(LOG_PATH, "utf8"));

  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: PROFILE,
    args: ["--no-sandbox", "--window-size=1440,900", "--start-maximized"],
    defaultViewport: null,
    protocolTimeout: 180000
  });
  const page = (await browser.pages())[0] || await browser.newPage();
  page.setDefaultTimeout(30000);

  await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await sleep(6000);
  const loggedIn = await page.evaluate(() => !document.querySelector('a[href*="signup"]') || !!document.querySelector('header nav'));
  if (!loggedIn) { console.log("NOT_LOGGED_IN — abort"); await browser.close(); process.exit(2); }
  console.log("LinkedIn session OK");

  let idx = 0;
  for (const t of TARGETS) {
    idx++;
    if ((log.dispatched || []).some(d => d.key === t.key && d.status === "SENT")) { console.log("SKIP:", t.key); continue; }
    const rec = { key: t.key, channel: "linkedin", target: t.slug, lead: t.lead, at: new Date().toISOString() };
    try {
      await page.goto(`https://www.linkedin.com/in/${t.slug}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
      await sleep(6500);

      // Try Message button first
      const hasMsg = await findByText(page, ["main a", "main button", "section a", "div.pvs-profile-actions a", "div[role='button']"], "^Message$");
      let method = null;
      if (hasMsg) {
        await sleep(6500);
        const box = await page.$("div.msg-form__contenteditable[contenteditable='true'], div[role='textbox'][contenteditable='true']");
        if (box) {
          await box.click(); await sleep(1200);
          const chunks = t.dm.match(/[\s\S]{1,170}/g) || [];
          for (const c of chunks) { await page.keyboard.type(c, { delay: 16 }); await sleep(300); }
          await sleep(1500);
          await page.screenshot({ path: path.join(SHOT_DIR, `${t.key}_preview.png`) });
          await page.keyboard.down("Control"); await page.keyboard.press("Enter"); await page.keyboard.up("Control");
          await sleep(5500);
          method = "direct_message";
        }
      }

      if (!method) {
        // Fallback: Connect with personalized note
        await page.goto(`https://www.linkedin.com/in/${t.slug}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
        await sleep(6000);
        const hasConnect = await findByText(page, ["main a", "main button", "section a", "div.pvs-profile-actions a", "div[role='button']"], "^Connect$");
        if (!hasConnect) throw new Error("NEITHER_MESSAGE_NOR_CONNECT_FOUND");
        await sleep(5000);
        // Modal → "Add a note"
        const noteBtn = await findByText(page, ["button", "div[role='button']"], "Add a note");
        if (noteBtn) { await sleep(3000); }
        const box = await page.$("textarea[name='message'], div[role='textbox'][contenteditable='true'], textarea#custom-message");
        if (!box) throw new Error("CONNECT_NOTE_BOX_NOT_FOUND");
        await box.click(); await sleep(1000);
        await page.keyboard.type(t.note, { delay: 18 });
        await sleep(1500);
        await page.screenshot({ path: path.join(SHOT_DIR, `${t.key}_preview.png`) });
        const sent = await findByText(page, ["button[aria-label*='Send invitation'], button[aria-label*='Send'], button[type='button']"], "Send");
        if (!sent) await page.keyboard.press("Enter").catch(() => {});
        await sleep(5500);
        method = "connect_with_note";
      }

      await page.screenshot({ path: path.join(SHOT_DIR, `${t.key}_sent.png`) });
      rec.status = "SENT";
      rec.method = method;
      rec.proof = [`output/client_hunt/${t.key}_preview.png`, `output/client_hunt/${t.key}_sent.png`];
      console.log(`  ✅ ${t.key} via ${method}`);
    } catch (e) {
      rec.status = "FAILED";
      rec.error = e.message;
      console.log(`  ❌ ${t.key}: ${e.message}`);
      try { await page.screenshot({ path: path.join(SHOT_DIR, `${t.key}_error.png`) }); } catch {}
    }
    log.dispatched.push(rec);
    fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2));
    if (idx < TARGETS.length) await human();
  }

  await browser.close();
  console.log("TIER-3 LINKEDIN DISPATCH COMPLETE");
})().catch(e => { console.error("FATAL:", e.message); process.exit(1); });
