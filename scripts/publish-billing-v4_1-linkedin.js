/**
 * 🦅 GARUDA Autonomous LinkedIn Master Film Publisher — Billing V4.1
 * Asset: MASTER_16x9_V4_1.mp4 (1920x1080 Landscape)
 * Flow: Visible Browser Session -> Founder Login / 2FA -> Autonomous Video Post
 */
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const VIDEO_PATH = path.resolve(__dirname, "../output/billing/v4_1/MASTER_16x9_V4_1.mp4");
const OUTPUT_DIR = path.resolve(__dirname, "../output/billing/v4_1");
const SESSION_DIR = path.resolve(__dirname, "../data/browser-sessions/linkedin");

const POST_CONTENT = `Most billing software demos stop at the UI.
We wanted to show the complete workflow.

GARUDA Billing V4.1 demonstrates:
GSTIN → GST calculation → CGST + SGST → Invoice generation → Final TAX INVOICE.

The demonstrated transaction:
Subtotal: ₹3,950
CGST 9%: ₹355.50
SGST 9%: ₹355.50
Grand Total: ₹4,661

The larger product philosophy is simple:
Software should be engineered around the business workflow.

GARUDA is building toward that principle across billing, automation and business software.

Product:
https://www.garudaos.in/chat

#GARUDA #ProductEngineering #BusinessAutomation #GSTSoftware #BillingSoftware #SaaSIndia #MSME #SoftwareDevelopment #IndianStartups`;

