require("dotenv").config();
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const PROFILE_DIR = path.resolve(__dirname, "../.chrome-profile/garuda");
const OUT = path.resolve(__dirname, "../output");
const LEDGER = path.resolve(__dirname, "../data/leads/unified_leads_ledger.json");
const REPORT = path.resolve(__dirname, "../data/leads/client_hunt_report.json");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const human = () => sleep(4000 + Math.random() * 4000);

// READ-ONLY scout: search pages only, no profile visits, no reactions, no comments, no DMs.
const QUERIES = [
  { kw: "looking for a web developer", intent: "WEBSITE_DEV" },
  { kw: "need a website for my business", intent: "WEBSITE_DEV" },
  { kw: "need an app developed for my business", intent: "APP_DEV" },
  { kw: "hiring freelance web developer", intent: "WEBSITE_DEV" }
];
const MAX_PER_QUERY = 6;

const INTENT_RE = /website|web dev|web developer|ecommerce|e-commerce|landing page|app (development|developer|for my)|mobile app|android app|ios app|build (a|an|our|my) (website|app)|redesign/i;

(async () => {
  let ledger = [];
  try { ledger = JSON.parse(fs.readFileSync(LEDGER, "utf8")); } catch (e) {}
  const seen = new Set(ledger.map((l) => (l.profileUrl || l.author || "").toLowerCase()));

  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: false,
    userDataDir: PROFILE_DIR,
    args: ["--no-sandbox", "--disable-blink-features=AutomationControlled", "--window-size=1366,900"],
    defaultViewport: null
  });
  const page = (await browser.pages())[0] || (await browser.newPage());
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.8010.53 Safari/537.36");

  const harvested = [];
  try {
    const t0 = Date.now();
    for (const q of QUERIES) {
      if (Date.now() - t0 > 480000) { console.log("[SCOUT] time budget hit, stopping"); break; }
      const url = `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(q.kw)}&origin=GLOBAL_SEARCH_HEADER`;
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await sleep(8000);
      await page.mouse.wheel({ deltaY: 700 });
      await sleep(3000);

      const posts = await page.evaluate((intent) => {
        const main = document.querySelector("main") || document.body;
        const text = main.innerText || "";
        const profileLinks = {};
        for (const a of document.querySelectorAll('a[href*="linkedin.com/in/"]')) {
          const nm = (a.innerText || "").trim();
          if (nm && nm.length < 60 && !profileLinks[nm]) profileLinks[nm] = a.href.split("?")[0];
        }
        const chunks = text.split(/\bFeed post\b/).slice(1);
        const out = [];
        const seenText = new Set();
        for (const ch of chunks) {
          if (/Promoted/i.test(ch)) continue;
          const lines = ch.split("\n").map((l) => l.trim()).filter(Boolean);
          if (lines.length < 3) continue;
          const joined = lines.join(" ");
          if (!/looking for|need|hiring|require|want to build|seeking|freelance/i.test(joined)) continue;
          if (seenText.has(joined.slice(0, 120))) continue;
          seenText.add(joined.slice(0, 120));
          const author = lines[0].replace(/\sfollows this page$/, "").trim();
          let authorUrl = null;
          for (const [nm, u] of Object.entries(profileLinks)) {
            if (nm === author || author.includes(nm) || nm.includes(author)) { authorUrl = u; break; }
          }
          out.push({ author, meta: (lines[1] || "").slice(0, 100), authorUrl, intent, excerpt: joined.slice(0, 400) });
          if (out.length >= 8) break;
        }
        return out;
      }, q.intent);

      const qualified = posts.filter((p) => INTENT_RE.test(p.excerpt));
      console.log(`[SCOUT] "${q.kw}" raw=${posts.length} qualified=${qualified.length}`);
      harvested.push(...qualified.slice(0, MAX_PER_QUERY));
      await human();
    }

    const fresh = [];
    for (const h of harvested) {
      const key = (h.authorUrl || h.author || "").toLowerCase();
      if (!key || seen.has(key)) continue;
      if (!INTENT_RE.test(h.excerpt)) continue;
      seen.add(key);
      const rec = {
        author: h.author,
        username: (h.authorUrl || "").split("/in/")[1] || null,
        profileUrl: h.authorUrl,
        platform: "linkedin",
        intent: h.intent,
        snippet: h.excerpt,
        recordedAt: new Date().toISOString(),
        source: "client_hunt_scout_v1"
      };
      fresh.push(rec);
      ledger.push(rec);
    }
    fs.writeFileSync(LEDGER, JSON.stringify(ledger, null, 2));
    fs.writeFileSync(REPORT, JSON.stringify({ runAt: new Date().toISOString(), queries: QUERIES.map((q) => q.kw), harvested: harvested.length, freshLeads: fresh.length, leads: fresh }, null, 2));
    fs.writeFileSync(path.join(OUT, "client_hunt_scout.png"), await page.screenshot({ encoding: "binary" }).catch(() => ""));

    console.log("FRESH_LEADS=" + fresh.length);
    fresh.forEach((f, i) => console.log(`  ${i + 1}. ${f.author} ${f.profileUrl || "no-url"} — ${f.snippet.slice(0, 90)}…`));
    console.log("SCOUT_DONE");
  } catch (e) {
    console.error("ERR:", e.message);
    await page.screenshot({ path: path.join(OUT, "client_hunt_error.png") }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
