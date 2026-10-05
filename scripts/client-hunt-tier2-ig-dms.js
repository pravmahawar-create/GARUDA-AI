/**
 * GARUDA Multi-Tier Client Hunt — TIER 2: INSTAGRAM DM DISPATCH (4 leads)
 * Aadesh: founder 2026-10-01 — 3-4 tier attack, personal hot-list feel, rates per their work.
 * Anti-ban: 4 messages only, 60-120s human delays, session-cookie auth, proof screenshot each.
 */
require("dotenv").config();
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const LOG_PATH = path.join(__dirname, "..", "data", "leads", "client_hunt_dispatch_log.json");
const SHOT_DIR = path.join(__dirname, "..", "output", "client_hunt");
fs.mkdirSync(SHOT_DIR, { recursive: true });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const human = () => sleep(60000 + Math.random() * 60000);

const TARGETS = [
  { key: "rank1_nisarga_ig", user: "avintvnews123", lead: "Nisarga Care", msg: "Hi! Saw your post about redesigning nisargacare.com WITHOUT touching the Google index — that exact constraint is our specialty.\n\nFree 3-point audit:\n1) Your <title> tag is ~250 keywords — Google cuts at ~60, so 'Nisarga Care' never shows in SERPs (over-optimization risk on medical/YMYL sites).\n2) Homepage repeats keyword blocks — exactly what Google Helpful Content demotes for healthcare.\n3) Fix: same URLs + 301 map + Search Console monitoring — every ranking & backlink survives.\n\nRate (transparent, fixed): SEO-safe redesign ₹30,000 · 50% milestone. Optional WhatsApp AI receptionist ₹20,000.\n\nScope chat: https://www.garudaos.in/chat?ref=nisargacare\n— Praveen Mahawar, Founder, GARUDA OS" },
  { key: "rank2_trivanta_ig", user: "thecrystanova", lead: "Trivanta Hospitality", msg: "Hi! Saw your post for Trivanta Hospitality Group — premium, luxury website.\n\nTwo things agencies miss:\n1) Luxury is decided in the first 2 seconds — we art-direct around YOUR property photography, no stock hotel templates.\n2) OTA commissions run 15-25% — we build the direct inquiry/booking funnel into the site so guests book YOU.\n\nRate (fixed): luxury website + booking funnel ₹30,000 · 50% milestone. Booking automation add-on ₹25,000.\n\nScope chat: https://www.garudaos.in/chat?ref=trivanta\n— Praveen Mahawar, Founder, GARUDA OS" },
  { key: "rank3_tasties_ig", user: "ms.tasties_", lead: "Multi-site luxury owner", msg: "Hi! Saw your post — 'CREATIVE not basic', luxury branding, Shopify, restaurants, long-term partner, and 'no receipts = no DM'. Fair. So receipts:\n\nEvery GARUDA build gets its own art direction (no templates), cinematic scroll showcases, conversion-first checkout, SHA-256 verified deploys.\n\nPricing (transparent fixed): per-site design ₹30,000 · conversion automation ₹25,000 · 50% milestone, you own 100% of the code.\nTurnaround: production live in days, not months.\n\nSend the site you think looks 'basic' — free concrete redesign direction before you decide anything.\nScope: https://www.garudaos.in/chat?ref=luxuryrevamp" },
  { key: "rank4_ukjack_ig", user: "socialmedia2evolve", lead: "Jack (UK collab)", msg: "Hi Jack! Saw your post looking for a UK-based web dev collaborator for upcoming client projects.\n\nWe run as your silent white-label bench: NDA-ready, UK-hours overlap for same-day feedback loops, you keep the client + margin, we ship design + build with deployment proof per release.\n\nRates: client websites from ₹30,000 (~£280) so your UK margin stays healthy · SaaS MVPs ₹50,000.\n\nOne test project first — you judge the work before any commitment.\nScope: https://www.garudaos.in/chat?ref=ukcollab" }
];

