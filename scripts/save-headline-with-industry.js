const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--window-size=1280,900"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setCookie({ name: "li_at", value: process.env.LINKEDIN_LI_AT, domain: ".linkedin.com", path: "/" });

  await page.goto("https://www.linkedin.com/in/garuda-ai-ai-operating-system-227168432/edit/intro/", { waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 6000));

  // Find Industry input
  console.log("Finding Industry input...");
  const industryInput = await page.evaluateHandle(() => {
    const inputs = Array.from(document.querySelectorAll("input"));
    return inputs.find(i => {
      const label = i.closest("label")?.innerText || "";
      const p = i.placeholder || "";
      const aria = i.getAttribute("aria-label") || "";
      return label.includes("Industry") || p.includes("Industry") || aria.includes("Industry") || i.id.includes("industry");
    }) || inputs.find(i => i.getAttribute("role") === "combobox" && (i.closest("div")?.innerText || "").includes("Industry"));
  });

  if (industryInput) {
    console.log("Found industry input! Typing 'Software Development'...");
    await industryInput.click();
    await page.keyboard.type("Software Development", { delay: 30 });
    await new Promise(r => setTimeout(r, 2000));

    await page.screenshot({ path: path.join(__dirname, "..", "output", "industry_autocomplete.png") });
    console.log("Saved: output/industry_autocomplete.png");

    // Press arrow down and enter
    await page.keyboard.press("ArrowDown");
    await new Promise(r => setTimeout(r, 500));
    await page.keyboard.press("Enter");
    await new Promise(r => setTimeout(r, 1000));
  } else {
    console.log("Could not find industry input!");
  }

  // Also verify headline is set
  const editor = await page.$("div.tiptap.ProseMirror[contenteditable='true']");
  if (editor) {
    const text = await page.evaluate(el => el.innerText, editor);
    console.log("Current editor text:", text);
    if (!text.includes("Chief Architect")) {
      await editor.click();
      await page.keyboard.down("Control");
      await page.keyboard.press("KeyA");
      await page.keyboard.up("Control");
      await page.keyboard.press("Backspace");
      await page.keyboard.type("Founder & Chief Architect @ GARUDA OS | India's Sovereign AI Operating System | Autonomous Software Engineering, Multi-Agent Swarms & Enterprise Automation | www.garudaos.in 🦅", { delay: 10 });
    }
  }

  // Click Save
  console.log("Clicking Save button...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const saveBtn = btns.find(b => (b.innerText || "").trim() === "Save" && !b.disabled);
    if (saveBtn) saveBtn.click();
  });

  await new Promise(r => setTimeout(r, 6000));
  await page.screenshot({ path: path.join(__dirname, "..", "output", "headline_saved_final.png") });
  console.log("Saved: output/headline_saved_final.png");

  await browser.close();
})();
