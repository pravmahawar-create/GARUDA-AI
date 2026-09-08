/**
 * 🦅 GARUDA Autonomous YouTube Video Uploader
 * Reads rendered shorts from output/shorts/ and uploads directly to YouTube channel
 * via official YouTube Data API v3 (Resumable Upload).
 * 
 * 100% Anti-Fabrication Law: Real API responses, verified video IDs.
 */

const fs = require("fs");
const path = require("path");
const youtubeService = require("../src/services/youtubeDirectPushService");

async function runAutonomousUpload() {
  console.log("===============================================================");
  console.log("🦅 GARUDA AUTONOMOUS YOUTUBE UPLOADER ENGINE");
  console.log("===============================================================\n");

  const status = youtubeService.getStatus();
  console.log(`Connected: ${status.connected}`);
  console.log(`Channel: ${status.channelTitle}`);

  if (!status.connected) {
    const auth = youtubeService.getAuthUrl();
    console.log("\n⚠️ YOUTUBE CHANNEL NOT CONNECTED VIA OAUTH YET!");
    console.log("Please open this 1-click Google Authorization URL in your browser:");
    console.log("\n" + auth.authUrl + "\n");
    console.log("After granting permission, Google will redirect to GARUDA and activate autonomous push.");
    return;
  }

  const manifestPath = path.resolve(__dirname, "../output/shorts/youtube_shorts_manifest.json");
  if (!fs.existsSync(manifestPath)) {
    console.error("❌ Manifest not found at: " + manifestPath);
    return;
  }

  const items = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  console.log(`Found ${items.length} items in manifest.\n`);

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    // Look for clean_audio version first
    const cleanFileName = item.fileName.replace(".mp4", "_clean_audio.mp4");
    let targetFilePath = path.resolve(__dirname, "../output/shorts", cleanFileName);
    if (!fs.existsSync(targetFilePath)) {
      targetFilePath = path.resolve(__dirname, "../output/shorts", item.fileName);
    }

    console.log(`[${i + 1}/${items.length}] Uploading: ${path.basename(targetFilePath)}`);
    console.log(`Title: ${item.title}`);

    const res = await youtubeService.uploadVideo({
      videoFilePath: targetFilePath,
      title: item.title,
      description: item.description,
      tags: item.tags || [],
      privacyStatus: "public",
      categoryId: "28"
    });

    if (res.success) {
      console.log(`✔ SUCCESS: Uploaded to YouTube!`);
      console.log(`Video ID: ${res.videoId}`);
      console.log(`Shorts URL: ${res.shortsUrl}\n`);
      item.status = "published";
      item.videoId = res.videoId;
      item.youtubeUrl = res.youtubeUrl;
      item.shortsUrl = res.shortsUrl;
      item.uploadedAt = new Date().toISOString();
    } else {
      console.error(`❌ Upload failed: ${res.error}\n`);
    }
  }

  fs.writeFileSync(manifestPath, JSON.stringify(items, null, 2), "utf8");
  console.log("🎉 Autonomous YouTube Upload Run Completed!");
}

runAutonomousUpload().catch(console.error);
