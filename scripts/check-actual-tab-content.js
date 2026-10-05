const puppeteer = require("puppeteer");

async function checkActualContent() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,1000"]
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto("https://www.garudaos.in/war-room", { waitUntil: "networkidle2" });

  // 1. Check initial state
  const initialH1 = await page.$eval("h1", el => el.innerText);
  console.log("INITIAL H1:", initialH1);

  // 2. Select Indore from Quick Switch
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
  const newH1 = await page.$eval("h1", el => el.innerText);
  console.log("AFTER SWITCH H1:", newH1);

  // 3. Check tabs
  const tabNames = ["Field Ops", "Voter Segments", "Crisis & Rebuttal", "Evidence Vault"];

  for (const tName of tabNames) {
    console.log(`\n--- TESTING TAB: ${tName} ---`);
    const allButtons = await page.$$("aside button");
    for (const btn of allButtons) {
      const txt = await page.evaluate(el => el.innerText, btn);
      if (txt && txt.toLowerCase().includes(tName.toLowerCase())) {
        await btn.click();
        console.log(`Clicked tab button: ${txt.replace(/\n/g, ' ')}`);
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1500));

    const contentText = await page.evaluate(() => {
      // Find main content below nav
      const main = document.querySelector("main");
      return main ? main.innerText : "MAIN NOT FOUND";
    });

    console.log(`Content length: ${contentText.length}`);
    console.log("Snippet (first 500 chars):\n" + contentText.slice(0, 500));

    // Check if Thane appears
    const hasThane = contentText.includes("Thane") || contentText.includes("TMC") || contentText.includes("Naupada");
    console.log(`Contains Thane/TMC/Naupada: ${hasThane}`);
  }

  await browser.close();
}

checkActualContent().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
