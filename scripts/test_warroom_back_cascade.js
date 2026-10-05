const http = require("http");
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const PORT = 4189;
const DIST_DIR = path.resolve(__dirname, "../frontend/dist");

// Simple static file server with SPA routing fallback
function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = req.url.split("?")[0];
      let filePath = path.join(DIST_DIR, reqPath);

      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, "index.html");
      }

      if (!fs.existsSync(filePath)) {
        // Check if html file exists
        if (fs.existsSync(filePath + ".html")) {
          filePath = filePath + ".html";
        } else if (fs.existsSync(path.join(DIST_DIR, reqPath, "index.html"))) {
          filePath = path.join(DIST_DIR, reqPath, "index.html");
        } else {
          filePath = path.join(DIST_DIR, "index.html");
        }
      }

      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        ".html": "text/html",
        ".js": "text/javascript",
        ".css": "text/css",
        ".json": "application/json",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".svg": "image/svg+xml",
        ".woff2": "font/woff2"
      };

      const contentType = mimeTypes[ext] || "application/octet-stream";
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end("Not Found");
        } else {
          res.writeHead(200, { "Content-Type": contentType });
          res.end(data);
        }
      });
    });

    server.listen(PORT, () => {
      console.log(`[TEST-SERVER] Running on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function runTests() {
  const server = await startServer();
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    // Simulate Mobile Viewport (Android / iPhone standard)
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

    console.log(`[TEST] Navigating to http://localhost:${PORT}/war-room...`);
    await page.goto(`http://localhost:${PORT}/war-room`, { waitUntil: "networkidle0", timeout: 20000 });

    // Wait for war room header to appear
    await page.waitForSelector(".garuda-war-room-header", { timeout: 10000 });
    console.log("✅ War Room loaded successfully in mobile viewport");

    // 1. Initial State: Root Dashboard
    const initialBackBtn = await page.$("button[aria-label='Pichle Screen Par Jayein']");
    if (initialBackBtn) {
      throw new Error("FAIL: Back button should NOT be visible on initial root dashboard");
    }
    console.log("✅ Step 1: Initial state is root Dashboard. No Back button visible.");

    // 2. Click Booths tab in mobile bottom nav
    const boothsBtn = await page.waitForSelector("button[aria-label='Booths']");
    await boothsBtn.click();
    await wait(600);

    // Verify back button is now visible
    const backBtnStep2 = await page.waitForSelector("button[aria-label='Pichle Screen Par Jayein']", { timeout: 3000 });
    if (!backBtnStep2) {
      throw new Error("FAIL: Back button should be visible after navigating to Booths");
    }
    console.log("✅ Step 2: Navigated to Booths. Sequential '← Back' button appeared in mobile header.");

    // 3. Click Intel tab in mobile bottom nav
    const intelBtn = await page.waitForSelector("button[aria-label='Intel']");
    await intelBtn.click();
    await wait(600);
    console.log("✅ Step 3: Navigated to Intel tab.");

    // 4. Test Sequential Tab History (Tier 2): Press Back -> should go back to Booths
    console.log("[TEST] Testing Tier 2: Triggering back navigation from Intel...");
    await page.evaluate(() => window.history.back());
    await wait(600);

    // Check if Booths is active
    const currentTabAfterFirstBack = await page.evaluate(() => {
      // Find active tab indicator in bottom nav
      const buttons = Array.from(document.querySelectorAll(".mobile-bottom-nav button"));
      const boothsBtn = buttons.find(b => b.getAttribute("aria-label") === "Booths");
      const intelBtn = buttons.find(b => b.getAttribute("aria-label") === "Intel");
      const boothsActive = boothsBtn ? boothsBtn.querySelector("span[style*='background']") !== null : false;
      const intelActive = intelBtn ? intelBtn.querySelector("span[style*='background']") !== null : false;
      return { boothsActive, intelActive };
    });

    if (!currentTabAfterFirstBack.boothsActive) {
      throw new Error("FAIL: Tier 2 did not step back to Booths tab!");
    }
    console.log("✅ Step 4 (Tier 2 Verified): First Back press smoothly stepped back from Intel -> Booths!");

    // 5. Press Back again -> should step back to Dashboard
    console.log("[TEST] Testing Tier 2: Triggering back navigation from Booths...");
    await page.evaluate(() => window.history.back());
    await wait(600);

    const currentTabAfterSecondBack = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll(".mobile-bottom-nav button"));
      const overviewBtn = buttons.find(b => b.getAttribute("aria-label") === "Overview");
      return overviewBtn ? overviewBtn.querySelector("span[style*='background']") !== null : false;
    });

    if (!currentTabAfterSecondBack) {
      throw new Error("FAIL: Tier 2 did not step back to Overview / Dashboard tab!");
    }
    console.log("✅ Step 5 (Tier 2 Verified): Second Back press smoothly stepped back from Booths -> Overview (Dashboard)!");

    // 6. Test Tier 3: Press Back on Root Dashboard -> Should NOT exit, should show Toast
    console.log("[TEST] Testing Tier 3: Triggering back navigation on Root Dashboard...");
    await page.evaluate(() => window.history.back());
    await wait(400);

    const toastText = await page.evaluate(() => {
      const toast = document.querySelector("div[role='status']");
      return toast ? toast.innerText : null;
    });

    if (!toastText || !toastText.includes("War Room se bahar nikalne ke liye dubara Back dabayein")) {
      throw new Error(`FAIL: Tier 3 toast did not appear! Got: ${toastText}`);
    }
    console.log(`✅ Step 6 (Tier 3 Verified): Root Back press intercepted! Calm toast shown: "${toastText.trim()}"`);

    // 7. Test Tier 1: Open Mobile Menu Drawer, trigger Back -> Drawer closes, stays on page
    console.log("[TEST] Testing Tier 1: Opening Mobile Navigation Menu drawer...");
    const menuBtn = await page.waitForSelector("button[aria-label='Open Navigation Menu']");
    await menuBtn.click();
    await wait(400);

    // Verify overlay or drawer open
    const isMenuOpen = await page.evaluate(() => {
      return document.querySelector(".mobile-drawer-overlay") !== null;
    });
    if (!isMenuOpen) {
      throw new Error("FAIL: Mobile menu drawer did not open!");
    }
    console.log("✅ Drawer opened. Now triggering Back button...");

    await page.evaluate(() => window.history.back());
    await wait(500);

    const isMenuClosed = await page.evaluate(() => {
      return document.querySelector(".mobile-drawer-overlay") === null;
    });

    if (!isMenuClosed) {
      throw new Error("FAIL: Tier 1 did not close drawer on Back press!");
    }
    console.log("✅ Step 7 (Tier 1 Verified): Back press cleanly closed mobile drawer without navigating away or closing app!");

    console.log("\n========================================================");
    console.log("🎉 ALL 3 TIERS & SEQUENTIAL HISTORY VERIFIED CLEAN 100%!");
    console.log("========================================================");

  } finally {
    if (browser) await browser.close();
    server.close();
  }
}

runTests().catch((err) => {
  console.error("❌ TEST FAILED:", err);
  process.exit(1);
});
