require("dotenv").config();
const puppeteer = require("puppeteer");
const path = require("path");

const PROFILE_DIR = path.resolve(__dirname, "../.chrome-profile/garuda");

async function run() {
  const email = process.env.LINKEDIN_EMAIL;
  const pass = process.env.LINKEDIN_PASS;
  if (!email || !pass) { console.error("MISSING_CREDS"); process.exit(1); }

  console.log("Launching REAL Chrome (visible) with persistent profile:", PROFILE_DIR);
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: false,
    userDataDir: PROFILE_DIR,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--window-size=1280,900"
    ],
    defaultViewport: null
  });

  try {
    const pages = await browser.pages();
    const page = pages[0] || (await browser.newPage());
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.8010.53 Safari/537.36");

    await page.goto("https://www.linkedin.com/login", { waitUntil: "domcontentloaded", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 2500));

    const hasForm = await page.$('input[type="email"]');
    if (hasForm) {
      console.log("Login form found — filling credentials (React-safe)…");
      const fillState = await page.evaluate((em, pw) => {
        const vis = (el) => el.offsetParent !== null;
        const emailEl = [...document.querySelectorAll("input")].filter((i) => i.type === "email").find(vis) || document.querySelector('input[type="email"]');
        const passEl = [...document.querySelectorAll("input")].filter((i) => i.type === "password").find(vis) || document.querySelector('input[type="password"]');
        const setVal = (el, v) => {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
          setter.call(el, v);
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
        };
        setVal(emailEl, em);
        setVal(passEl, pw);
        return { emailVal: emailEl.value, passLen: (passEl.value || "").length };
      }, email, pass);
      console.log("Filled:", JSON.stringify({ email: fillState.emailVal, passLen: fillState.passLen }));
      await new Promise((r) => setTimeout(r, 600));
      await page.evaluate(() => {
        const vis = (el) => el.offsetParent !== null;
        const btn = [...document.querySelectorAll("button")].find((b) => b.innerText.trim() === "Sign in" && vis(b));
        if (btn) btn.click();
      });
      await page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => null);
      console.log("Submitted. Current URL:", page.url());
    } else if (page.url().includes("/feed")) {
      console.log("Already logged in from persistent session.");
    } else {
      console.log("No form, not feed — waiting for page state. URL:", page.url());
    }

    // Grace window: security challenge aaya toh founder screen pe manually complete karega
    for (let i = 0; i < 36; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const u = page.url();
      if (u.includes("/feed")) { console.log("LOGIN_SUCCESS_FEED_REACHED"); break; }
      if (i % 4 === 0) console.log(`[${i * 5}s] waiting… url=${u}`);
    }

    const finalUrl = page.url();
    console.log("FINAL_URL:", finalUrl);
    await page.screenshot({ path: path.resolve(__dirname, "../output/login_round2.png") });
    console.log(finalUrl.includes("/feed") ? "STATUS: LOGGED_IN_PERSISTENT_OK" : "STATUS: NEEDS_MANUAL — check open window");
  } catch (e) {
    console.error("ERR", e.message);
  } finally {
    await browser.close();
  }
}
run();
