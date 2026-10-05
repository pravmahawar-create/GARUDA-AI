const puppeteer = require("puppeteer");
require("dotenv").config();

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--window-size=1280,900"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setCookie({ name: "li_at", value: process.env.LINKEDIN_LI_AT, domain: ".linkedin.com", path: "/" });

  await page.goto("https://www.linkedin.com/in/garuda-ai-ai-operating-system-227168432/edit/intro/", { waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 6000));

  const indInput = await page.$("input[placeholder*='Search'], input[id*='ri']");
  if (indInput) {
    await indInput.click();
    await page.keyboard.type("Software Development", { delay: 10 });
    await new Promise(r => setTimeout(r, 2000));

    const items = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll("*"));
      return all
        .filter(el => (el.innerText || "").includes("Software Development") && el.tagName !== "INPUT" && el.children.length < 3)
        .map(el => ({
          tag: el.tagName,
          id: el.id,
          role: el.getAttribute("role"),
          className: el.className?.slice ? el.className.slice(0, 50) : "",
          text: (el.innerText || "").trim().slice(0, 50),
          hasOnClick: !!el.onclick
        }));
    });

    console.log("Matched items:", JSON.stringify(items, null, 2));
  }

  await browser.close();
})();
