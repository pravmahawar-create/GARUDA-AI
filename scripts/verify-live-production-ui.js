const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const OUTPUT_DIR = path.join(__dirname, "..", "output");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function verifyLiveProduction() {
  console.log("🦅 [LIVE PRODUCTION VERIFICATION] Connecting to https://www.garudaos.in/enterprise...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,1000"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });

  const errors = [];
  page.on("pageerror", (err) => {
    errors.push(err.message);
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });

  try {
    const res = await page.goto("https://www.garudaos.in/enterprise", {
      waitUntil: "networkidle2",
      timeout: 45000
    });

    console.log(`▶ HTTP Status: ${res.status()}`);
    console.log(`▶ Current URL: ${page.url()}`);
    const title = await page.title();
    console.log(`▶ Page Title: ${title}`);

    // Wait 3 seconds for full React hydration
    await new Promise((r) => setTimeout(r, 3000));

    const proofFile = path.join(OUTPUT_DIR, "live_production_enterprise_full.png");
    await page.screenshot({ path: proofFile, fullPage: true });
    console.log(`✅ Live fullpage screenshot captured: ${proofFile}`);

    // Check if Sovereign Matrix is rendered
    const matrixContainer = await page.$(".sovereign-matrix-container");
    console.log(`▶ Matrix Container Rendered: ${!!matrixContainer}`);

    if (errors.length > 0) {
      console.log("⚠️ Console/Page Errors detected:", errors);
    } else {
      console.log("🔥 [PERFECT] Zero errors detected on live production!");
    }

    return {
      status: res.status(),
      title,
      rendered: !!matrixContainer,
      errors
    };
  } catch (err) {
    console.error("❌ Live verification failed:", err.message);
    throw err;
  } finally {
    await browser.close();
  }
}

verifyLiveProduction().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
