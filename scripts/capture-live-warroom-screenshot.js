const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const HTML_DIST_FILE = path.resolve(__dirname, "../frontend/dist/war-room.html");
const PNG_OUTPUT = path.resolve(__dirname, "../data/creative-assets/live_war_room_rendered.png");
const ARTIFACT_PNG = "C:\\Users\\hp\\.gemini\\antigravity-cli\\brain\\c877ab8c-45f8-4814-ae0c-db52efac7c4f\\live_war_room_rendered.png";

async function capture() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  
  const fileUrl = "file://" + path.resolve(__dirname, "../frontend/dist/war-room.html").replace(/\\/g, "/");
  console.log("Navigating to:", fileUrl);
  await page.goto(fileUrl, { waitUntil: "networkidle0" });

  await page.screenshot({ path: PNG_OUTPUT, fullPage: true });
  console.log("✔ Screenshot captured:", PNG_OUTPUT);

  try {
    fs.copyFileSync(PNG_OUTPUT, ARTIFACT_PNG);
    console.log("✔ Copied to artifact:", ARTIFACT_PNG);
  } catch (e) {
    console.warn("Could not copy artifact:", e.message);
  }

  await browser.close();
}

capture().catch(err => {
  console.error("Capture failed:", err);
  process.exit(1);
});
