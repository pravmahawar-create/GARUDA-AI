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
    // 1) anchors on activity page
    await page.goto("https://www.linkedin.com/in/garuda-ai-ai-operating-system-227168432/recent-activity/all/", { waitUntil: "domcontentloaded", timeout: 60000 });
    await sleep(8000);
    const anchors = await page.evaluate(() =>
      [...document.querySelectorAll("a[href]")]
        .map((a) => ({ t: (a.innerText || "").trim().slice(0, 30), h: a.href }))
        .filter((x) => /\/posts\/|\/feed\/update\/|analytics/i.test(x.h))
        .slice(0, 15)
    );
    console.log("PERMALINK/ANALYTICS ANCHORS:", JSON.stringify(anchors, null, 1));

    // 2) candidate analytics URLs
    const urls = [
      "https://www.linkedin.com/analytics/",
      "https://www.linkedin.com/in/garuda-ai-ai-operating-system-227168432/analytics/"
    ];
    for (const u of urls) {
      await page.goto(u, { waitUntil: "domcontentloaded", timeout: 45000 }).catch((e) => console.log("nav fail", u, e.message));
      await sleep(6000);
      const txt = await page.evaluate(() => (document.body.innerText || "").replace(/\n+/g, " | ").slice(0, 700));
      console.log(`\nURL: ${u}\nTEXT: ${txt}`);
    }
    console.log("PROBE_DONE");
  } catch (e) {
    console.error("ERR:", e.message);
  } finally {
    await browser.close();
  }
})();
