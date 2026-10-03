const puppeteer = require("puppeteer");
const { spawn } = require("child_process");

async function testLocalBuildTabs() {
  console.log("Starting local Vite preview server on port 5175...");
  const server = spawn("npx", ["vite", "preview", "--port", "5175", "--outDir", "dist"], {
    cwd: "D:\\GARUDA-AI\\frontend",
    shell: true,
    stdio: "ignore"
  });

  // Give server 2.5s to start
  await new Promise(r => setTimeout(r, 2500));

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,1000"]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000 });
    await page.goto("http://localhost:5175/war-room", { waitUntil: "networkidle2" });

    const citiesToTest = ["Shantinagar", "Civil Lines", "Ghatlodia"];

    for (const testCity of citiesToTest) {
      console.log(`\n======================================================`);
      console.log(`TESTING CITY ACTIVATION: ${testCity}`);
      console.log(`======================================================`);

      // Find and click the city button in Quick Switch
      const buttons = await page.$$("button");
      let cityClicked = false;
      for (const b of buttons) {
        const text = await page.evaluate(el => el.innerText, b);
        if (text && text.includes(testCity)) {
          await b.click();
          cityClicked = true;
          console.log(`Clicked ${testCity} button!`);
          break;
        }
      }

      if (!cityClicked) {
        console.error(`Could not find button for ${testCity}`);
        continue;
      }

      await new Promise(r => setTimeout(r, 1200));

      const h1El = await page.$("h1");
      const h1Text = h1El ? await page.evaluate(el => el.innerText, h1El) : "Active View";
      console.log(`Active H1: ${h1Text}`);

      const tabsToTest = [
        { name: "Command Center", key: "dashboard" },
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
        const allSidebarButtons = await page.$$("nav button");
        for (const btn of allSidebarButtons) {
          const txt = await page.evaluate(el => el.innerText, btn);
          if (txt && txt.includes(tab.name)) {
            await btn.click();
            break;
          }
        }

        await new Promise(r => setTimeout(r, 600));

        const analysis = await page.evaluate(() => {
          const main = document.querySelector("main");
          const fullText = main ? main.innerText : "";

          // Check specific Thane leaks
          const thaneTerms = ["Thane", "TMC", "Naupada", "Kopri", "Ghodbunder", "Teen Hath Naka", "148"];
          const leaks = [];
          const lines = fullText.split("\n");
          lines.forEach(l => {
            if (!l.includes("BATTLEGROUND QUICK-SWITCH") && !l.includes("Thane (148)")) {
              thaneTerms.forEach(t => {
                if (l.includes(t)) {
                  leaks.push(`${t} in: "${l.trim()}"`);
                }
              });
            }
          });

          return {
            leaks: Array.from(new Set(leaks)),
            snippet: fullText.slice(0, 180).replace(/\n+/g, " ")
          };
        });

        if (analysis.leaks.length > 0) {
          console.log(`🚨 [${testCity}] LEAK IN [${tab.name}]:`, analysis.leaks);
        } else {
          console.log(`✅ [${testCity}] ZERO LEAKS in [${tab.name}] | ${analysis.snippet.slice(0, 80)}...`);
        }
      }

      // Return to Command Center before testing next city
      const allNavBtns = await page.$$("nav button");
      for (const btn of allNavBtns) {
        const txt = await page.evaluate(el => el.innerText, btn);
        if (txt && txt.includes("Command Center")) {
          await btn.click();
          break;
        }
      }
      await new Promise(r => setTimeout(r, 600));
    }
  } finally {
    await browser.close();
    server.kill();
  }
}

testLocalBuildTabs().then(() => {
  console.log("\n*** LOCAL VERIFICATION COMPLETE ***");
  process.exit(0);
}).catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
