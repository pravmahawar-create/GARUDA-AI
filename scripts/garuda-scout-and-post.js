require("dotenv").config();
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const PROFILE_DIR = path.resolve(__dirname, "../.chrome-profile/garuda");
const POSTER = path.resolve(__dirname, "../output/garuda_poster.png");
const OUT = path.resolve(__dirname, "../output");
const POST_TEXT = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../data/campaigns/garuda-buzz-7day/comment-bank.json"), "utf8")).post_copy_hero;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const human = () => sleep(1800 + Math.random() * 2800);

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
    console.log("[SCOUT] loading feed…");
    await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded", timeout: 60000 });
    await sleep(7000);
    if (!page.url().includes("/feed")) throw new Error("Not on feed: " + page.url());
    for (let i = 0; i < 3; i++) { await page.mouse.wheel({ deltaY: 700 }); await human(); }

    const posts = await page.evaluate(() => {
      const out = [];
      const blocks = [...document.querySelectorAll("div.occludable-update, article, div[data-urn]")];
      for (const b of blocks.slice(0, 12)) {
        const txt = (b.innerText || "").trim();
        if (txt.length < 40) continue;
        const lines = txt.split("\n").map((l) => l.trim()).filter(Boolean);
        out.push({ author: lines[0] || "?", meta: (lines[1] || "").slice(0, 90), text: lines.slice(2).join(" ").slice(0, 260) });
      }
      return out;
    });
    fs.writeFileSync(path.join(OUT, "feed-scout.json"), JSON.stringify(posts, null, 2));
    console.log("[SCOUT] captured", posts.length, "posts");
    await page.screenshot({ path: path.join(OUT, "scout_feed.png") });
    await human();

    // ---------- COMPOSER ----------
    console.log("[POST] opening composer…");
    const opened = await page.evaluate(() => {
      const cands = [...document.querySelectorAll('div[role="button"], button, a, span[role="button"]')];
      const btn = cands.find((el) => (el.innerText || "").trim() === "Start a post" && el.offsetParent !== null);
      if (btn) { btn.click(); return true; }
      return false;
    });
    console.log("[POST] start clicked:", opened);
    const editor = await page.waitForSelector(".tiptap, .tiptap.ProseMirror", { visible: true, timeout: 20000 }).catch(() => null);
    if (!editor) throw new Error("tiptap editor did not appear");
    console.log("[POST] tiptap editor visible ✔");
    await sleep(1200);

    // fill via CDP insertText (ProseMirror-safe), fallback chunked typing
    let fillMethod = "insertText";
    try {
      await editor.click();
      await sleep(500);
      await page.keyboard.insertText(POST_TEXT);
    } catch (e) {
      fillMethod = "type-chunked";
      for (let i = 0; i < POST_TEXT.length; i += 60) {
        await page.keyboard.type(POST_TEXT.slice(i, i + 60), { delay: 8 });
      }
    }
    await sleep(1500);
    const editorLen = await page.evaluate(() => {
      const ed = document.querySelector(".tiptap");
      return ed ? (ed.innerText || "").length : 0;
    });
    console.log(`[POST] editor filled via ${fillMethod}, length=${editorLen} (expect ~${POST_TEXT.length})`);
    if (editorLen < POST_TEXT.length * 0.5) throw new Error("Editor fill failed — length too low");
    await human();

    // ---------- IMAGE ----------
    try {
      let fi = await page.$('input[type="file"]');
      if (!fi) {
        const photoClicked = await page.evaluate(() => {
          const btns = [...document.querySelectorAll('button, div[role="button"], span[role="button"]')].filter((b) => b.offsetParent !== null);
          const photo = btns.find((b) => /photo|image|pic|media/i.test(b.getAttribute("aria-label") || b.title || ""));
          if (photo) { photo.click(); return photo.getAttribute("aria-label") || photo.title; }
          return null;
        });
        console.log("[POST] photo button:", photoClicked);
        await sleep(2500);
        fi = await page.$('input[type="file"]');
      }
      if (fi) {
        await fi.uploadFile(POSTER);
        console.log("[POST] image uploading…");
        await sleep(9000);
      } else console.log("[POST] WARN: no file input — going text-only");
    } catch (e) { console.log("[POST] image step skipped:", e.message); }

    await page.screenshot({ path: path.join(OUT, "post_preview.png") });

    // ---------- POST ----------
    const postState = await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")].find(
        (b) => (b.innerText || "").trim() === "Post" && b.offsetParent !== null
      );
      if (!btn) return "not-found";
      if (btn.disabled) return "disabled";
      btn.click();
      return "clicked";
    });
    console.log("[POST] Post button:", postState);
    await sleep(8000);

    const editorGone = !(await page.$(".tiptap"));
    console.log(editorGone ? "[POST] ✔ composer closed — likely posted" : "[POST] ⚠ composer still open");
    await page.screenshot({ path: path.join(OUT, "post_result.png") });

    if (editorGone) {
      await human();
      await page.goto("https://www.linkedin.com/in/garuda-ai-ai-operating-system-227168432/recent-activity/all/", { waitUntil: "domcontentloaded", timeout: 60000 });
      await sleep(7000);
      const txt = await page.evaluate(() => (document.querySelector("main")?.innerText || "").slice(0, 700));
      console.log("[VERIFY] profile activity:\n" + txt);
      await page.screenshot({ path: path.join(OUT, "post_verified_profile.png") });
    }
    console.log("RUN_DONE");
  } catch (e) {
    console.error("ERR:", e.message);
    await page.screenshot({ path: path.join(OUT, "master_run_error.png") }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
