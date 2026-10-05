require("dotenv").config();
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const PROFILE_DIR = path.resolve(__dirname, "../.chrome-profile/garuda");
const OUT = path.resolve(__dirname, "../output");
const POST_TEXT = fs.readFileSync(path.resolve(__dirname, "../data/campaigns/garuda-buzz-7day/linkedin-post-agents-stack.txt"), "utf8").trim();
const PROFILE_URL = "https://www.linkedin.com/in/garuda-ai-ai-operating-system-227168432/recent-activity/all/";

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
    console.log("[POST] loading feed…");
    await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded", timeout: 60000 });
    await sleep(7000);
    if (!page.url().includes("/feed")) throw new Error("Not on feed: " + page.url());

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
    console.log("[POST] tiptap editor visible OK");
    await sleep(1200);

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
    if (editorLen < POST_TEXT.length * 0.5) throw new Error("Editor fill failed - length too low");
    await human();

    await page.screenshot({ path: path.join(OUT, "agents_post_preview.png") });

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
    console.log(editorGone ? "[POST] composer closed - likely posted" : "[POST] WARN composer still open");
    await page.screenshot({ path: path.join(OUT, "agents_post_result.png") });

    if (editorGone) {
      await human();
      await page.goto(PROFILE_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
      await sleep(7000);
      const txt = await page.evaluate(() => (document.querySelector("main")?.innerText || "").slice(0, 900));
      console.log("[VERIFY] profile activity:\n" + txt);
      const live = /beginner version|governed autonomy|agent stack/i.test(txt);
      console.log(live ? "[VERIFY] POST_LIVE_CONFIRMED" : "[VERIFY] POST_NOT_FOUND_IN_FIRST_VIEW");
      await page.screenshot({ path: path.join(OUT, "agents_post_verified.png") });
    }
    console.log("RUN_DONE");
  } catch (e) {
    console.error("ERR:", e.message);
    await page.screenshot({ path: path.join(OUT, "agents_post_error.png") }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
