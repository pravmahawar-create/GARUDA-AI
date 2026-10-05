const puppeteer = require("puppeteer");
require("dotenv").config();

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--window-size=1280,900"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setCookie({ name: "li_at", value: process.env.LINKEDIN_LI_AT, domain: ".linkedin.com", path: "/" });

  await page.goto("https://www.linkedin.com/in/me/", { waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 6000));

  const editElements = await page.evaluate(() => {
    const list = Array.from(document.querySelectorAll("a, button, [role='button']"));
    return list
      .map(el => ({
        tag: el.tagName,
        ariaLabel: el.getAttribute("aria-label"),
        id: el.id,
        className: el.className?.slice ? el.className.slice(0, 50) : "",
        text: (el.innerText || "").trim().slice(0, 50),
        href: el.getAttribute("href")
      }))
      .filter(el => {
        const al = (el.ariaLabel || "").toLowerCase();
        const t = (el.text || "").toLowerCase();
        const h = (el.href || "").toLowerCase();
        return al.includes("edit") || t.includes("edit") || h.includes("edit") || al.includes("intro");
      });
  });

  console.log("Edit elements:", JSON.stringify(editElements, null, 2));
  await browser.close();
})();
