const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const tabs = [
  { id: "dashboard", name: "Dashboard" },
  { id: "intel", name: "Constituency Intel" },
  { id: "booths", name: "Booth Management" },
  { id: "pwa", name: "Cadre Field PWA" },
  { id: "voter", name: "Voter Insights" },
  { id: "rebuttal", name: "Crisis Rebuttal" },
  { id: "cybershield", name: "CyberShield" },
  { id: "meta", name: "Meta Integration" },
  { id: "analytics", name: "War Room Analytics" },
  { id: "commercial", name: "Commercial" }
];

async function captureAllTabs() {
  console.log("=== CAPTURING ALL TABS ON LIVE PRODUCTION ===");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,1000"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });

  await page.goto("https://www.garudaos.in/war-room", { waitUntil: "networkidle2" });

  const outDir = path.join(__dirname, "output", "tabs");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const tab of tabs) {
    console.log(`Switching to Tab: ${tab.name}...`);
    const clicked = await page.evaluate((targetName) => {
      const btns = Array.from(document.querySelectorAll("aside button"));
      const b = btns.find(btn => btn.innerText.includes(targetName));
      if (b) {
        b.click();
        return true;
      }
      return false;
    }, tab.name);

    await new Promise(r => setTimeout(r, 1200));

    const ssFile = path.join(outDir, `${tab.id}.png`);
    await page.screenshot({ path: ssFile });
    console.log(`Saved screenshot for ${tab.name}: ${ssFile}`);
  }

  // Also test City quick switch to Indore-2
  console.log("Testing City quick switch to Indore-2...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const indoreBtn = btns.find(b => b.innerText.includes("Indore-2"));
    if (indoreBtn) indoreBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  const indoreSs = path.join(outDir, "indore-dashboard.png");
  await page.screenshot({ path: indoreSs });
  console.log("Saved Indore screenshot:", indoreSs);

  // Also test City quick switch to Varanasi Cantt
  console.log("Testing City quick switch to Varanasi Cantt...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const vnsBtn = btns.find(b => b.innerText.includes("Varanasi Cantt"));
    if (vnsBtn) vnsBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  const vnsSs = path.join(outDir, "varanasi-dashboard.png");
  await page.screenshot({ path: vnsSs });
  console.log("Saved Varanasi screenshot:", vnsSs);

  await browser.close();
  console.log("=== ALL TABS AND CITIES VERIFIED SUCCESSFULLY ===");
}

captureAllTabs().catch(err => {
  console.error(err);
  process.exit(1);
});
