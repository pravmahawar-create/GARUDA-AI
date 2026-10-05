const puppeteer = require("puppeteer");
const path = require("path");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PROFILE_DIR = path.resolve(__dirname, "../.chrome-profile/garuda");

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: false,
    userDataDir: PROFILE_DIR,
    args: ["--no-sandbox", "--disable-blink-features=AutomationControlled", "--window-size=1366,900"],
    defaultViewport: null
  });
  const pages = await browser.pages();
  const page = pages[0] || (await browser.newPage());
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.8010.53 Safari/537.36");
  try {
    await page.goto("https://www.linkedin.com/in/garuda-ai-ai-operating-system-227168432/recent-activity/all/", { waitUntil: "domcontentloaded", timeout: 60000 });
    await sleep(8000);

    const initial = await page.evaluate(() => ((document.querySelector("main") || document.body).innerText || "").slice(0, 3500));
    console.log("=== ACTIVITY TEXT ===");
    console.log(initial);
    console.log("=== END ACTIVITY TEXT ===\n");

    const menuCount = await page.evaluate(() =>
      [...document.querySelectorAll("button,div[role=button]")]
        .filter((b) => b.offsetParent !== null && /control menu for post/i.test(b.getAttribute("aria-label") || "") && /GARUDA/i.test(b.getAttribute("aria-label") || ""))
        .length
    );
    console.log("OWN POST MENUS FOUND:", menuCount);

    for (let i = 0; i < Math.min(menuCount, 5); i++) {
      const clicked = await page.evaluate((idx) => {
        const bs = [...document.querySelectorAll("button,div[role=button]")].filter(
          (b) => b.offsetParent !== null && /control menu for post/i.test(b.getAttribute("aria-label") || "") && /GARUDA/i.test(b.getAttribute("aria-label") || "")
        );
        if (bs[idx]) { bs[idx].scrollIntoView({ block: "center" }); bs[idx].click(); return true; }
        return false;
      }, i);
      if (!clicked) { console.log(`POST ${i}: menu click failed`); continue; }
      await sleep(1800);

      const stat = await page.evaluate(() => {
        const els = [...document.querySelectorAll("[role=menuitem], li, [role=menu] *")].filter((e) => e.offsetParent !== null);
        const t = els.find((e) => {
          const s = (e.innerText || "").trim();
          return /analytics|stats/i.test(s) && s.length < 60;
        });
        if (t) { const label = t.innerText.trim(); t.click(); return label; }
        return null;
      });
      console.log(`POST ${i}: stat item = ${stat}`);
      if (stat) {
        await sleep(4500);
        const ov = await page.evaluate(() => {
          const t = document.body.innerText || "";
          const m1 = t.match(/([\d,]+)\s*\n\s*[Ii]mpressions/);
          const m2 = t.match(/[Ii]mpressions\s*\n\s*([\d,]+)/);
          const head = t.split("\n").slice(0, 70).filter((x) => x.trim()).join(" | ").slice(0, 500);
          return (m1 ? m1[1] : m2 ? m2[1] : "NOT_FOUND") + " || HEAD: " + head;
        });
        console.log(`POST ${i}: IMPRESSIONS = ${ov}`);
        await page.keyboard.press("Escape"); await sleep(1200);
        await page.keyboard.press("Escape"); await sleep(1200);
      } else {
        await page.keyboard.press("Escape"); await sleep(1000);
      }
    }
    console.log("CHECK_DONE");
  } catch (e) {
    console.error("ERR:", e.message);
  } finally {
    await browser.close();
  }
})();
