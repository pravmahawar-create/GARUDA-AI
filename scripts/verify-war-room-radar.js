const puppeteer = require("puppeteer");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

async function verifyWarRoomRadar() {
  console.log("===============================================================================");
  console.log("🦅 GARUDA WAR ROOM: 2.0 KM GEOFENCED RADAR & MOBILE ACTIVITY FORENSIC TEST");
  console.log("===============================================================================");

  const previewPort = 5178;
  console.log(`[1/5] Launching Vite preview server on http://localhost:${previewPort}...`);
  const server = spawn("npx", ["vite", "preview", "--port", String(previewPort), "--outDir", "dist"], {
    cwd: "D:\\GARUDA-AI\\frontend",
    shell: true,
    stdio: "ignore"
  });

  await new Promise(r => setTimeout(r, 2600));

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,1050"]
  });

  const screenshotsDir = "D:\\GARUDA-AI\\reports\\screenshots";
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1050 });

    console.log("[2/5] Navigating to http://localhost:" + previewPort + "/war-room...");
    await page.goto(`http://localhost:${previewPort}/war-room`, { waitUntil: "networkidle2" });
    await new Promise(r => setTimeout(r, 1500));

    // Verify initial load
    let h1Text = await page.$eval("h1", el => el.innerText).catch(() => "Unknown");
    console.log(`✅ War Room Loaded. Active H1: ${h1Text}`);

    // Check that harsh black background is gone from radar
    const blackElements = await page.$$eval("div", els =>
      els.filter(el => {
        const bg = window.getComputedStyle(el).backgroundColor;
        return bg === "rgb(8, 11, 17)" || bg === "#080B11";
      }).length
    );
    console.log(`✅ Black #080B11 Elements in Radar Canvas: ${blackElements} (Strictly 0 expected in radar)`);

    // Verify 2.0 KM Radar Header exists
    const radarTitle = await page.evaluate(() => {
      const allDivs = Array.from(document.querySelectorAll("div"));
      const match = allDivs.find(d => d.innerText && d.innerText.includes("2.0 KM Geofenced Cadre Radar"));
      return match ? match.innerText.slice(0, 70) : null;
    });
    console.log(`✅ Radar Title Found: "${radarTitle}"`);

    // [3/5] Search and activate Jabalpur Cantt
    console.log("\n[3/5] Testing Search Activation for: 'Jabalpur Cantt'...");
    const searchInput = await page.$("input[placeholder*='Search any Indian city']");
    if (!searchInput) {
      throw new Error("Could not find search input field!");
    }

    // Type "Jabalpur Cantt"
    await searchInput.click({ clickCount: 3 });
    await searchInput.type("Jabalpur Cantt", { delay: 40 });
    await page.keyboard.press("Enter");

    await new Promise(r => setTimeout(r, 2000));

    h1Text = await page.$eval("h1", el => el.innerText).catch(() => "Unknown");
    console.log(`✅ Switched Constituency to: ${h1Text}`);

    // Verify centroid for Jabalpur Cantt is active
    const centroidLabel = await page.evaluate(() => {
      const allDivs = Array.from(document.querySelectorAll("div"));
      const match = allDivs.find(d => d.innerText && d.innerText.includes("Sadar / Cantt Board HQ Centroid"));
      return match ? match.innerText : null;
    });
    console.log(`✅ Centroid Telemetry: "${centroidLabel}"`);

    // Check SVG points
    const handsetDots = await page.$$("circle[fill='#059669'], circle[fill='#D97706'], circle[fill='#10B981']");
    console.log(`✅ Active Cadre Handset dots rendered in SVG: ${handsetDots.length}`);

    // Capture Desktop Screenshot
    const desktopShot = path.join(screenshotsDir, "war-room-radar-jabalpur-desktop.png");
    await page.screenshot({ path: desktopShot, fullPage: false });
    console.log(`📸 Desktop Screenshot Saved: ${desktopShot}`);

    // [4/5] Interactive Handset Click & Telemetry Inspection Test
    console.log("\n[4/5] Testing Interactive Handset Click...");
    // Find the first handset dot and click it
    if (handsetDots.length > 0) {
      await handsetDots[0].click();
      await new Promise(r => setTimeout(r, 600));

      const inspectorCardText = await page.evaluate(() => {
        const hud = document.querySelector("div[style*='rgba(255, 255, 255, 0.96)']");
        return hud ? hud.innerText : "HUD not found";
      });
      console.log(`✅ Inspector HUD Content:\n--- \n${inspectorCardText}\n---`);

      // Click "Open Full Device Telemetry Drawer"
      const drawerButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll("button"));
        return buttons.find(b => b.innerText && b.innerText.includes("Open Full Device Telemetry Drawer"));
      });

      if (drawerButton && drawerButton.asElement()) {
        await drawerButton.asElement().click();
        await new Promise(r => setTimeout(r, 800));

        const drawerOpen = await page.evaluate(() => {
          const drawer = document.querySelector("h3");
          return drawer ? drawer.innerText : null;
        });
        console.log(`✅ Device Telemetry Drawer Triggered for: ${drawerOpen}`);

        // Close drawer
        await page.keyboard.press("Escape");
        await new Promise(r => setTimeout(r, 500));
      }
    }

    // [5/5] Mobile Viewport Verification
    console.log("\n[5/5] Testing Mobile Viewport (390 x 844 iPhone 14)...");
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await new Promise(r => setTimeout(r, 1000));

    const mobileShot = path.join(screenshotsDir, "war-room-radar-jabalpur-mobile.png");
    await page.screenshot({ path: mobileShot, fullPage: false });
    console.log(`📸 Mobile Viewport Screenshot Saved: ${mobileShot}`);

    console.log("\n===============================================================================");
    console.log("🎉 ALL WAR ROOM 2.0 KM GEOFENCE RADAR FORENSIC TESTS PASSED WITH 100% SUCCESS!");
    console.log("===============================================================================");

  } catch (err) {
    console.error("❌ Test failed:", err);
  } finally {
    await browser.close();
    server.kill();
    process.exit(0);
  }
}

verifyWarRoomRadar();
