const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function verifyFacebookSession() {
  const cUser = process.env.FB_C_USER;
  const xs = process.env.FB_XS;
  const actId = process.env.FB_AD_ACCOUNT_ID || "1545001583978113";

  if (!cUser || !xs) {
    throw new Error("FB_C_USER or FB_XS missing in .env");
  }

  console.log(`🦅 [GARUDA META RADAR] Verifying session for User ID: ${cUser} on Ad Account: ${actId}...`);

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--window-size=1440,900"
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");

    const cookies = [
      {
        name: "c_user",
        value: cUser.trim(),
        domain: ".facebook.com",
        path: "/",
        httpOnly: false,
        secure: true
      },
      {
        name: "xs",
        value: xs.trim(),
        domain: ".facebook.com",
        path: "/",
        httpOnly: true,
        secure: true
      }
    ];

    await page.setCookie(...cookies);

    const targetUrl = `https://adsmanager.facebook.com/adsmanager/audiences?act=${actId}`;
    console.log(`▶ Navigating to Meta Ads Manager Audiences: ${targetUrl}`);

    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    console.log("▶ Page loaded DOM. Waiting for Meta Ads client hydration (8s)...");
    await new Promise((r) => setTimeout(r, 8000));

    const finalUrl = page.url();
    const title = await page.title();
    console.log(`▶ Current URL: ${finalUrl}`);
    console.log(`▶ Current Page Title: ${title}`);

    const proofPath = path.join(OUTPUT_DIR, "meta_ads_auth_proof.png");
    await page.screenshot({ path: proofPath, fullPage: false });
    console.log(`✅ Screenshot captured: ${proofPath}`);

    // Check if redirected to login
    if (finalUrl.includes("login") || finalUrl.includes("checkpoint")) {
      console.log("⚠️ Meta requested checkpoint or redirected to login.");
      return { success: false, url: finalUrl, title };
    }

    console.log("🔥 [SUCCESS] Authenticated into Meta Ads Manager!");
    return { success: true, url: finalUrl, title };
  } catch (err) {
    console.error("❌ Error during Meta session verification:", err.message);
    throw err;
  } finally {
    await browser.close();
  }
}

verifyFacebookSession().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
