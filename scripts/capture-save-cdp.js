const puppeteer = require("puppeteer");
require("dotenv").config();

(async () => {
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

  const client = await page.target().createCDPSession();
  await client.send("Network.enable");
  
  client.on("Network.requestWillBeSent", (params) => {
    if (params.request.url.includes("saveProfileIntroForm")) {
      console.log(">>> REQUEST URL:", params.request.url);
      console.log(">>> POST DATA:", params.request.postData);
    }
  });

  client.on("Network.responseReceived", async (params) => {
    if (params.response.url.includes("saveProfileIntroForm")) {
      console.log("<<< RESPONSE STATUS:", params.response.status);
      console.log("<<< RESPONSE HEADERS:", JSON.stringify(params.response.headers, null, 2));
      try {
        const body = await client.send("Network.getResponseBody", { requestId: params.requestId });
        console.log("<<< RESPONSE BODY:", body.body.substring(0, 1000));
      } catch (err) {
        console.error("<<< Could not fetch body:", err.message);
      }
    }
  });

  const introUrl = "https://www.linkedin.com/in/garuda-ai-ai-operating-system-227168432/edit/intro/";
  await page.goto(introUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await new Promise(r => setTimeout(r, 4000));

  // Set Headline
  const headline = "Founder & Chief Architect @ GARUDA OS | India's Sovereign AI Operating System | Autonomous Software Engineering, Multi-Agent Swarms & Enterprise Automation | www.garudaos.in";
  const editor = await page.$("div.tiptap.ProseMirror[contenteditable='true']");
  if (editor) {
    await editor.click();
    await page.keyboard.down("Control");
    await page.keyboard.press("KeyA");
    await page.keyboard.up("Control");
    await page.keyboard.press("Backspace");
    await page.keyboard.type(headline, { delay: 4 });
  }

  // Set Industry
  const indInput = await page.$("input[aria-label='Industry']");
  if (indInput) {
    await indInput.click();
    await page.keyboard.type("Software", { delay: 30 });
    const option = await page.waitForSelector("div[role='option']", { visible: true, timeout: 10000 });
    await option.click();
    await new Promise(r => setTimeout(r, 2000));
  }

  // Click Save
  const saveBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    return btns.find(b => (b.innerText || "").trim() === "Save" && !b.disabled);
  });
  if (saveBtn) await saveBtn.asElement().click();

  await new Promise(r => setTimeout(r, 8000));
  await browser.close();
})().catch(console.error);