async function publishLinkedInVideo() {
  console.log("===============================================================");
  console.log("🦅 GARUDA LINKEDIN MASTER FILM PUBLISHER — BILLING V4.1");
  console.log("===============================================================\n");

  if (!fs.existsSync(VIDEO_PATH)) {
    throw new Error(`Master video file not found at: ${VIDEO_PATH}`);
  }

  fs.mkdirSync(SESSION_DIR, { recursive: true });

  console.log("🚀 Launching interactive Chromium browser window...");
  console.log("Founder login / 2FA session will be maintained in:", SESSION_DIR);

  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: false, // Real visible Chrome window
    defaultViewport: null,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--start-maximized",
      `--user-data-dir=${SESSION_DIR}`
    ]
  });

  try {
    const pages = await browser.pages();
    const page = pages.length > 0 ? pages[0] : await browser.newPage();
    await page.bringToFront();

    // Bring browser to front in Windows OS
    try {
      const { exec } = require("child_process");
      exec('powershell -Command "$wshell = New-Object -ComObject wscript.shell; $wshell.AppActivate(\'LinkedIn\')"');
    } catch (e) {}

    console.log("▶ [1/6] Navigating to LinkedIn Feed (https://www.linkedin.com/feed/)...");
    await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise(r => setTimeout(r, 4000));

    let currentUrl = page.url();
    console.log("Current URL:", currentUrl);

    // If login is required
    if (currentUrl.includes("/login") || currentUrl.includes("/uas/") || currentUrl.includes("/checkpoint/") || currentUrl.includes("/authwall")) {
      console.log("\n=============================================================");
      console.log("⚠️ [ACTION REQUIRED] FOUNDER LOGIN / 2FA NEEDED IN BROWSER");
      console.log("=============================================================");
      console.log("Please complete your LinkedIn login or 2FA in the opened browser window.");
      console.log("Antigravity is autonomously monitoring. Once you reach the feed, publication will resume automatically!");
      console.log("Waiting up to 600 seconds (10 minutes)...");

      let authenticated = false;
      const startTime = Date.now();
      while (Date.now() - startTime < 600000) {
        await new Promise(r => setTimeout(r, 3000));
        currentUrl = page.url();
        if (currentUrl.includes("/feed") || (currentUrl.includes("/in/") && !currentUrl.includes("/login") && !currentUrl.includes("/checkpoint"))) {
          authenticated = true;
          console.log("\n✔ Authenticated LinkedIn feed detected:", currentUrl);
          break;
        }
      }

      if (!authenticated) {
        await page.screenshot({ path: path.join(OUTPUT_DIR, "linkedin_auth_timeout.png") });
        throw new Error("LinkedIn login timeout (600s elapsed without reaching /feed)");
      }
    } else {
      console.log("✔ Active LinkedIn session found:", currentUrl);
    }

    await new Promise(r => setTimeout(r, 4000));

    // Step 2: Open Media / Video or Post dialog
    console.log("▶ [2/6] Triggering Media / Video Post upload...");

    // Check if direct file input already exists
    let fileInput = await page.$("input[type='file'][accept*='video'], input[type='file']");

    if (!fileInput) {
      // Find Video / Media button or "Start a post" button
      const clickedTrigger = await page.evaluate(() => {
        // Try Video button
        const all = Array.from(document.querySelectorAll("button, div[role='button'], span"));
        const mediaBtn = all.find(e => {
          const t = (e.textContent || "").trim();
          const aria = (e.getAttribute("aria-label") || "").trim();
          const r = e.getBoundingClientRect();
          return (t === "Video" || t === "Media" || aria.toLowerCase().includes("video") || aria.toLowerCase().includes("media")) && r.top > 0 && r.top < 400 && r.width > 0;
        });
        if (mediaBtn) {
          mediaBtn.click();
          return "media_btn";
        }

        // Try "Start a post"
        const postTrigger = document.querySelector("button.share-box-feed-entry__trigger, button[aria-label*='Start a post' i]");
        if (postTrigger) {
          postTrigger.click();
          return "start_a_post";
        }
        return null;
      });

      console.log("Trigger clicked:", clickedTrigger);
      await new Promise(r => setTimeout(r, 3000));
    }

    // Now look for file input
    fileInput = await page.$("input[type='file'][accept*='video'], input[type='file']");
    if (!fileInput) {
      // Try inside open modal
      const mediaIconModal = await page.$("button[aria-label*='media' i], button[aria-label*='photo' i], button[aria-label*='video' i]");
      if (mediaIconModal) {
        await mediaIconModal.click();
        await new Promise(r => setTimeout(r, 2000));
        fileInput = await page.$("input[type='file']");
      }
    }

    if (!fileInput) {
      await page.screenshot({ path: path.join(OUTPUT_DIR, "linkedin_file_input_missing.png") });
      throw new Error("Could not find video file input element on LinkedIn feed/modal!");
    }

    // Step 3: Attach Video File
    console.log("▶ [3/6] Attaching Master Video: " + VIDEO_PATH);
    await fileInput.uploadFile(VIDEO_PATH);
    console.log("  ✔ Video file attached. Waiting 15 seconds for video processing & preview...");
    await new Promise(r => setTimeout(r, 15000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, "linkedin_video_modal_uploaded.png") });
    console.log("  ✔ Captured video modal upload state: linkedin_video_modal_uploaded.png");

    // Click Next or Done button in video preview modal if present
    const nextClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const nextBtn = btns.find(b => {
        const txt = (b.textContent || "").trim();
        return (txt === "Next" || txt === "Done") && !b.disabled;
      });
      if (nextBtn) {
        nextBtn.click();
        return true;
      }
      return false;
    });
    console.log("  ✔ Clicked Next in video preview modal:", nextClicked);
    await new Promise(r => setTimeout(r, 4000));

    // Step 4: Inject post text into editor
    console.log("▶ [4/6] Injecting post text...");
    const focused = await page.evaluate(() => {
      const editor = document.querySelector("div[contenteditable='true'], div.ql-editor, div[aria-placeholder*='thoughts'], div[data-placeholder*='thoughts'], div[role='textbox']");
      if (editor) {
        editor.focus();
        return true;
      }
      return false;
    });

    if (!focused) {
      console.log("Fallback: Clicking editor area (600, 300)...");
      await page.mouse.click(600, 300);
    }
    await new Promise(r => setTimeout(r, 1000));

    // Insert text
    await page.evaluate((text) => {
      const editor = document.querySelector("div[contenteditable='true'], div.ql-editor, div[role='textbox']");
      if (editor) {
        editor.focus();
        document.execCommand("insertText", false, text);
      }
    }, POST_CONTENT);
    console.log("  ✔ Post content inserted.");
    await new Promise(r => setTimeout(r, 3000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, "linkedin_video_preview_before_post.png") });
    console.log("  ✔ Saved preview screenshot before post: linkedin_video_preview_before_post.png");

    // Step 5: Click Post
    console.log("▶ [5/6] Clicking 'Post' button...");
    const postClicked = await page.evaluate(() => {
      const selectors = [
        "button.share-actions__primary-action",
        "button[data-view-name='share-component-post-button']",
        "button.artdeco-button--primary"
      ];
      for (const s of selectors) {
        const btn = document.querySelector(s);
        if (btn && !btn.disabled) {
          btn.click();
          return true;
        }
      }
      const btns = Array.from(document.querySelectorAll("button"));
      const pBtn = btns.find(b => {
        const txt = (b.textContent || "").trim().toLowerCase();
        return txt === "post" && !b.disabled;
      });
      if (pBtn) {
        pBtn.click();
        return true;
      }
      return false;
    });

    if (!postClicked) {
      throw new Error("Could not find enabled 'Post' button!");
    }

    console.log("✔ Clicked Post! Waiting 20 seconds for LinkedIn publication...");
    await new Promise(r => setTimeout(r, 20000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, "linkedin_video_feed_after_post.png") });
    console.log("✔ Captured post confirmation screenshot: linkedin_video_feed_after_post.png");

    // Extract latest post URL from profile activity
    await page.goto("https://www.linkedin.com/in/me/recent-activity/all/", { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 5000));

    const postUrl = await page.evaluate(() => {
      const urnLink = document.querySelector("div[data-urn*='activity'] a[href*='activity'], a[href*='urn:li:activity']");
      return urnLink ? urnLink.href : window.location.href;
    });
    console.log("Live Post URL:", postUrl);

    // Save result JSON
    const resultObj = {
      success: true,
      platform: "LinkedIn",
      postUrl,
      videoPath: VIDEO_PATH,
      timestamp: new Date().toISOString()
    };
    fs.writeFileSync(path.join(OUTPUT_DIR, "linkedin_publish_result.json"), JSON.stringify(resultObj, null, 2), "utf8");

    return resultObj;
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  publishLinkedInVideo()
    .then(res => {
      console.log("Result:", JSON.stringify(res, null, 2));
      process.exit(0);
    })
    .catch(err => {
      console.error("LinkedIn publish failed:", err.message);
      process.exit(1);
    });
}

module.exports = { publishLinkedInVideo };
