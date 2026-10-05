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
    for (let i = 0; i < 5; i++) { await page.mouse.wheel({ deltaY: 800 }); await sleep(1800); }
    await sleep(3000);

    const rows = await page.evaluate(() => {
      const anchors = [...document.querySelectorAll('a[href*="/analytics/post-summary/"]')];
      return anchors.map((a) => {
        const imp = ((a.innerText || "").match(/([\d,]+)\s*impressions/) || [, "?"])[1];
        // climb to post card and grab age + first content line
        let cur = a, age = "", snippet = "";
        for (let i = 0; i < 14 && cur; i++) {
          const t = cur.innerText || "";
          if (/\b\d+\s*(h|d|w|m|minute|hour|day)\b/.test(t) && t.length > 100) {
            const lines = t.split("\n").map((x) => x.trim()).filter(Boolean);
            age = (lines.find((l) => /^\d+\s*(h|d|w|m)\b|minute ago|hour ago|day ago/.test(l)) || "").slice(0, 30);
            const skip = lines.findIndex((l) => /Founder & Chief/.test(l));
            snippet = lines.slice(skip + 1).join(" ").slice(0, 90);
            break;
          }
          cur = cur.parentElement;
        }
        return { impressions: imp, age, snippet, url: a.href.split("/").pop().slice(0, 28) };
      });
    });
    console.log(JSON.stringify(rows, null, 1));
    console.log("MAPPING_DONE total:", rows.length);
  } catch (e) {
    console.error("ERR:", e.message);
  } finally {
    await browser.close();
  }
})();
