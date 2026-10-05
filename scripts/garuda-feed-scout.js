require("dotenv").config();
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const PROFILE_DIR = path.resolve(__dirname, "../.chrome-profile/garuda");
const OUT = path.resolve(__dirname, "../output");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

  try {
    await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded", timeout: 60000 });
    await sleep(9000);
    if (!page.url().includes("/feed")) throw new Error("Not on feed: " + page.url());

    for (let i = 0; i < 8; i++) { await page.mouse.wheel({ deltaY: 950 }); await sleep(2300 + Math.random() * 1400); }
    await sleep(3000);

    const data = await page.evaluate(() => {
      const main = document.querySelector("main") || document.body;
      const text = main.innerText || "";
      // profile anchors map: name -> url
      const profileLinks = {};
      for (const a of document.querySelectorAll('a[href*="linkedin.com/in/"]')) {
        const nm = (a.innerText || "").trim();
        if (nm && nm.length < 60 && !profileLinks[nm]) profileLinks[nm] = a.href.split("?")[0];
      }
      const chunks = text.split(/\bFeed post\b/).slice(1);
      const posts = [];
      for (const ch of chunks) {
        const lines = ch.split("\n").map((l) => l.trim()).filter(Boolean);
        if (lines.length < 3) continue;
        const author = lines[0];
        if (/^(LinkedIn for Marketing|Promoted)/i.test(author)) continue;
        // find author profile url: exact or partial name match
        let authorUrl = null;
        for (const [nm, url] of Object.entries(profileLinks)) {
          if (nm === author || author.includes(nm) || nm.includes(author)) { authorUrl = url; break; }
        }
        // text = from first non-meta line until "… more" / reaction counts
        const meta = lines[1] || "";
        const joined = lines.join(" | ").slice(0, 400);
        posts.push({ author, meta: meta.slice(0, 100), authorUrl, excerpt: joined });
      }
      return posts;
    });
    fs.writeFileSync(path.join(OUT, "feed-scout.json"), JSON.stringify(data, null, 2));
    console.log("[SCOUT] captured", data.length, "posts:");
    data.forEach((p, i) => console.log(`  ${i + 1}. ${p.author} ${p.authorUrl ? "🔗" : ""} — ${p.excerpt.slice(0, 90)}…`));
    await page.screenshot({ path: path.join(OUT, "scout_feed.png") });
    console.log("SCOUT_DONE");
  } catch (e) {
    console.error("ERR:", e.message);
    await page.screenshot({ path: path.join(OUT, "scout_error.png") }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
