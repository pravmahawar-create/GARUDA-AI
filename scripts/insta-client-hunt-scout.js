require("dotenv").config();
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const OUT = path.resolve(__dirname, "../output");
const LEDGER = path.resolve(__dirname, "../data/leads/unified_leads_ledger.json");
const REPORT = path.resolve(__dirname, "../data/leads/insta_client_hunt_report.json");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const human = () => sleep(5000 + Math.random() * 5000);

// READ-ONLY: hashtag/explore pages only. No likes, no follows, no comments, no DMs, no profile opens.
const TAGS = ["needwebsite", "lookingforwebdeveloper", "needdeveloper", "appdevelopment", "websitedesign"];
const MAX_PER_TAG = 5;

const INTENT_RE = /website|web dev|web developer|ecommerce|e-commerce|landing page|mobile app|app (for|development|developer)|build (a|an|our|my) (website|app)|redesign|shopify|wordpress/i;
const BUYER_RE = /looking for|need|want|hiring|seeking|require|anyone know|recommend a|freelance/i;
const SELLER_RE = /we build|we craft|our services|dm us|contact us|offering|we are an agency|hire us/i;

(async () => {
  let ledger = [];
  try { ledger = JSON.parse(fs.readFileSync(LEDGER, "utf8")); } catch (e) {}
  const seen = new Set(ledger.map((l) => ((l.profileUrl || l.username || l.author || "") + "").toLowerCase()));

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

  const harvested = [];
  try {
    const t0 = Date.now();
    for (const tag of TAGS) {
      if (Date.now() - t0 > 420000) { console.log("[IG-SCOUT] time budget hit"); break; }
      const url = `https://www.instagram.com/explore/tags/${encodeURIComponent(tag)}/`;
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await sleep(7000);

      const loggedIn = await page.evaluate(() => !document.querySelector("input[name='username']"));
      if (!loggedIn) { console.log("[IG-SCOUT] NOT_LOGGED_IN - aborting"); break; }

      const posts = await page.evaluate((tag) => {
        const out = [];
        const seenLinks = new Set();
        for (const a of document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]')) {
          const href = a.href.split("?")[0];
          if (seenLinks.has(href)) continue;
          seenLinks.add(href);
          const alt = (a.querySelector("img")?.alt || a.getAttribute("aria-label") || "").trim();
          if (alt) out.push({ href, alt: alt.slice(0, 500), tag });
          if (out.length >= 10) break;
        }
        return out;
      }, tag);

      const qualified = posts.filter((p) => INTENT_RE.test(p.alt) && BUYER_RE.test(p.alt) && !SELLER_RE.test(p.alt));
      console.log(`[IG-SCOUT] #${tag} raw=${posts.length} qualified=${qualified.length}`);
      harvested.push(...qualified.slice(0, MAX_PER_TAG));
      await human();
    }

    const fresh = [];
    for (const h of harvested) {
      const key = h.href.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const rec = {
        author: null,
        username: null,
        profileUrl: h.href,
        platform: "instagram",
        intent: "WEBSITE_OR_APP_DEV",
        snippet: h.alt,
        hashtag: h.tag,
        recordedAt: new Date().toISOString(),
        source: "insta_client_hunt_scout_v1"
      };
      fresh.push(rec);
      ledger.push(rec);
    }
    fs.writeFileSync(LEDGER, JSON.stringify(ledger, null, 2));
    fs.writeFileSync(REPORT, JSON.stringify({ runAt: new Date().toISOString(), tags: TAGS, harvested: harvested.length, freshLeads: fresh.length, leads: fresh }, null, 2));
    await page.screenshot({ path: path.join(OUT, "insta_scout_final.png") });

    console.log("IG_FRESH_LEADS=" + fresh.length);
    fresh.forEach((f, i) => console.log(`  ${i + 1}. ${f.profileUrl} — ${f.snippet.slice(0, 100)}…`));
    console.log("IG_SCOUT_DONE");
  } catch (e) {
    console.error("ERR:", e.message);
    await page.screenshot({ path: path.join(OUT, "insta_scout_error.png") }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
