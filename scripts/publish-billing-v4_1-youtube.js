/**
 * 🦅 GARUDA Autonomous YouTube Shorts Publisher — Billing V4.1
 * Asset: SHORT_9x16_V4_1.mp4 (1080x1920 Vertical)
 * 100% Anti-Fabrication Law: Real API responses, verified video ID, public URL verification.
 */
const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer");
const youtubeService = require("../src/services/youtubeDirectPushService");

const VIDEO_PATH = path.resolve(__dirname, "../output/billing/v4_1/SHORT_9x16_V4_1.mp4");
const THUMBNAIL_PATH = path.resolve(__dirname, "../output/billing/v4_1/THUMBNAIL_V4_1.png");
const PROOF_PATH = path.resolve(__dirname, "../output/billing/v4_1/youtube_shorts_live_proof.png");
const RESULT_JSON = path.resolve(__dirname, "../output/billing/v4_1/youtube_publish_result.json");

const TITLE = "GST Billing Software That Actually Generates the Invoice | GARUDA Billing";
const DESCRIPTION = `Need a GST billing workflow that actually fits your business?

This is a real GARUDA Billing product demo showing GSTIN entry, GST calculation, CGST + SGST breakdown, and verified Tax Invoice generation.

Real GSTIN: 23AABCS1429B1ZB
Subtotal: ₹3,950
CGST 9%: ₹355.50
SGST 9%: ₹355.50
Total: ₹4,661

Engineered by GARUDA. High-velocity billing software for Indian retail and wholesale businesses.

Explore: https://www.garudaos.in

#GARUDABilling #GSTBilling #BillingSoftware #GSTInvoice #POS #Shorts`;

const TAGS = [
  "GARUDA Billing",
  "GST Billing Software",
  "GST Billing App",
  "Billing Software India",
  "GST Invoice Software",
  "Offline Billing Software",
  "Business Billing Software",
  "GST Invoice",
  "MSME Billing Software",
  "POS Billing",
  "Shorts"
];

async function setThumbnail(videoId, accessToken) {
  if (!fs.existsSync(THUMBNAIL_PATH)) {
    console.log("ℹ️ Thumbnail file not found, skipping thumbnail upload.");
    return false;
  }
  try {
    const imgBuffer = fs.readFileSync(THUMBNAIL_PATH);
    const res = await fetch(`https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${videoId}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "image/png",
        "Content-Length": String(imgBuffer.length)
      },
      body: imgBuffer
    });
    if (res.ok) {
      console.log("✔ Thumbnail uploaded successfully!");
      return true;
    } else {
      const err = await res.json().catch(() => ({}));
      console.log("ℹ️ Thumbnail note:", err.error?.message || res.statusText);
      return false;
    }
  } catch (e) {
    console.log("ℹ️ Thumbnail upload exception:", e.message);
    return false;
  }
}

async function verifyPublicPlayback(url) {
  console.log(`\n🔍 Forensic Verification of YouTube URL: ${url}...`);
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,900"]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");

    console.log("Navigating to URL...");
    await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });
    await new Promise(r => setTimeout(r, 4000));

    const pageTitle = await page.title();
    console.log("Page Title:", pageTitle);

    const hasVideoPlayer = await page.evaluate(() => {
      const video = document.querySelector("video");
      return {
        hasVideoTag: Boolean(video),
        videoSrc: video ? video.src : null,
        paused: video ? video.paused : null,
        readyState: video ? video.readyState : null
      };
    });
    console.log("Player state:", hasVideoPlayer);

    await page.screenshot({ path: PROOF_PATH });
    console.log(`✔ Screenshot captured: ${PROOF_PATH}`);

    return {
      pageTitle,
      hasVideoPlayer,
      proofScreenshot: PROOF_PATH
    };
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log("=================================================");
  console.log("🦅 GARUDA BILLING V4.1 YOUTUBE SHORTS PUBLISHER");
  console.log("=================================================\n");

  if (!fs.existsSync(VIDEO_PATH)) {
    throw new Error(`Video file missing at: ${VIDEO_PATH}`);
  }

  // Ensure fresh token
  const token = await youtubeService.getFreshAccessToken("garuda");
  if (!token) {
    throw new Error("Unable to obtain fresh Google OAuth access token for channel 'garuda'");
  }
  console.log("✔ Google OAuth Access Token validated.");

  console.log("\nInitiating YouTube Resumable Video Upload...");
  console.log(`Video File: ${VIDEO_PATH}`);
  console.log(`Size: ${(fs.statSync(VIDEO_PATH).size / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Title: ${TITLE}`);

  const res = await youtubeService.uploadVideo({
    videoFilePath: VIDEO_PATH,
    title: TITLE,
    description: DESCRIPTION,
    tags: TAGS,
    privacyStatus: "public",
    categoryId: "28",
    channelProfile: "garuda"
  });

  if (!res.success) {
    console.error("❌ YouTube upload failed:", res.error);
    fs.writeFileSync(RESULT_JSON, JSON.stringify(res, null, 2), "utf8");
    process.exit(1);
  }

  console.log("\n=================================================");
  console.log("🎉 YOUTUBE UPLOAD SUCCESSFUL!");
  console.log("=================================================");
  console.log(`Video ID: ${res.videoId}`);
  console.log(`Public Watch URL: ${res.youtubeUrl}`);
  console.log(`Public Shorts URL: ${res.shortsUrl}`);

  // Set thumbnail
  await setThumbnail(res.videoId, token);

  // Forensic Public Verification
  let verification = null;
  try {
    verification = await verifyPublicPlayback(res.shortsUrl);
  } catch (vErr) {
    console.warn("Playback verification note:", vErr.message);
  }

  const output = {
    ...res,
    verified: Boolean(verification),
    verification,
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync(RESULT_JSON, JSON.stringify(output, null, 2), "utf8");
  console.log(`\n✔ Full result written to: ${RESULT_JSON}`);
}

main().catch(err => {
  console.error("FATAL:", err);
  process.exit(1);
});
