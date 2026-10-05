/**
 * 🦅 GARUDA Autonomous Instagram Reel Publisher — Billing V4.1
 * Asset: SHORT_9x16_V4_1.mp4
 */
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const VIDEO_PATH = path.resolve(__dirname, "../output/billing/v4_1/SHORT_9x16_V4_1.mp4");
const OUTPUT_DIR = path.resolve(__dirname, "../output/billing/v4_1");

const CAPTION = `Billing app toh bahut hain… but does yours actually complete the GST workflow? 👀

GARUDA Billing ka real product workflow dekhiye:

GSTIN → GST calculation → CGST + SGST → Generate → TAX INVOICE.

Final invoice:
₹4,661

This isn't a concept screen.
It's a real product workflow demonstration.

Want software engineered around your business workflow?
DM GARUDA.
or:
garudaos.in/chat

#GARUDA #GARUDABilling #GSTBilling #GSTInvoice #BillingSoftware #BillingSoftwareIndia #BusinessAutomation #MSMEIndia #RetailBusiness #WholesaleBusiness #POSSoftware #IndianBusiness`;

async function publishInstagramReel() {
  console.log("🦅 [Instagram Publisher] Launching Instagram Reel Publication...");
  const sessionId = process.env.INSTAGRAM_SESSION_ID;
  const userId = process.env.INSTAGRAM_USER_ID;

  if (!sessionId || !userId) {
    throw new Error("Missing INSTAGRAM_SESSION_ID or INSTAGRAM_USER_ID in .env");
  }

  if (!fs.existsSync(VIDEO_PATH)) {
    throw new Error(`Video file not found: ${VIDEO_PATH}`);
  }

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,950"]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 950 });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");

    await page.setCookie(
      { name: "sessionid", value: sessionId, domain: ".instagram.com", path: "/" },
      { name: "ds_user_id", value: userId, domain: ".instagram.com", path: "/" }
    );

    console.log("▶ [1/6] Navigating to Instagram Home...");
    await page.goto("https://www.instagram.com/", { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise(r => setTimeout(r, 5000));

    // Dismiss notifications prompt if present
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      for (const b of btns) {
        const txt = (b.innerText || "").toLowerCase();
        if (txt.includes("not now") || txt.includes("cancel")) {
          b.click();
          break;
        }
      }
    });
    await new Promise(r => setTimeout(r, 2000));

    // Click Create button
    console.log("▶ [2/6] Clicking 'Create' (+) button...");
    const clickedCreate = await page.evaluate(() => {
      const svgs = Array.from(document.querySelectorAll("svg"));
      const createSvg = svgs.find(s => {
        const aria = (s.getAttribute("aria-label") || "").toLowerCase();
        return aria === "new post" || aria === "create";
      });
      if (createSvg) {
        const parent = createSvg.closest("a, button, div[role='button']");
        if (parent) {
          parent.click();
          return "Found via SVG aria-label";
        }
      }
      const allEls = Array.from(document.querySelectorAll("a, button, div[role='button']"));
      const el = allEls.find(e => (e.innerText || "").trim().toLowerCase() === "create");
      if (el) {
        el.click();
        return "Found via text Create";
      }
      return null;
    });

    console.log("Create button click result:", clickedCreate);
    if (!clickedCreate) {
      console.log("Fallback: Clicking coordinates (28, 586)...");
      await page.mouse.click(28, 586);
    }
    await new Promise(r => setTimeout(r, 2500));

    // Click 'Post' item inside the Create submenu
    console.log("▶ Clicking 'Post' item in Create submenu...");
    const clickedPostOption = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll("div[role='button'], button, a, span"));
      const postItem = items.find(el => {
        const txt = (el.innerText || "").trim().toLowerCase();
        return txt === "post";
      });
      if (postItem) {
        postItem.click();
        return true;
      }
      return false;
    });
    console.log("Clicked Post option result:", clickedPostOption);
    await new Promise(r => setTimeout(r, 3500));

    // Upload video
    console.log("▶ [3/6] Locating file input and uploading SHORT_9x16_V4_1.mp4...");
    let fileInput = await page.$("input[type='file']");
    if (!fileInput) {
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const btn = btns.find(b => (b.innerText || "").toLowerCase().includes("select from computer"));
        if (btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 2000));
      fileInput = await page.$("input[type='file']");
    }

    if (!fileInput) {
      await page.screenshot({ path: path.join(OUTPUT_DIR, "insta_file_input_missing.png") });
      throw new Error("Could not find file input in Instagram modal");
    }

    await fileInput.uploadFile(VIDEO_PATH);
    console.log("Uploaded file. Waiting 8s for video preprocessing & reel prompt...");
    await new Promise(r => setTimeout(r, 8000));

    // If "Video posts are now shared as reels" dialog pops up, dismiss with OK
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button, div[role='button']"));
      for (const b of btns) {
        const txt = (b.innerText || "").trim().toLowerCase();
        if (txt === "ok" || txt.includes("got it")) {
          b.click();
          break;
        }
      }
    });
    await new Promise(r => setTimeout(r, 2000));

    // Function to click Next button
    const clickNext = async () => {
      return await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button, div[role='button']"));
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

    // Step 4: Crop -> Next
    console.log("▶ [4/6] Navigating through crop/cover steps...");
    let next1 = await clickNext();
    console.log("Clicked Next (Crop step):", next1);
    await new Promise(r => setTimeout(r, 3000));

    // Step Cover/Trim -> Next
    let next2 = await clickNext();
    console.log("Clicked Next (Cover/Trim step):", next2);
    await new Promise(r => setTimeout(r, 3000));

    // Caption Step
    console.log("▶ [5/6] Injecting Caption...");
    const injected = await page.evaluate((text) => {
      const editor = document.querySelector("div[aria-label*='Write a caption'], div[role='textbox'], textarea");
      if (editor) {
        editor.focus();
        document.execCommand("insertText", false, text);
        return true;
      }
      return false;
    }, CAPTION);
    console.log("Caption injected:", injected);
    await new Promise(r => setTimeout(r, 3000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, "insta_reel_preview_before_share.png") });
    console.log("Saved preview before share: insta_reel_preview_before_share.png");

    // Click Share
    console.log("▶ [6/6] Clicking 'Share' button...");
    const shareClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button, div[role='button']"));
      const shareBtn = btns.find(b => {
        const txt = (b.innerText || "").trim().toLowerCase();
        return txt === "share";
      });
      if (shareBtn) {
        shareBtn.click();
        return true;
      }
      return false;
    });

    if (!shareClicked) {
      throw new Error("Could not find or click 'Share' button!");
    }

    console.log("Clicked Share! Waiting up to 45s for Instagram video transcode & upload...");
    let sharedConfirmed = false;
    for (let i = 0; i < 9; i++) {
      await new Promise(r => setTimeout(r, 5000));
      const statusText = await page.evaluate(() => {
        return document.body.innerText || "";
      });
      if (statusText.includes("Your reel has been shared") || statusText.includes("Your post has been shared")) {
        sharedConfirmed = true;
        console.log(`✔ Confirmation received at ${(i + 1) * 5}s: Reel successfully shared!`);
        break;
      }
    }

    await page.screenshot({ path: path.join(OUTPUT_DIR, "insta_reel_share_result.png") });
    console.log("Saved confirmation screenshot: insta_reel_share_result.png");

    return {
      success: true,
      platform: "Instagram",
      sharedConfirmed,
      channelUrl: "https://www.instagram.com/garudaos.ai/",
      timestamp: new Date().toISOString()
    };
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  publishInstagramReel()
    .then(res => console.log("Result:", JSON.stringify(res, null, 2)))
    .catch(err => {
      console.error("Instagram publish failed:", err);
      process.exit(1);
    });
}

module.exports = { publishInstagramReel };
