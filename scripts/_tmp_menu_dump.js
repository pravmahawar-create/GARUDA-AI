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

    // click first own-post menu
    const clicked = await page.evaluate(() => {
      const bs = [...document.querySelectorAll("button,div[role=button]")].filter(
        (b) => b.offsetParent !== null && /control menu for post/i.test(b.getAttribute("aria-label") || "") && /GARUDA/i.test(b.getAttribute("aria-label") || "")
      );
      if (bs[0]) { bs[0].scrollIntoView({ block: "center" }); bs[0].click(); return bs.length; }
      return -1;
    });
    console.log("own menus:", clicked);
    await sleep(2500);

    const dump = await page.evaluate(() => {
      const menus = [...document.querySelectorAll("[role=menu], [role=dialog]")].filter((e) => e.offsetParent !== null);
      const items = [...document.querySelectorAll("[role=menuitem], [role=menuitemcheckbox], [role=button]")].filter((e) => e.offsetParent !== null);
      return {
        menuCount: menus.length,
        menuTexts: menus.map((m) => (m.innerText || "").slice(0, 300)),
        itemLabels: items.map((i) => (i.getAttribute("aria-label") || i.innerText || "").trim().slice(0, 60)).filter(Boolean).slice(0, 40)
      };
    });
    console.log(JSON.stringify(dump, null, 2));
    await page.keyboard.press("Escape");
  } catch (e) {
    console.error("ERR:", e.message);
  } finally {
    await browser.close();
  }
})();
