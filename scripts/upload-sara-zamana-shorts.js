/**
 * 🦅 GARUDA Autonomous Uploader: Sara Zamana Live Performance Shorts
 * Uploads 3 high-energy 9:16 vertical shorts to YouTube via official YouTube Data API v3
 */

const fs = require("fs");
const path = require("path");
const youtubeService = require("../src/services/youtubeDirectPushService");

async function uploadSaraZamanaShorts() {
  console.log("===============================================================");
  console.log("🦅 UPLOADING SARA ZAMANA VIRAL SHORTS TO YOUTUBE");
  console.log("===============================================================\n");

  const metadataPath = path.resolve(__dirname, "../output/shorts/shorts_metadata.json");
  if (!fs.existsSync(metadataPath)) {
    console.error("❌ Metadata not found at: " + metadataPath);
    return;
  }

  const items = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
  console.log(`Found ${items.length} Sara Zamana shorts.\n`);

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const targetFilePath = path.resolve(__dirname, "../output/shorts", item.fileName);
    if (!fs.existsSync(targetFilePath)) {
      console.error(`❌ File not found: ${targetFilePath}`);
      continue;
    }

    console.log(`[${i + 1}/${items.length}] Uploading: ${item.fileName} (${(fs.statSync(targetFilePath).size / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`Title: ${item.title}`);

    const res = await youtubeService.uploadVideo({
      videoFilePath: targetFilePath,
      title: item.title,
      description: item.description,
      tags: item.tags || [],
      privacyStatus: "public",
      categoryId: "10" // Music
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
      console.error(`❌ Upload failed for ${item.fileName}: ${res.error}\n`);
    }
  }

  fs.writeFileSync(metadataPath, JSON.stringify(items, null, 2), "utf8");
  console.log("🎉 Sara Zamana Shorts Upload Completed!");
}

uploadSaraZamanaShorts().catch(console.error);
