require("dotenv").config();
const puppeteer = require("puppeteer");
const path = require("path");
const PROFILE_DIR = path.resolve(__dirname, "../.chrome-profile/garuda");
const OUT = path.resolve(__dirname, "../output");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CHECKS = [
  { id: "dbainsight", locateByText: "Oracle DBA still a good career", sig: "manual tax DBAs have carried", shot: "verify_comment_dbainsight.png" },
  { id: "shaban", locateByText: "Hiring: Oracle DBA", sig: "restore-test every night", shot: "verify_comment_shaban.png" }
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
  try {
    await page.goto("https://www.linkedin.com/search/results/content/?keywords=Oracle%20DBA&origin=GLOBAL_SEARCH_HEADER", { waitUntil: "domcontentloaded", timeout: 60000 });
    await sleep(8000);
    await page.mouse.wheel({ deltaY: 700 }); await sleep(3000);
    await page.mouse.wheel({ deltaY: 500 }); await sleep(3000);

    for (const c of CHECKS) {
      // scroll post into view
      await page.evaluate((tgt) => {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let n;
        while ((n = walker.nextNode())) {
          if ((n.textContent || "").includes(tgt)) { n.parentElement.scrollIntoView({ block: "center" }); return true; }
        }
        return false;
      }, c.locateByText);
      await sleep(2500);

      // try expanding comments once if link present
      await page.evaluate(() => {
        const link = [...document.querySelectorAll("button, a, div[role=button]")].find((b) => b.offsetParent !== null && /^See \d+ more comments$/i.test((b.innerText || "").trim()));
        if (link) link.click();
      });
      await sleep(3500);

      const found = await page.evaluate((sig) => (document.body.innerText || "").includes(sig), c.sig);
      // also extract OUR comment context if present
      const ctx = await page.evaluate((sig) => {
        const t = document.body.innerText || "";
        const i = t.indexOf(sig);
        if (i < 0) return null;
        return t.slice(Math.max(0, i - 260), i + 240).replace(/\n/g, " | ");
      }, c.sig);
      console.log(`[${c.id}] signature "${c.sig}" present: ${found}`);
      if (ctx) console.log(`[${c.id}] context: …${ctx}…`);
      await page.screenshot({ path: path.join(OUT, c.shot) });
      await sleep(2000);
    }
    console.log("VERIFY_DONE");
  } catch (e) {
    console.error("ERR:", e.message);
    await page.screenshot({ path: path.join(OUT, "verify_error.png") }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
