const puppeteer = require("puppeteer");

async function checkThaneLeaks() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,1000"]
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto("https://www.garudaos.in/war-room", { waitUntil: "networkidle2" });

  // Click Indore
  const buttons = await page.$$("button");
  for (const b of buttons) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text && text.includes("Indore")) {
      await b.click();
      console.log("Selected Indore-2 (205)");
      break;
    }
  }
  await new Promise(r => setTimeout(r, 2000));

  const bannedWords = ["Thane", "TMC", "Naupada", "Kopri", "Ghodbunder", "Teen Hath Naka", "Wagle", "Hiranandani"];

  const tabDefs = [
    { id: "dashboard", match: "command center" },
    { id: "intel", match: "intelligence" },
    { id: "booths", match: "field ops" },
    { id: "pwa", match: "cadre pwa" },
    { id: "voter", match: "voter segments" },
    { id: "rebuttal", match: "crisis" },
    { id: "cybershield", match: "evidence vault" },
    { id: "meta", match: "meta integration" },
    { id: "analytics", match: "reports" },
    { id: "commercial", match: "commercial" }
  ];

  for (const tab of tabDefs) {
    const allNav = await page.$$("aside button");
    for (const nb of allNav) {
      const txt = await page.evaluate(el => el.innerText.toLowerCase(), nb);
      if (txt.includes(tab.match)) {
        await nb.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1200));

    const result = await page.evaluate((banned, tabId) => {
      // Exclude the top quick-switch bar from leak check so we test actual content
      const content = document.querySelector("main")?.cloneNode(true);
      // Remove quick switch bar from cloned content if present
      const qs = content?.querySelector("div[style*='overflowX: auto'], div[style*='overflow-x: auto']");
      if (qs) qs.remove();

      const text = content?.innerText || "";
      const matches = [];
      banned.forEach(w => {
        if (text.includes(w)) {
          matches.push(w);
        }
      });
      return {
        tab: tabId,
        matches,
        sample: text.replace(/\n+/g, " | ").slice(0, 200)
      };
    }, bannedWords, tab.id);

    console.log(`[TAB: ${result.tab}] Leak count: ${result.matches.length} -> [${result.matches.join(", ")}]`);
    if (result.matches.length > 0) {
      console.log(`   Sample text with leak: ${result.sample}`);
    }
  }

  await browser.close();
}

checkThaneLeaks().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