(async () => {
  console.log("=====================================================");
  console.log("GARUDA TIER-2 IG DM DISPATCH — 4 leads");
  console.log("=====================================================");
  const log = JSON.parse(fs.readFileSync(LOG_PATH, "utf8"));

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,900"]
  });
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.8010.53 Safari/537.36");
  await page.setCookie(
    { name: "sessionid", value: process.env.INSTAGRAM_SESSION_ID, domain: ".instagram.com", path: "/" },
    { name: "ds_user_id", value: process.env.INSTAGRAM_USER_ID, domain: ".instagram.com", path: "/" }
  );

  let idx = 0;
  for (const t of TARGETS) {
    idx++;
    if ((log.dispatched || []).some(d => d.key === t.key && d.status === "SENT")) { console.log("SKIP:", t.key); continue; }
    const rec = { key: t.key, channel: "instagram_dm", target: "@" + t.user, lead: t.lead, at: new Date().toISOString() };
    try {
      await page.goto(`https://www.instagram.com/${t.user}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
      await sleep(6500);
      const loggedIn = await page.evaluate(() => !document.querySelector("input[name='username']"));
      if (!loggedIn) throw new Error("NOT_LOGGED_IN");

      // Click "Message" button on profile
      const clicked = await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll("a,button,div[role='button']"));
        const btn = els.find(e => /^message$/i.test((e.textContent || "").trim()) && e.getAttribute("href")?.includes("/direct"));
        if (btn) { btn.click(); return btn.getAttribute("href") || "clicked"; }
        const anyBtn = els.find(e => /^message$/i.test((e.textContent || "").trim()));
        if (anyBtn) { anyBtn.click(); return "clicked-no-href"; }
        return null;
      });
      console.log(`[${idx}/4] ${t.user} message-btn:`, clicked || "NOT_FOUND");
      await sleep(6000);

      if (!clicked) {
        // Fallback: direct new-message thread URL
        await page.goto(`https://www.instagram.com/direct/new/`, { waitUntil: "domcontentloaded", timeout: 60000 });
        await sleep(5000);
        const searchBox = await page.$("input[name='query_box'], input[placeholder*='Search'], input[aria-label*='Search']");
        if (searchBox) {
          await searchBox.click();
          await page.keyboard.type(t.user, { delay: 60 });
          await sleep(4500);
          await page.keyboard.press("Enter");
          await sleep(3500);
          await page.keyboard.press("Enter");
          await sleep(5000);
        }
      }

      const box = await page.$("div[role='textbox'][contenteditable='true'], div[contenteditable='true'][role='textbox']");
      if (!box) throw new Error("CHAT_TEXTBOX_NOT_FOUND");
      await box.click();
      await sleep(1200);
      // Type message in chunks to avoid IG rate-limiting on long text
      const chunks = t.msg.match(/[\s\S]{1,180}/g) || [];
      for (const c of chunks) { await page.keyboard.type(c, { delay: 18 }); await sleep(350); }
      await sleep(1500);
      await page.screenshot({ path: path.join(SHOT_DIR, `${t.key}_preview.png`) });
      await page.keyboard.press("Enter");
      await sleep(5500);
      await page.screenshot({ path: path.join(SHOT_DIR, `${t.key}_sent.png`) });

      rec.status = "SENT";
      rec.proof = [`output/client_hunt/${t.key}_preview.png`, `output/client_hunt/${t.key}_sent.png`];
      console.log(`  ✅ SENT to ${t.user}`);
    } catch (e) {
      rec.status = "FAILED";
      rec.error = e.message;
      console.log(`  ❌ FAIL ${t.user}: ${e.message}`);
      try { await page.screenshot({ path: path.join(SHOT_DIR, `${t.key}_error.png`) }); } catch {}
    }
    log.dispatched.push(rec);
    fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2));
    if (idx < TARGETS.length) await human();
  }

  await browser.close();
  console.log("TIER-2 IG DM DISPATCH COMPLETE");
})().catch(e => { console.error("FATAL:", e.message); process.exit(1); });
