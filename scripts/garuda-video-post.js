require("dotenv").config();
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const PROFILE_DIR = path.resolve(__dirname, "../.chrome-profile/garuda");
const OUT = path.resolve(__dirname, "../output");
const VIDEO = path.resolve(__dirname, "../output/shorts/GARUDA_LIVE_WORKING_SCREEN_DEMO.mp4");

const POST_TEXT = `Watch this. 60 seconds of GARUDA OS building a working app — LIVE screen recording. No mockup. No roadmap slide. Real software, being built in real time.

This is how we ship for clients:

→ Websites — designed, built & deployed in DAYS, not months
→ Mobile & web apps — production-grade, not prototypes
→ Automation — agents running 24/7 after handover

One founder + an autonomous AI workforce. Every line of code verified with SHA-256 proof before it ships.

If you're a business owner still waiting on an agency's 3-month timeline — there's a faster way.

Comment "BUILD" or DM us — tell us what you need built.

#WebDevelopment #AppDevelopment #AI #GARUDAOS #SaaS #StartupIndia`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const human = () => sleep(1800 + Math.random() * 2800);

(async () => {
  if (!fs.existsSync(VIDEO)) throw new Error("Video missing: " + VIDEO);
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
    console.log("[VIDEO] loading feed…");
    await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded", timeout: 60000 });
    await sleep(7000);
    if (!page.url().includes("/feed")) throw new Error("Not on feed: " + page.url());

    const opened = await page.evaluate(() => {
      const cands = [...document.querySelectorAll('div[role="button"], button, a, span[role="button"]')];
      const btn = cands.find((el) => (el.innerText || "").trim() === "Start a post" && el.offsetParent !== null);
      if (btn) { btn.click(); return true; }
      return false;
    });
    console.log("[VIDEO] composer opened:", opened);
    const editor = await page.waitForSelector(".tiptap, .tiptap.ProseMirror", { visible: true, timeout: 20000 }).catch(() => null);
    if (!editor) throw new Error("tiptap editor did not appear");
    await sleep(1200);

    // Fill text FIRST (ProseMirror-safe insertText)
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
    console.log(`[VIDEO] text filled via ${fillMethod}, length=${editorLen}`);
    if (editorLen < POST_TEXT.length * 0.5) throw new Error("Editor fill failed");
    await human();

    // Attach video: click composer "Media" button -> file input appears
    let fi = await page.$('input[type="file"]');
    if (!fi) {
      const clicked = await page.evaluate(() => {
        const btns = [...document.querySelectorAll('button, div[role="button"], span[role="button"]')].filter((b) => b.offsetParent !== null);
        const m = btns.find((b) => (b.getAttribute("aria-label") || "").trim() === "Media");
        if (m) { m.click(); return "Media"; }
        return null;
      });
      console.log("[VIDEO] media button:", clicked);
      await sleep(3000);
      fi = await page.$('input[type="file"]');
    }
    if (!fi) throw new Error("No file input found for video");
    await fi.uploadFile(VIDEO);
    console.log("[VIDEO] uploading 12MB reel…");
    await sleep(20000);
    await page.screenshot({ path: path.join(OUT, "video_post_uploaded.png") });

    // Click Next/Done only if a dialog/modal presents them (video preview flow)
    const nextClicked = await page.evaluate(() => {
      const scope = [...document.querySelectorAll('[role="dialog"], .artdeco-modal, div[data-test-modal-id]')].find((d) => d.offsetParent !== null);
      if (!scope) return null;
      const btns = [...scope.querySelectorAll("button")].filter((b) => b.offsetParent !== null && !b.disabled);
      const n = btns.find((b) => /^(next|done)$/i.test((b.innerText || "").trim()));
      if (n) { n.click(); return (n.innerText || "").trim(); }
      return null;
    });
    if (nextClicked) { console.log("[VIDEO] clicked modal:", nextClicked); await sleep(6000); }

    // Wait for Post button to become enabled (video processing)
    let postReady = false;
    for (let i = 0; i < 24; i++) {
      postReady = await page.evaluate(() => {
        const btns = [...document.querySelectorAll("button")].filter((b) => b.offsetParent !== null);
        const btn = btns.find((b) => (b.innerText || "").trim() === "Post");
        return !!btn && !btn.disabled;
      });
      if (postReady) break;
      await sleep(5000);
    }
    console.log("[VIDEO] postReady:", postReady);

    await page.screenshot({ path: path.join(OUT, "video_post_preview.png") });

    const postState = await page.evaluate(() => {
      const btns = [...document.querySelectorAll("button")].filter((b) => b.offsetParent !== null);
      const btn = btns.find((b) => (b.innerText || "").trim() === "Post");
      if (!btn) return "not-found";
      if (btn.disabled) return "disabled";
      btn.click();
      return "clicked";
    });
    console.log("[VIDEO] Post button:", postState);
    await sleep(15000);

    const editorGone = !(await page.$(".tiptap"));
    console.log(editorGone ? "[VIDEO] composer closed - likely posted" : "[VIDEO] WARN composer still open");
    await page.screenshot({ path: path.join(OUT, "video_post_result.png") });

    if (postState === "disabled") throw new Error("Post button disabled - video may still be processing");
    if (!editorGone) throw new Error("Composer still open - post not committed");

    await human();
    await page.goto("https://www.linkedin.com/in/garuda-ai-ai-operating-system-227168432/recent-activity/all/", { waitUntil: "domcontentloaded", timeout: 60000 });
    await sleep(7000);
    const txt = await page.evaluate(() => (document.querySelector("main")?.innerText || "").slice(0, 900));
    console.log("[VERIFY] profile activity:\n" + txt);
    const live = /Comment "BUILD"|LIVE screen recording|being built in real time/i.test(txt);
    console.log(live ? "[VERIFY] VIDEO_POST_LIVE_CONFIRMED" : "[VERIFY] VIDEO_POST_NOT_FOUND_IN_FIRST_VIEW");
    await page.screenshot({ path: path.join(OUT, "video_post_verified.png") });
    console.log("RUN_DONE");
  } catch (e) {
    console.error("ERR:", e.message);
    await page.screenshot({ path: path.join(OUT, "video_post_error.png") }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
