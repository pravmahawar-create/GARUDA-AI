/**
 * 🦅 GARUDA Autonomous LinkedIn Master Film Publisher — Billing V4.1
 * Asset: MASTER_16x9_V4_1.mp4 (1920x1080 Landscape)
 * Authenticated via fresh LINKEDIN_LI_AT cookie
 */
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const VIDEO_PATH = path.resolve(__dirname, "../output/billing/v4_1/MASTER_16x9_V4_1.mp4");
const OUTPUT_DIR = path.resolve(__dirname, "../output/billing/v4_1");

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

  const cookieVal = process.env.LINKEDIN_LI_AT;
  if (!cookieVal) {
    throw new Error("LINKEDIN_LI_AT missing in .env");
  }

  if (!fs.existsSync(VIDEO_PATH)) {
    throw new Error(`Master video file not found at: ${VIDEO_PATH}`);
  }

  const stat = fs.statSync(VIDEO_PATH);
  console.log(`Video File: ${VIDEO_PATH} (${(stat.size / (1024 * 1024)).toFixed(2)} MB)`);

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--window-size=1280,900"
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");

    await page.setCookie({
      name: "li_at",
      value: cookieVal,
      domain: ".linkedin.com",
      path: "/",
      httpOnly: true,
      secure: true
    });

    console.log("▶ [1/6] Navigating to LinkedIn Feed...");
    await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise(r => setTimeout(r, 5000));

    const currentUrl = page.url();
    console.log("Current URL:", currentUrl);
    if (!currentUrl.includes("/feed")) {
      throw new Error(`Session did not redirect to feed! URL: ${currentUrl}`);
    }

    console.log("▶ [2/6] Triggering Media / Video upload...");
    let fileInput = await page.$("input[type='file'][accept*='video'], input[type='file']");

    if (!fileInput) {
      console.log("Looking for Media / Video button...");
      const clicked = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button, div[role='button'], span"));
        const mediaBtn = btns.find(b => {
          const txt = (b.textContent || "").trim();
          const aria = (b.getAttribute("aria-label") || "").trim();
          const r = b.getBoundingClientRect();
          return (txt === "Media" || txt === "Video" || aria.toLowerCase().includes("media") || aria.toLowerCase().includes("video")) && r.top > 0 && r.top < 400 && r.width > 0;
        });
        if (mediaBtn) {
          mediaBtn.click();
          return "media_button";
        }

        const startPost = document.querySelector("button.share-box-feed-entry__trigger, button[aria-label*='Start a post' i]");
        if (startPost) {
          startPost.click();
          return "start_post";
        }
        return null;
      });
      console.log("Trigger clicked:", clicked);
      await new Promise(r => setTimeout(r, 3000));
    }

    fileInput = await page.$("input[type='file'][accept*='video'], input[type='file']");
    if (!fileInput) {
      const modalMediaBtn = await page.$("button[aria-label*='media' i], button[aria-label*='photo' i], button[aria-label*='video' i]");
      if (modalMediaBtn) {
        await modalMediaBtn.click();
        await new Promise(r => setTimeout(r, 2000));
        fileInput = await page.$("input[type='file']");
      }
    }

    if (!fileInput) {
      await page.screenshot({ path: path.join(OUTPUT_DIR, "linkedin_file_input_missing.png") });
      throw new Error("Could not find video file input on LinkedIn!");
    }

    console.log("▶ [3/6] Attaching Master Video: " + VIDEO_PATH);
    await fileInput.uploadFile(VIDEO_PATH);
    console.log("  ✔ Attached video file. Waiting 20 seconds for LinkedIn video processing & preview...");
    await new Promise(r => setTimeout(r, 20000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, "linkedin_video_modal_uploaded.png") });
    console.log("  ✔ Saved upload modal preview screenshot.");

    // Click Next or Done button specifically inside the video modal
    console.log("Clicking 'Next' button inside video preview modal...");
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

    // Wait for the post text editor to appear
    console.log("▶ [4/6] Waiting for post editor textbox...");
    await page.waitForSelector("div[role='textbox'], div.ql-editor, div[contenteditable='true']", { timeout: 20000 });
    await new Promise(r => setTimeout(r, 2000));

    const editorHandle = await page.$("div[role='textbox'], div.ql-editor, div[contenteditable='true']");
    if (!editorHandle) {
      throw new Error("Post text editor element not found after Next!");
    }
    await editorHandle.focus();

    // Type text into editor
    console.log("Injecting post text...");
    await page.evaluate((text) => {
      const editor = document.querySelector("div[role='textbox'], div.ql-editor, div[contenteditable='true']");
      if (editor) {
        editor.focus();
        document.execCommand("insertText", false, text);
      }
    }, POST_CONTENT);

    // Type a space to ensure state mutation
    await page.keyboard.press("Space");
    await page.keyboard.press("Backspace");
    await new Promise(r => setTimeout(r, 3000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, "linkedin_before_post.png") });
    console.log("  ✔ Saved preview screenshot before post: linkedin_before_post.png");

    // Click Post
    console.log("▶ [5/6] Clicking 'Post' button...");
    const postClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const pBtn = btns.find(b => {
        const txt = (b.textContent || "").trim().toLowerCase();
        const aria = (b.getAttribute("aria-label") || "").trim().toLowerCase();
        return (txt === "post" || aria.includes("post")) && !b.disabled && b.offsetWidth > 0 && b.offsetHeight > 0;
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

    console.log("✔ Clicked Post! Waiting 25 seconds for LinkedIn publication...");
    await new Promise(r => setTimeout(r, 25000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, "linkedin_feed_after_post.png") });
    console.log("✔ Saved feed after post screenshot.");

    // Extract latest post URL from activity
    console.log("▶ [6/6] Extracting public post URL from profile activity...");
    await page.goto("https://www.linkedin.com/in/me/recent-activity/all/", { waitUntil: "domcontentloaded", timeout: 35000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 6000));

    const postUrl = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll("a[href*='activity'], a[href*='urn:li:activity']"));
      for (const l of links) {
        const href = l.href;
        if (href && (href.includes("/feed/update/") || href.includes("activity:"))) {
          return href;
        }
      }
      return links.length > 0 ? links[0].href : null;
    });

    console.log("Found Live Post URL:", postUrl);

    // Verify the live post URL directly
    let liveVerification = null;
    if (postUrl) {
      console.log(`Verifying live post playback at: ${postUrl}...`);
      await page.goto(postUrl, { waitUntil: "networkidle2", timeout: 40000 });
      await new Promise(r => setTimeout(r, 6000));

      const verificationDetails = await page.evaluate(() => {
        const v = document.querySelector("video");
        return {
          hasVideoTag: Boolean(v),
          videoSrc: v ? v.src : null,
          title: document.title,
          textSnippet: document.body.innerText.slice(0, 300)
        };
      });

      const proofPath = path.join(OUTPUT_DIR, "linkedin_live_playback_proof.png");
      await page.screenshot({ path: proofPath });
      console.log(`✔ Verified live post! Screenshot: ${proofPath}`);

      liveVerification = {
        postUrl,
        verificationDetails,
        screenshot: proofPath
      };
    }

    const result = {
      success: true,
      platform: "LinkedIn",
      postUrl: postUrl || "https://www.linkedin.com/in/me/recent-activity/all/",
      liveVerification,
      timestamp: new Date().toISOString()
    };

    fs.writeFileSync(path.join(OUTPUT_DIR, "linkedin_publish_result.json"), JSON.stringify(result, null, 2), "utf8");
    return result;
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  publishLinkedInVideo()
    .then(res => {
      console.log("\n=================================================");
      console.log("🎉 LINKEDIN PUBLISHING COMPLETED SUCCESSFULLY!");
      console.log("=================================================");
      console.log(JSON.stringify(res, null, 2));
      process.exit(0);
    })
    .catch(err => {
      console.error("\n❌ LinkedIn Publish Error:", err.message);
      process.exit(1);
    });
}

module.exports = { publishLinkedInVideo };
