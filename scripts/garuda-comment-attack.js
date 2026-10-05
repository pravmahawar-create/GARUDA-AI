require("dotenv").config();
const puppeteer = require("puppeteer");
const path = require("path");

const PROFILE_DIR = path.resolve(__dirname, "../.chrome-profile/garuda");
const OUT = path.resolve(__dirname, "../output");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SEARCH_URL = "https://www.linkedin.com/search/results/content/?keywords=Oracle%20DBA&origin=GLOBAL_SEARCH_HEADER";

const TARGETS = [
  {
    id: "dbainsight_career",
    locateByText: "Oracle DBA still a good career",
    mustInclude: ["career"],
    comment: "This is exactly the manual tax DBAs have carried for a decade — define the recovery runbook once, let autonomous agents execute it nightly with proof. RMAN drills shouldn't need a human awake at 3 AM.",
    shot: "comment1_dbainsight.png"
  },
  {
    id: "shaban_rman",
    authorUrl: "https://www.linkedin.com/in/muhmmadshaban/",
    mustIncludeAny: ["RMAN", "backup", "Oracle", "database"],
    comment: "Backup verification is the classic 'we assume it works' job. Agents that actually restore-test every night and log SHA-256 proof — that's how you sleep.",
    shot: "comment2_shaban.png"
  }
];

