const puppeteer = require("puppeteer");
const path = require("path");

async function runLiveAudit() {
  console.log("Navigating to https://www.garudaos.in/war-room ...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,1000"]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000 });
    await page.goto("https://www.garudaos.in/war-room", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2500));

    const fontAudit = await page.evaluate(() => {
      const heading = document.querySelector("h1");
      const kpiNumber = document.querySelector(".garuda-war-room-root div[style*='32px']");
      const button = document.querySelector(".garuda-war-room-root button");
      const navItem = document.querySelector("aside button");
      const body = document.body;

      return {
        h1Font: heading ? window.getComputedStyle(heading).fontFamily : "NOT_FOUND",
        kpiNumberFont: kpiNumber ? window.getComputedStyle(kpiNumber).fontFamily : "NOT_FOUND",
        buttonFont: button ? window.getComputedStyle(button).fontFamily : "NOT_FOUND",
        navItemFont: navItem ? window.getComputedStyle(navItem).fontFamily : "NOT_FOUND"
      };
    });

    console.log("=== LIVE COMPUTED FONT AUDIT ===");
    console.log(JSON.stringify(fontAudit, null, 2));

    const ssPath = path.join(__dirname, "output", "live-production-playfair.png");
    await page.screenshot({ path: ssPath });
    console.log("Live screenshot captured to:", ssPath);

    return fontAudit;
  } finally {
    await browser.close();
  }
}

runLiveAudit().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
