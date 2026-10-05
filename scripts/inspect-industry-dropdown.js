const puppeteer = require("puppeteer");
require("dotenv").config();

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,900"]
  });
  const page = await browser.newPage();
  await page.setCookie({
    name: "li_at",
    value: process.env.LINKEDIN_LI_AT,
    domain: ".linkedin.com",
    path: "/"
  });

  await page.goto("https://www.linkedin.com/in/garuda-ai-ai-operating-system-227168432/edit/intro/", {
    waitUntil: "domcontentloaded",
    timeout: 45000
  });
  await new Promise(r => setTimeout(r, 4000));

  const indInput = await page.$("input[aria-label='Industry']");
  if (indInput) {
    await indInput.click();
    await page.keyboard.type("Software", { delay: 40 });
    await new Promise(r => setTimeout(r, 2000));

    const dropdownDump = await page.evaluate(() => {
      // Find all elements appearing that contain Software Development
      const all = Array.from(document.querySelectorAll("*")).filter(el => {
        return (el.children.length === 0 || el.getAttribute("role") === "option") &&
               el.innerText && el.innerText.includes("Software Development");
      });

      return all.map(el => ({
        tagName: el.tagName,
        id: el.id,
        className: el.className,
        role: el.getAttribute("role"),
        tabIndex: el.getAttribute("tabindex"),
        outerHTML: el.outerHTML,
        parentOuterHTML: el.parentElement ? el.parentElement.outerHTML.substring(0, 300) : null
      }));
    });

    console.log("DROPDOWN DUMP:", JSON.stringify(dropdownDump, null, 2));
  }

  await browser.close();
})().catch(console.error);
