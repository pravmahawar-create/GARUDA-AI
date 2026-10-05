const puppeteer = require("puppeteer");

async function testCitySwitch() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,1000"]
  });

  const page = await browser.newPage();
  page.on("console", msg => console.log("BROWSER CONSOLE:", msg.type(), msg.text()));
  page.on("pageerror", err => console.log("BROWSER ERROR:", err.message));
  page.on("requestfailed", req => console.log("REQUEST FAILED:", req.url(), req.failure().errorText));

  console.log("Navigating to https://www.garudaos.in/war-room ...");
  await page.goto("https://www.garudaos.in/war-room", { waitUntil: "networkidle2" });

  console.log("Finding quick-switch buttons...");
  const buttons = await page.$$("button");
  let indoreBtn = null;
  for (const b of buttons) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text && text.includes("Indore")) {
      indoreBtn = b;
      console.log("Found Indore button:", text.trim().replace(/\n/g, " "));
      break;
    }
  }

  if (indoreBtn) {
    await indoreBtn.click();
    console.log("Clicked Indore button, waiting 3s...");
    await new Promise(r => setTimeout(r, 3000));

    const pageData = await page.evaluate(() => {
      const h1 = document.querySelector("h1")?.innerText;
      const kpis = Array.from(document.querySelectorAll(".garuda-war-room-root div[style*='32px']")).map(el => el.innerText);
      const feedItems = Array.from(document.querySelectorAll(".garuda-war-room-root div[style*='whiteSpace']")).map(el => el.innerText);
      const allText = document.body.innerText;
      const hasThane = allText.includes("Thane") || allText.includes("Naupada") || allText.includes("Kopri") || allText.includes("TMC");
      return { h1, kpis, feedItems, hasThane };
    });

    console.log("PAGE DATA AFTER SWITCH:");
    console.log(JSON.stringify(pageData, null, 2));

    // Now switch to Field Ops Tab!
    console.log("\nSwitching to Field Ops tab...");
    const navButtons = await page.$$("aside button");
    for (const nb of navButtons) {
      const txt = await page.evaluate(el => el.innerText, nb);
      if (txt && txt.includes("Field Ops")) {
        await nb.click();
        console.log("Clicked Field Ops tab");
        break;
      }
    }
    await new Promise(r => setTimeout(r, 2000));

    const fieldOpsText = await page.evaluate(() => {
      return document.querySelector("main")?.innerText?.slice(0, 1000);
    });
    console.log("FIELD OPS CONTENT SAMPLE:\n", fieldOpsText);

    // Switch to Rebuttal Tab!
    console.log("\nSwitching to Rebuttal tab...");
    for (const nb of navButtons) {
      const txt = await page.evaluate(el => el.innerText, nb);
      if (txt && (txt.includes("Rebuttal") || txt.includes("Crisis"))) {
        await nb.click();
        console.log("Clicked Rebuttal tab");
        break;
      }
    }
    await new Promise(r => setTimeout(r, 2000));

    const rebuttalText = await page.evaluate(() => {
      return document.querySelector("main")?.innerText?.slice(0, 1000);
    });
    console.log("REBUTTAL CONTENT SAMPLE:\n", rebuttalText);
  } else {
    console.log("Indore button not found!");
  }

  await browser.close();
}

testCitySwitch().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
