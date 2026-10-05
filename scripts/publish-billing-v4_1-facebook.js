/**
 * 🦅 GARUDA Autonomous Facebook Reel Publisher — Billing V4.1
 * Asset: SHORT_9x16_V4_1.mp4
 */
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const VIDEO_PATH = path.resolve(__dirname, "../output/billing/v4_1/SHORT_9x16_V4_1.mp4");
const OUTPUT_DIR = path.resolve(__dirname, "../output/billing/v4_1");

const CAPTION = `GST billing sirf invoice print karne ka naam nahi hai.

GARUDA Billing mein dekhiye complete workflow:

GSTIN entry
→ Product
→ GST calculation
→ CGST + SGST
→ Bill generation
→ TAX INVOICE

Final invoice:
₹4,661

GARUDA ka focus hai software ko actual business workflow ke around engineer karna.

Agar aapke business ke liye custom billing / automation software chahiye:
garudaos.in/chat

#GARUDA #GSTBilling #BillingSoftware #GSTInvoice #MSMEIndia #BusinessAutomation #RetailBusiness #WholesaleBusiness`;

async function publishFacebookReel() {
  console.log("🦅 [Facebook Publisher] Launching Facebook Reel Publication...");
  const cUser = process.env.FB_C_USER;
  const xs = process.env.FB_XS;

  if (!cUser || !xs) {
    throw new Error("Missing FB_C_USER or FB_XS in .env");
  }

  if (!fs.existsSync(VIDEO_PATH)) {
    throw new Error(`Video file not found: ${VIDEO_PATH}`);
  }

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");

    await page.setCookie(
      { name: "c_user", value: cUser.trim(), domain: ".facebook.com", path: "/", secure: true },
      { name: "xs", value: xs.trim(), domain: ".facebook.com", path: "/", httpOnly: true, secure: true }
    );

    console.log("▶ [1/5] Navigating to Facebook Reels Create...");
    await page.goto("https://www.facebook.com/reels/create", { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise(r => setTimeout(r, 6000));

    // Upload video
    console.log("▶ [2/5] Locating file input and uploading SHORT_9x16_V4_1.mp4...");
    let fileInput = await page.$("input[type='file']");
    if (!fileInput) {
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("div[role='button'], button, span"));
        const btn = btns.find(b => (b.innerText || "").toLowerCase().includes("upload") || (b.innerText || "").toLowerCase().includes("add video"));
        if (btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 2000));
      fileInput = await page.$("input[type='file']");
    }

    if (!fileInput) {
      await page.screenshot({ path: path.join(OUTPUT_DIR, "fb_file_input_missing.png") });
      throw new Error("Could not find file input on Facebook reels create page");
    }

    await fileInput.uploadFile(VIDEO_PATH);
    console.log("Uploaded video. Waiting 12s for Facebook video processing & next button...");
    await new Promise(r => setTimeout(r, 12000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, "fb_reel_uploaded_step.png") });
    console.log("Saved screenshot: fb_reel_uploaded_step.png");

    // Click "Next"
    console.log("▶ [3/5] Clicking Next through video trim/audio steps...");
    const clickNext = async () => {
      return await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("div[role='button'], button"));
        const nextBtn = btns.find(b => {
          const txt = (b.innerText || "").trim().toLowerCase();
          return txt === "next";
        });
        if (nextBtn) {
          nextBtn.click();
          return true;
        }
        return false;
      });
    };

    let next1 = await clickNext();
    console.log("Clicked Next (1):", next1);
    await new Promise(r => setTimeout(r, 4000));

    let next2 = await clickNext();
    console.log("Clicked Next (2):", next2);
    await new Promise(r => setTimeout(r, 4000));

    // Caption Step: Describe your reel...
    console.log("▶ [4/5] Injecting Caption into Facebook Reel...");
    await page.screenshot({ path: path.join(OUTPUT_DIR, "fb_reel_caption_step.png") });

    const captionInjected = await page.evaluate((text) => {
      const editor = document.querySelector("div[role='textbox'], div[aria-label*='Describe your reel'], textarea");
      if (editor) {
        editor.focus();
        document.execCommand("insertText", false, text);
        return true;
      }
      return false;
    }, CAPTION);
    console.log("Caption injected:", captionInjected);
    await new Promise(r => setTimeout(r, 3000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, "fb_reel_ready_preview.png") });
    console.log("Saved preview: fb_reel_ready_preview.png");

    // Click "Publish" button
    console.log("▶ [5/5] Clicking 'Publish' button...");
    const published = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("div[role='button'], button"));
      const pubBtn = btns.find(b => {
        const txt = (b.innerText || "").trim().toLowerCase();
        return txt === "publish" || txt === "post";
      });
      if (pubBtn) {
        pubBtn.click();
        return true;
      }
      return false;
    });

    console.log("Clicked Publish result:", published);
    if (!published) {
      throw new Error("Could not find 'Publish' button on Facebook Reel page");
    }

    console.log("Waiting 30s for Facebook upload and reel publication...");
    await new Promise(r => setTimeout(r, 30000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, "fb_reel_published_proof.png") });
    console.log("Saved final screenshot: fb_reel_published_proof.png");

    const finalUrl = page.url();
    console.log("Final URL:", finalUrl);

    return {
      success: true,
      platform: "Facebook",
      finalUrl,
      profileUrl: "https://www.facebook.com/pyaari.pyaara.7/",
      timestamp: new Date().toISOString()
    };
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  publishFacebookReel()
    .then(res => console.log("Result:", JSON.stringify(res, null, 2)))
    .catch(err => {
      console.error("Facebook publish failed:", err);
      process.exit(1);
    });
}

module.exports = { publishFacebookReel };
