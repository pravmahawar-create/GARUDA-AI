require("dotenv").config();
const puppeteer = require("puppeteer");
const path = require("path");

(async () => {
  const b = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: false,
    userDataDir: path.resolve(__dirname, "../.chrome-profile/garuda"),
    args: ["--no-sandbox", "--window-size=1366,900"],
    defaultViewport: null
  });
  const p = (await b.pages())[0] || (await b.newPage());
  await p.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 7000));
  await p.evaluate(() => {
    const c = [...document.querySelectorAll('div[role="button"], button, a, span[role="button"]')];
    const t = c.find((e) => (e.innerText || "").trim() === "Start a post" && e.offsetParent !== null);
    if (t) t.click();
  });
  await new Promise((r) => setTimeout(r, 4000));

  // Click "Media" button in composer
  const mediaClicked = await p.evaluate(() => {
    const btns = [...document.querySelectorAll("button, div[role='button'], span[role='button']")].filter((b) => b.offsetParent !== null);
    const m = btns.find((b) => (b.getAttribute("aria-label") || "").trim() === "Media");
    if (m) { m.click(); return true; }
    return false;
  });
  console.log("mediaClicked", mediaClicked);
  await new Promise((r) => setTimeout(r, 3000));

  const state = await p.evaluate(() => {
    const items = [...document.querySelectorAll("button, div[role='menuitem'], li, span[role='button'], label")]
      .filter((b) => b.offsetParent !== null)
      .map((b) => ({
        t: (b.getAttribute("aria-label") || b.title || b.innerText || "").trim().slice(0, 60),
        role: b.getAttribute("role") || ""
      }))
      .filter((x) => x.t && /video|photo|image|media|file|add/i.test(x.t));
    const fi = !!document.querySelector("input[type=file]");
    return { items: items.slice(0, 20), fileInput: fi };
  });
  console.log(JSON.stringify(state, null, 1));
  await p.screenshot({ path: path.resolve(__dirname, "../output/video_probe_media.png") });
  await b.close();
})().catch((e) => { console.error("ERR", e.message); process.exit(1); });
