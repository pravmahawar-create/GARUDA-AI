const puppeteer = require("puppeteer");
const path = require("path");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function inspectAndClickWebsite() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");

    await page.setCookie(
      { name: "c_user", value: process.env.FB_C_USER.trim(), domain: ".facebook.com", path: "/", secure: true },
      { name: "xs", value: process.env.FB_XS.trim(), domain: ".facebook.com", path: "/", httpOnly: true, secure: true }
    );

    await page.goto("https://www.facebook.com/me/about", { waitUntil: "networkidle2", timeout: 45000 });
    await new Promise(r => setTimeout(r, 4000));

    // Click Links
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll("a, span, div[role='button']"));
      for (const item of items) {
        if ((item.innerText || "").trim() === "Links") {
          item.click();
          break;
        }
      }
    });
    await new Promise(r => setTimeout(r, 3000));

    // Find the element with "Websites, blogs, portfolios" and inspect its hierarchy
    const info = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll("*"));
      for (const el of all) {
        if ((el.innerText || "").includes("Websites, blogs, portfolios")) {
          // Find clickable ancestor or itself
          let curr = el;
          while (curr && curr.tagName !== "A" && curr.getAttribute("role") !== "button" && curr.parentElement) {
            if (curr.getAttribute("role") === "button" || curr.tagName === "A") break;
            curr = curr.parentElement;
          }
          const rect = (curr || el).getBoundingClientRect();
          if (curr) {
            curr.click();
          } else {
            el.click();
          }
          return {
            tag: (curr || el).tagName,
            role: (curr || el).getAttribute("role"),
            rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
          };
        }
      }
      return null;
    });

    console.log("Website element info & click:", JSON.stringify(info, null, 2));
    await new Promise(r => setTimeout(r, 4000));

    const shot = path.join(OUTPUT_DIR, "fb_website_clicked_inspect.png");
    await page.screenshot({ path: shot });
    console.log("Saved screenshot:", shot);

    // List all inputs
    const inputs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("input, textarea")).map(i => ({
        tag: i.tagName,
        placeholder: i.placeholder,
        value: i.value,
        ariaLabel: i.getAttribute("aria-label"),
        type: i.type
      }));
    });
    console.log("Inputs visible:", JSON.stringify(inputs, null, 2));

  } finally {
    await browser.close();
  }
}

inspectAndClickWebsite().catch(console.error);
