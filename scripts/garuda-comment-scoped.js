require("dotenv").config();
const puppeteer = require("puppeteer");
const path = require("path");
const PROFILE_DIR = path.resolve(__dirname, "../.chrome-profile/garuda");
const OUT = path.resolve(__dirname, "../output");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const LEON_URL = "https://www.linkedin.com/in/leon-gordon/";
const SEARCH_URL = "https://www.linkedin.com/search/results/content/?keywords=" + encodeURIComponent("AI agents enterprise") + "&origin=GLOBAL_SEARCH_HEADER";
const COMMENT = "The missing layer in most AI stacks isn't the model — it's governed execution. Agents that can't prove their work are just expensive autocomplete.";
const SIG1 = "manual tax DBAs have carried";
const SIG2 = "restore-test every night";
const SIG3 = "governed execution";

async function readCommentsTab(page, sigs) {
  await page.goto("https://www.linkedin.com/in/garuda-ai-ai-operating-system-227168432/recent-activity/all/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await sleep(7000);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll("button, a, div[role=button], span[role=button]")].find((el) => el.offsetParent !== null && (el.innerText || "").trim() === "Comments");
    if (b) b.click();
  });
  await sleep(6000);
  const txt = await page.evaluate(() => document.body.innerText || "");
  const res = {};
  for (const s of sigs) res[s] = txt.includes(s);
  return res;
}

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
    // PHASE 1: confirm earlier comments
    const p1 = await readCommentsTab(page, [SIG1, SIG2]);
    console.log("[PHASE1] earlier comments present:", JSON.stringify(p1));
    await page.screenshot({ path: path.join(OUT, "phase1_comments.png") });

    // PHASE 2: scoped comment on Leon Gordon post
    await page.goto(SEARCH_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
    await sleep(8000);
    await page.mouse.wheel({ deltaY: 700 }); await sleep(3000);
    await page.mouse.wheel({ deltaY: 900 }); await sleep(3000);

    const container = await page.evaluateHandle((url) => {
      const norm = (u) => u.split("?")[0].replace(/\/$/, "");
      const a = [...document.querySelectorAll("a[href]")].find((x) => norm(x.href) === norm(url) && x.offsetParent !== null);
      if (!a) return null;
      let cur = a;
      for (let i = 0; i < 15 && cur; i++) {
        const has = [...cur.querySelectorAll('button, div[role="button"]')].some((b) => b.offsetParent !== null && (b.getAttribute("aria-label") || "").trim() === "Comment");
        if (has) return cur;
        cur = cur.parentElement;
      }
      return null;
    }, LEON_URL);

    const isNull = await container.evaluate((el) => (el ? false : true));
    if (isNull) throw new Error("Leon Gordon post container not found");
    const postText = await container.evaluate((el) => (el.innerText || ""));
    console.log("[PHASE2] post text:", postText.replace(/\n/g, " / ").slice(0, 300));

    if (!/AI|agent|LLM|model|data/i.test(postText)) throw new Error("post not AI-related — aborting");
    if (postText.includes("governed execution")) { console.log("[PHASE2] comment already present — skipping"); return; }

    const btnClicked = await container.evaluate((el) => {
      const b = [...el.querySelectorAll('button, div[role="button"]')].find((x) => x.offsetParent !== null && (x.getAttribute("aria-label") || "").trim() === "Comment");
      if (b) { b.scrollIntoView({ block: "center" }); b.click(); return true; }
      return false;
    });
    console.log("[PHASE2] comment button:", btnClicked);
    await sleep(3500);

    // page-level editor (fresh load + single click = only one box open)
    const ed = await page.waitForSelector('div[contenteditable="true"]', { visible: true, timeout: 12000 }).catch(() => null);
    if (!ed) throw new Error("comment editor not found");
    await ed.evaluate((e) => e.scrollIntoView({ block: "center" }));
    await ed.click();
    await sleep(700);
    try { await page.keyboard.insertText(COMMENT); }
    catch (e) { await page.keyboard.type(COMMENT, { delay: 10 }); }
    await sleep(1500);
    const len = await ed.evaluate((e) => (e.innerText || "").length);
    console.log("[PHASE2] typed length:", len, "/", COMMENT.length);
    if (len < COMMENT.length * 0.5) throw new Error("typing failed");
    await page.screenshot({ path: path.join(OUT, "phase2_typed.png") });

    // submit: page-level button with exact innerText "Comment" (action-row buttons show counts, not text)
    const submitted = await page.evaluate(() => {
      const b = [...document.querySelectorAll('button, div[role="button"]')].find((x) => x.offsetParent !== null && (x.innerText || "").trim() === "Comment");
      if (b) { b.click(); return true; }
      return false;
    });
    console.log("[PHASE2] submit button:", submitted);
    await sleep(7000);

    const stillInBox = await page.evaluate((txt) => {
      const els = [...document.querySelectorAll('div[contenteditable="true"]')].filter((e) => e.offsetParent !== null);
      return els.some((e) => (e.innerText || "").includes(txt.slice(0, 40)));
    }, COMMENT);
    console.log("[PHASE2] still in box:", stillInBox);
    await page.screenshot({ path: path.join(OUT, "phase2_submitted.png") });

    // PHASE 3: definitive profile check
    const p3 = await readCommentsTab(page, [SIG1, SIG2, SIG3]);
    console.log("[PHASE3] all comments present:", JSON.stringify(p3));
    await page.screenshot({ path: path.join(OUT, "phase3_comments.png") });
    console.log("RUN_DONE");
  } catch (e) {
    console.error("ERR:", e.message);
    await page.screenshot({ path: path.join(OUT, "phase_error.png") }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
