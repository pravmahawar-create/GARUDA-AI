const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

async function checkWarRoomLive() {
  console.log("=== INITIATING LIVE WAR ROOM VERIFICATION ===");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,1000"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });

  const consoleLogs = [];
  const errors = [];

  page.on("console", msg => {
    const text = msg.text();
    consoleLogs.push(`[${msg.type()}] ${text}`);
    if (msg.type() === "error") {
      errors.push(text);
    }
  });

  page.on("pageerror", err => {
    errors.push(`Page Error: ${err.message}`);
  });

  console.log("Navigating to https://www.garudaos.in/war-room ...");
  const response = await page.goto("https://www.garudaos.in/war-room", {
    waitUntil: "networkidle2",
    timeout: 30000
  });

  console.log("HTTP Status:", response.status());

  // Wait a moment for React hydration
  await new Promise(r => setTimeout(r, 2000));

  // Check title and basic layout
  const title = await page.title();
  console.log("Page Title:", title);

  // Check what tabs exist
  const tabButtons = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    return buttons.map(b => ({
      text: b.innerText.trim().replace(/\n/g, " - "),
      disabled: b.disabled,
      className: b.className
    })).filter(b => b.text.length > 0);
  });

  console.log(`Found ${tabButtons.length} buttons on page.`);

  // Check City Selector
  const citySelect = await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll("select"));
    return selects.map(s => ({
      value: s.value,
      options: Array.from(s.options).map(o => o.text)
    }));
  });
  console.log("Select elements:", JSON.stringify(citySelect, null, 2));

  // Take full screenshot
  const outDir = path.join(__dirname, "output");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const ssPath = path.join(outDir, "war-room-live-initial.png");
  await page.screenshot({ path: ssPath, fullPage: true });
  console.log("Initial screenshot saved to:", ssPath);

  // Test clicking each tab!
  const targetTabs = [
    "Constituency Intel",
    "Booth Management",
    "Cadre Field PWA",
    "Voter Insights",
    "Crisis Rebuttal",
    "CyberShield",
    "Meta Integration",
    "War Room Analytics",
    "Commercial"
  ];

  console.log("\n--- Testing Tab Clicks ---");
  for (const tabName of targetTabs) {
    const clicked = await page.evaluate((name) => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const target = buttons.find(b => b.innerText.includes(name));
      if (target) {
        target.click();
        return true;
      }
      return false;
    }, tabName);

    await new Promise(r => setTimeout(r, 800));

    // Get current active view/content header
    const currentHeading = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      const h2 = document.querySelector("h2");
      const h3 = document.querySelector("h3");
      return {
        h1: h1 ? h1.innerText.trim() : null,
        h2: h2 ? h2.innerText.trim() : null,
        h3: h3 ? h3.innerText.trim() : null
      };
    });

    console.log(`Tab [${tabName}] -> Clicked: ${clicked} | Heading:`, JSON.stringify(currentHeading));
  }

  // Check city selector changing to Indore-2
  console.log("\n--- Testing City Selector Change ---");
  const cityChanged = await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll("select"));
    if (selects.length > 0) {
      const sel = selects[0];
      const indoreOpt = Array.from(sel.options).find(o => o.text.includes("Indore") || o.value.includes("indore"));
      if (indoreOpt) {
        sel.value = indoreOpt.value;
        sel.dispatchEvent(new Event("change", { bubbles: true }));
        return { success: true, chosen: indoreOpt.text };
      }
    }
    return { success: false };
  });
  console.log("City change test result:", cityChanged);

  await new Promise(r => setTimeout(r, 1000));
  const ssCityPath = path.join(outDir, "war-room-live-indore.png");
  await page.screenshot({ path: ssCityPath, fullPage: true });
  console.log("City change screenshot saved to:", ssCityPath);

  console.log("\n=== Console Errors ===");
  console.log(errors.length > 0 ? errors : "Zero console errors!");

  await browser.close();
}

checkWarRoomLive().catch(err => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
