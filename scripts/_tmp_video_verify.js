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
  await p.goto("https://www.linkedin.com/in/garuda-ai-ai-operating-system-227168432/recent-activity/all/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 8000));
  const txt = await p.evaluate(() => (document.querySelector("main")?.innerText || "").slice(0, 1200));
  console.log("PROFILE_ACTIVITY:\n" + txt);
  const videoLive = /Comment "BUILD"|LIVE screen recording|built in real time|being built in real time/i.test(txt);
  const textLive = /AI Agents are NOT just Prompt/i.test(txt);
  console.log("VIDEO_POST:", videoLive ? "LIVE_CONFIRMED" : "NOT_IN_VIEW");
  console.log("TEXT_POST:", textLive ? "LIVE_CONFIRMED" : "NOT_IN_VIEW");
  await p.screenshot({ path: path.resolve(__dirname, "../output/video_post_verified.png") });
  await b.close();
})().catch((e) => { console.error("ERR", e.message); process.exit(1); });
