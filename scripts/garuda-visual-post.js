require("dotenv").config();
const puppeteer = require("puppeteer");
const path = require("path");

const PROFILE_DIR = path.resolve(__dirname, "../.chrome-profile/garuda");
const POSTER = path.resolve(__dirname, "../output/garuda_poster.png");
const OUT = path.resolve(__dirname, "../output");
const CAPTION = `48 hours. Full-stack. Deployed. ⚙️

This isn't a roadmap slide — it's the operating benchmark of GARUDA OS.

→ Agents plan it
→ Agents build it
→ Agents verify it with SHA-256 proof
→ Agents ship it

India's Sovereign AI Operating System is LIVE.

👉 garudaos.in

#GARUDAOS #AI #AutonomousAgents #SovereignAI`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const human = () => sleep(1800 + Math.random() * 2800);

async function findClick(page, labelRe, maxWaitMs = 10000) {
  const t0 = Date.now();
  while (Date.now() - t0 < maxWaitMs) {
    const hit = await page.evaluate((src) => {
      const re = new RegExp(src, "i");
      const vis = [...document.querySelectorAll('button, div[role="button"], span[role="button"], li[role="button"]')].filter((b) => b.offsetParent !== null);
      const b = vis.find((el) => re.test(el.getAttribute("aria-label") || "") || re.test((el.innerText || "").trim()));
      if (b) { b.click(); return (b.getAttribute("aria-label") || b.innerText || "").trim().slice(0, 50); }
      return null;
    }, labelRe);
    if (hit) return hit;
    await sleep(1500);
  }
  return null;
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
    await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded", timeout: 60000 });
    await sleep(7000);
    if (!page.url().includes("/feed")) throw new Error("Not on feed: " + page.url());
    await human();

    const opened = await page.evaluate(() => {
      const cands = [...document.querySelectorAll('div[role="button"], button, a, span[role="button"]')];
      const btn = cands.find((el) => (el.innerText || "").trim() === "Start a post" && el.offsetParent !== null);
      if (btn) { btn.click(); return true; }
      return false;
    });
    console.log("[POST] start clicked:", opened);
    const editor = await page.waitForSelector(".tiptap", { visible: true, timeout: 20000 }).catch(() => null);
    if (!editor) throw new Error("tiptap editor did not appear");
    await sleep(2500);

    // Step 0: clear any restored draft so Media button is present
    const draftLen = await page.evaluate(() => (document.querySelector(".tiptap")?.innerText || "").length);
    if (draftLen > 0) {
      console.log("[POST] clearing restored draft, len=" + draftLen);
      await editor.click();
      await page.keyboard.down("Control");
      await page.keyboard.press("KeyA");
      await page.keyboard.up("Control");
      await page.keyboard.press("Backspace");
      await sleep(1500);
    }

    // Step 1: Media (empty editor)
    const media = await findClick(page, "^Media$");
    console.log("[POST] Media clicked:", media);
    if (!media) throw new Error("Media button not found");
    await sleep(3000);

    // Step 2: submenu → file input
    let fi = await page.$('input[type="file"]');
    if (!fi) {
      const sub = await findClick(page, "upload from computer|^photo$|add photo", 6000);
      console.log("[POST] submenu clicked:", sub);
      await sleep(3000);
      fi = await page.$('input[type="file"]');
    }
    if (!fi) {
      const dump = await page.evaluate(() =>
        [...document.querySelectorAll('button, div[role="button"], span[role="button"]')]
          .filter((b) => b.offsetParent !== null)
          .map((b) => (b.getAttribute("aria-label") || b.innerText || "").trim().slice(0, 40)).slice(0, 30));
      throw new Error("file input not found. buttons: " + JSON.stringify(dump));
    }

    await fi.uploadFile(POSTER);
    console.log("[POST] poster uploading…");
    await sleep(12000);
    await page.screenshot({ path: path.join(OUT, "post2_img_attached.png") });

    // Step 2b: image Editor modal → click "Next" to return to composer
    const nextClicked = await page.evaluate(() => {
      const btns = [...document.querySelectorAll("button")].filter((b) => b.offsetParent !== null);
      const next = btns.find((b) => (b.innerText || "").trim() === "Next");
      if (next) { next.click(); return true; }
      return false;
    });
    console.log("[POST] Editor Next clicked:", nextClicked);
    await sleep(6000);
    if (!nextClicked) throw new Error("Editor modal Next button not found");
    await page.screenshot({ path: path.join(OUT, "post2_after_next.png") });

    // Step 3: caption into composer's FRESH editor handle
    const ed2 = await page.waitForSelector(".tiptap", { visible: true, timeout: 15000 }).catch(() => null);
    if (!ed2) throw new Error("composer editor not visible after Next");
    const cur = await page.evaluate(() => (document.querySelector(".tiptap[contenteditable='true']")?.innerText || ""));
    if (cur.includes("48 hours")) {
      console.log("[POST] caption already present");
    } else {
      await ed2.click();
      await sleep(600);
      const focused = await page.evaluate(() => {
        const a = document.activeElement;
        return a ? a.tagName + "/" + (a.getAttribute("contenteditable") || "no") : "none";
      });
      console.log("[POST] focus after click:", focused);
      try {
        await page.keyboard.insertText(CAPTION);
      } catch (e) {
        for (let i = 0; i < CAPTION.length; i += 60) await page.keyboard.type(CAPTION.slice(i, i + 60), { delay: 8 });
      }
      await sleep(1500);
    }
    const len = await page.evaluate(() => (document.querySelector(".tiptap[contenteditable='true']")?.innerText || "").length);
    console.log("[POST] caption length:", len, "/", CAPTION.length);
    if (len < CAPTION.length * 0.5) throw new Error("caption fill failed");
    await human();

    await page.screenshot({ path: path.join(OUT, "post2_preview.png") });

    const postState = await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")].find((b) => (b.innerText || "").trim() === "Post" && b.offsetParent !== null);
      if (!btn) return "not-found";
      if (btn.disabled) return "disabled";
      btn.click();
      return "clicked";
    });
    console.log("[POST] Post button:", postState);
    await sleep(9000);

    const editorGone = !(await page.$(".tiptap"));
    console.log(editorGone ? "[POST] ✔ composer closed — likely posted" : "[POST] ⚠ composer still open");
    await page.screenshot({ path: path.join(OUT, "post2_result.png") });

    if (editorGone) {
      await human();
      await page.goto("https://www.linkedin.com/in/garuda-ai-ai-operating-system-227168432/recent-activity/all/", { waitUntil: "domcontentloaded", timeout: 60000 });
      await sleep(7000);
      const txt = await page.evaluate(() => (document.querySelector("main")?.innerText || "").slice(0, 900));
      console.log("[VERIFY]:\n" + txt);
      await page.screenshot({ path: path.join(OUT, "post2_verified.png") });
    }
    console.log("RUN_DONE");
  } catch (e) {
    console.error("ERR:", e.message);
    await page.screenshot({ path: path.join(OUT, "post2_error.png") }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
