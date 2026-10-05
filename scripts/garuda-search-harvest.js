require("dotenv").config();
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const PROFILE_DIR = path.resolve(__dirname, "../.chrome-profile/garuda");
const OUT = path.resolve(__dirname, "../output");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const QUERIES = [
  { kw: "Oracle DBA", uni: "oracle-dba" },
  { kw: "Infosys Bengaluru", uni: "infosys-enterprise" },
  { kw: "AI agents enterprise", uni: "ai-agentic" }
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: false,
    userDataDir: PROFILE_DIR,
    args: ["--no-sandbox", "--disable-blink-features=AutomationControlled", "--window-size=1366,900"],
    defaultViewport: null
  });
  const page = (await browser.pages())[0] || (await browser.newPage());
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.8010.53 Safari/537.36");

  const results = [];
  try {
    for (const q of QUERIES) {
      const url = `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(q.kw)}&origin=GLOBAL_SEARCH_HEADER`;
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await sleep(8000);
      await page.mouse.wheel({ deltaY: 700 });
      await sleep(3000);
      await page.mouse.wheel({ deltaY: 900 });
      await sleep(3000);

      const posts = await page.evaluate((uni) => {
        const main = document.querySelector("main") || document.body;
        const text = main.innerText || "";
        const profileLinks = {};
        for (const a of document.querySelectorAll('a[href*="linkedin.com/in/"]')) {
          const nm = (a.innerText || "").trim();
          if (nm && nm.length < 60 && !profileLinks[nm]) profileLinks[nm] = a.href.split("?")[0];
        }
        const chunks = text.split(/\bFeed post\b/).slice(1);
        const out = [];
        for (const ch of chunks) {
          if (/Promoted/i.test(ch)) continue;
          const lines = ch.split("\n").map((l) => l.trim()).filter(Boolean);
          if (lines.length < 3) continue;
          const author = lines[0].replace(/\sfollows this page$/, "").trim();
          let authorUrl = null;
          for (const [nm, url] of Object.entries(profileLinks)) {
            if (nm === author || author.includes(nm) || nm.includes(author)) { authorUrl = url; break; }
          }
          out.push({ author, meta: (lines[1] || "").slice(0, 100), authorUrl, universe: uni, excerpt: lines.join(" | ").slice(0, 400) });
          if (out.length >= 6) break;
        }
        return out;
      }, q.uni);
      console.log(`[${q.kw}] found ${posts.length}`);
      results.push(...posts);
      await sleep(4000);
    }
    fs.writeFileSync(path.join(OUT, "search-targets.json"), JSON.stringify(results, null, 2));
    results.forEach((p, i) => console.log(`  ${i + 1}. [${p.universe}] ${p.author} ${p.authorUrl ? "🔗" : "❌"} — ${p.excerpt.slice(0, 80)}…`));
    console.log("SEARCH_DONE, total:", results.length);
  } catch (e) {
    console.error("ERR:", e.message);
    await page.screenshot({ path: path.join(OUT, "search_error.png") }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
