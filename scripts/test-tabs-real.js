const puppeteer = require("puppeteer");

async function testTabsReal() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,1000"]
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto("https://www.garudaos.in/war-room", { waitUntil: "networkidle2" });

  // 1. Select Indore from Quick Switch
  console.log("Selecting Indore...");
  const buttons = await page.$$("button");
  for (const b of buttons) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text && text.includes("Indore")) {
      await b.click();
      console.log("Clicked Indore button!");
      break;
    }
  }
  await new Promise(r => setTimeout(r, 2000));
  console.log("Current H1:", await page.$eval("h1", el => el.innerText));

  // 2. Click each sidebar item by exact title
  const tabsToTest = [
    { name: "Constituency Intel", key: "intel" },
    { name: "Booth Management", key: "booths" },
    { name: "Cadre Field PWA", key: "pwa" },
    { name: "Voter Insights", key: "voter" },
    { name: "Crisis Rebuttal", key: "rebuttal" },
    { name: "CyberShield", key: "cybershield" },
    { name: "War Room Analytics", key: "analytics" },
    { name: "Commercial", key: "commercial" }
  ];

  for (const tab of tabsToTest) {
    console.log(`\n========================================`);
    console.log(`TESTING TAB: ${tab.name} (${tab.key})`);
    console.log(`========================================`);

    const allSidebarButtons = await page.$$("nav button");
    let clicked = false;
    for (const btn of allSidebarButtons) {
      const txt = await page.evaluate(el => el.innerText, btn);
      if (txt && txt.includes(tab.name)) {
        await btn.click();
        clicked = true;
        console.log(`Clicked tab button: ${tab.name}`);
        break;
      }
    }

    if (!clicked) {
      console.log(`ERROR: Could not find button for ${tab.name}`);
      continue;
    }

    await new Promise(r => setTimeout(r, 1500));

    const analysis = await page.evaluate((tabKey) => {
      // Main content
      const main = document.querySelector("main");
      const fullText = main ? main.innerText : "";

      // Check specific Thane leaks
      const thaneTerms = ["Thane", "TMC", "Naupada", "Kopri", "Ghodbunder", "Teen Hath Naka", "148", "Wagle"];
      const leaks = [];
      thaneTerms.forEach(t => {
        // Exclude the quick switch bar itself
        const lines = fullText.split("\n");
        lines.forEach(l => {
          if (!l.includes("BATTLEGROUND QUICK-SWITCH") && !l.includes("Thane (148)") && l.includes(t)) {
            leaks.push(`${t} in: "${l.trim()}"`);
          }
        });
      });

      return {
        tabKey,
        leaks: Array.from(new Set(leaks)),
        textSnippet: fullText.slice(0, 400).replace(/\n+/g, " | ")
      };
    }, tab.key);

    console.log(`Snippet: ${analysis.textSnippet}`);
    if (analysis.leaks.length > 0) {
      console.log(`🚨 FOUND ${analysis.leaks.length} THANE LEAKS IN TAB [${tab.name}]:`);
      analysis.leaks.forEach(l => console.log(`   - ${l}`));
    } else {
      console.log(`✅ ZERO THANE LEAKS in ${tab.name}`);
    }
  }

  await browser.close();
}

testTabsReal().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
