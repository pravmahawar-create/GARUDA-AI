const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function run() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,900"]
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setCookie({
    name: "li_at",
    value: process.env.LINKEDIN_LI_AT,
    domain: ".linkedin.com",
    path: "/"
  });

  page.on("response", async (res) => {
    if (res.request().method() === "POST" && (res.url().includes("voyager") || res.url().includes("flagship") || res.url().includes("graphql"))) {
      console.log(`[HTTP ${res.status()}] POST ${res.url().substring(0, 110)}`);
      try {
        const txt = await res.text();
        if (txt.includes("error") || txt.includes("FAIL") || res.status() >= 400) {
          console.log("ERR RES BODY:", txt.substring(0, 300));
        }
      } catch (e) {}
    }
  });

  const introUrl = "https://www.linkedin.com/in/garuda-ai-ai-operating-system-227168432/edit/intro/";
  console.log("Navigating to:", introUrl);
  await page.goto(introUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await new Promise(r => setTimeout(r, 4000));

  // 1. Headline
  const headline = "Founder & Chief Architect @ GARUDA OS | India's Sovereign AI Operating System | Autonomous Software Engineering, Multi-Agent Swarms & Enterprise Automation | www.garudaos.in";
  const editor = await page.$("div.tiptap.ProseMirror[contenteditable='true']");
  if (editor) {
    console.log("Setting Headline...");
    await editor.click();
    await new Promise(r => setTimeout(r, 200));
    await page.keyboard.down("Control");
    await page.keyboard.press("KeyA");
    await page.keyboard.up("Control");
    await page.keyboard.press("Backspace");
    await new Promise(r => setTimeout(r, 200));
    await page.keyboard.type(headline, { delay: 6 });
    await new Promise(r => setTimeout(r, 500));
  }

  // 2. Industry
  const indInput = await page.$("input[aria-label='Industry']");
  if (indInput) {
    console.log("Focusing Industry input...");
    await indInput.click();
    await new Promise(r => setTimeout(r, 200));
    await page.keyboard.down("Control");
    await page.keyboard.press("KeyA");
    await page.keyboard.up("Control");
    await page.keyboard.press("Backspace");
    await new Promise(r => setTimeout(r, 200));
    await page.keyboard.type("Software", { delay: 40 });

    console.log("Waiting for option...");
    const option = await page.waitForSelector("div[role='option']", { visible: true, timeout: 10000 });
    console.log("Clicking option...");
    await option.click();
    await new Promise(r => setTimeout(r, 2000));
  }

  const preSaveShot = path.join(OUTPUT_DIR, "pre_save_complete.png");
  await page.screenshot({ path: preSaveShot });
  console.log("Pre-save screenshot saved:", preSaveShot);

  // 3. Save
  console.log("Locating Save button...");
  const saveBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    return btns.find(b => (b.innerText || "").trim() === "Save" && !b.disabled);
  });

  if (!saveBtn || !saveBtn.asElement()) {
    throw new Error("Save button not found!");
  }

  console.log("Clicking Save button with native click...");
  await saveBtn.asElement().click();
  console.log("Waiting 8 seconds for server response and save processing...");
  await new Promise(r => setTimeout(r, 8000));

  const postSaveShot = path.join(OUTPUT_DIR, "post_save_result.png");
  await page.screenshot({ path: postSaveShot });
  console.log("Post-save screenshot saved:", postSaveShot);

  const errors = await page.evaluate(() => {
    return Array.from(document.querySelectorAll(".artdeco-inline-feedback, [role='alert'], .artdeco-toast-item, .error"))
      .map(e => e.innerText.trim());
  });
  console.log("Page errors/toasts:", errors);

  // 4. Verify profile page
  console.log("Navigating to profile page to confirm live state...");
  await page.goto("https://www.linkedin.com/in/me/", { waitUntil: "domcontentloaded", timeout: 45000 });
  await new Promise(r => setTimeout(r, 5000));

  const liveProofShot = path.join(OUTPUT_DIR, "profile_headline_industry_live_proof.png");
  await page.screenshot({ path: liveProofShot, fullPage: true });
  console.log("Live proof screenshot saved:", liveProofShot);

  const profileCardText = await page.evaluate(() => {
    const topCard = document.querySelector("main section") || document.querySelector("section");
    return topCard ? topCard.innerText : "No card found";
  });
  console.log("TOP CARD TEXT:\n", profileCardText.substring(0, 400));

  await browser.close();
}

run().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