async function findPostContainer(page, t) {
  return page.evaluate((tgt) => {
    const isVisible = (el) => el.offsetParent !== null;
    let start = null;
    if (tgt.authorUrl) {
      start = [...document.querySelectorAll('a[href]')].find((a) => a.href.split("?")[0].replace(/\/$/, "") === tgt.authorUrl.replace(/\/$/, "") && isVisible(a));
    }
    if (!start && tgt.locateByText) {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = walker.nextNode())) {
        if ((n.textContent || "").includes(tgt.locateByText)) { start = n.parentElement; break; }
      }
    }
    if (!start) return { err: "start element not found" };
    // climb to ancestor that contains a Comment action button
    let cur = start;
    for (let i = 0; i < 15 && cur; i++) {
      const btns = [...cur.querySelectorAll('button, div[role="button"], span[role="button"]')].filter(isVisible);
      const commentBtn = btns.find((b) => {
        const lab = b.getAttribute("aria-label") || "";
        const txt = (b.innerText || "").trim();
        return lab.trim() === "Comment" || /^Comment on/i.test(lab) || txt === "Comment";
      });
      if (commentBtn) {
        const fullText = (cur.innerText || "");
        return { found: true, level: i, fullText: fullText.slice(0, 600) };
      }
      cur = cur.parentElement;
    }
    return { err: "container with Comment button not found" };
  }, t);
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
    await page.goto(SEARCH_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
    await sleep(8000);
    await page.mouse.wheel({ deltaY: 700 }); await sleep(2500);
    await page.mouse.wheel({ deltaY: 900 }); await sleep(3500);

    for (const t of TARGETS) {
      console.log(`\n=== TARGET ${t.id} ===`);
      const loc = await findPostContainer(page, t);
      if (loc.err) { console.log("SKIP:", loc.err); continue; }
      console.log("[locate] level", loc.level, "| text:", loc.fullText.replace(/\n/g, " / ").slice(0, 220));

      // sanity: keyword check
      const kwOk = t.mustInclude
        ? t.mustInclude.every((k) => loc.fullText.toLowerCase().includes(k.toLowerCase()))
        : t.mustIncludeAny.some((k) => loc.fullText.toLowerCase().includes(k.toLowerCase()));
      if (!kwOk) { console.log("SKIP: keyword mismatch"); continue; }

      // click the Comment action inside this container
      const clicked = await page.evaluate((tgt) => {
        const isVisible = (el) => el.offsetParent !== null;
        let start = null;
        if (tgt.authorUrl) {
          start = [...document.querySelectorAll('a[href]')].find((a) => a.href.split("?")[0].replace(/\/$/, "") === tgt.authorUrl.replace(/\/$/, "") && isVisible(a));
        }
        if (!start && tgt.locateByText) {
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          let n;
          while ((n = walker.nextNode())) {
            if ((n.textContent || "").includes(tgt.locateByText)) { start = n.parentElement; break; }
          }
        }
        if (!start) return false;
        let cur = start;
        for (let i = 0; i < 15 && cur; i++) {
          const btns = [...cur.querySelectorAll('button, div[role="button"], span[role="button"]')].filter(isVisible);
          const commentBtn = btns.find((b) => {
            const L = (b.getAttribute("aria-label") || "").trim();
            return L === "Comment" || /^Comment on/i.test(L) || (b.innerText || "").trim() === "Comment";
          });
          if (commentBtn) { commentBtn.scrollIntoView({ block: "center" }); commentBtn.click(); return true; }
          cur = cur.parentElement;
        }
        return false;
      }, t);
      console.log("[comment-btn] clicked:", clicked);
      if (!clicked) { console.log("SKIP: comment button click failed"); continue; }
      await sleep(3500);

      // comment editor: visible contenteditable
      const ed = await page.waitForSelector('div[contenteditable="true"]', { visible: true, timeout: 12000 }).catch(() => null);
      if (!ed) {
        console.log("SKIP: comment editor did not open");
        await page.screenshot({ path: path.join(OUT, "comment_fail_editor.png") });
        continue;
      }
      await ed.click();
      await sleep(800);
      try { await page.keyboard.insertText(t.comment); }
      catch (e) { await page.keyboard.type(t.comment, { delay: 10 }); }
      await sleep(1500);
      const typedLen = await page.evaluate(() => {
        const els = [...document.querySelectorAll('div[contenteditable="true"]')].filter((e) => e.offsetParent !== null);
        return els.map((e) => (e.innerText || "").length);
      });
      console.log("[typed] editor lengths:", JSON.stringify(typedLen));
      if (!typedLen.some((l) => l > t.comment.length * 0.5)) { console.log("SKIP: typing failed"); continue; }

      await page.screenshot({ path: path.join(OUT, "comment_typed_" + t.id + ".png") });

      // submit: Ctrl+Enter, then explicit Comment button if editor persists
      await page.keyboard.down("Control");
      await page.keyboard.press("Enter");
      await page.keyboard.up("Control");
      await sleep(6000);

      let editorStill = await page.evaluate((txt) => {
        const els = [...document.querySelectorAll('div[contenteditable="true"]')].filter((e) => e.offsetParent !== null);
        return els.some((e) => (e.innerText || "").includes(txt.slice(0, 40)));
      }, t.comment);

      if (editorStill) {
        console.log("[submit] Ctrl+Enter didn't clear — clicking Comment button");
        const btnClicked = await page.evaluate(() => {
          const btns = [...document.querySelectorAll('button, div[role="button"]')].filter((b) => b.offsetParent !== null);
          const btn = btns.find((b) => (b.innerText || "").trim() === "Comment");
          if (btn) { btn.click(); return true; }
          return false;
        });
        console.log("[submit] button clicked:", btnClicked);
        await sleep(6000);
        editorStill = await page.evaluate((txt) => {
          const els = [...document.querySelectorAll('div[contenteditable="true"]')].filter((e) => e.offsetParent !== null);
          return els.some((e) => (e.innerText || "").includes(txt.slice(0, 40)));
        }, t.comment);
      }

      console.log(editorStill ? "❌ VERIFY: comment text still in editor — NOT posted" : "✅ VERIFY: editor cleared — comment posted");
      await page.screenshot({ path: path.join(OUT, t.shot) });

      if (editorStill) { console.log("ABORT: submit failed, stopping to avoid duplicates"); break; }
      console.log(`✅ COMMENT LIVE: ${t.id}`);
      await sleep(45000 + Math.random() * 20000);
    }
    console.log("\nATTACK_RUN_DONE");
  } catch (e) {
    console.error("ERR:", e.message);
    await page.screenshot({ path: path.join(OUT, "comment_error.png") }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
