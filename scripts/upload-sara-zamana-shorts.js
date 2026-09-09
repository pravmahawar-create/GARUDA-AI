/**
 * 🦅 GARUDA Autonomous Uploader: Sara Zamana Live Performance Shorts
 * Uploads 3 high-energy 9:16 vertical shorts to YouTube via official YouTube Data API v3
 */

const fs = require("fs");
const path = require("path");
const youtubeService = require("../src/services/youtubeDirectPushService");

async function uploadSaraZamanaShorts() {
  console.log("===============================================================");
  console.log("🦅 UPLOADING SARA ZAMANA VIRAL SHORTS (PERSONAL PERFORMANCE)");
  console.log("===============================================================\n");

  // STRICT BRAND SEPARATION GUARD (Permanent Rule 2)
  const tokens = youtubeService.getStoredTokens();
  const channelTitle = (tokens.channelTitle || "").toLowerCase();
  if (channelTitle.includes("garuda") && !process.env.ALLOW_PERSONAL_ON_GARUDA) {
    console.error("🛑 BRAND SEPARATION PROTECTION TRIGGERED!");
    console.error(`Target channel is: "${tokens.channelTitle || "GARUDA Official"}"`);
    console.error("Personal performance videos (Sara Zamana) cannot be published to the official GARUDA corporate channel.");
    console.error("Please authorize Founder Praveen Mahawar's personal channel in 'data/youtube-tokens.json' before running this dispatch.\n");
    return;
  }

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
      console.log(`Clickable Shorts Link: [Watch Short](${res.shortsUrl}) -> ${res.shortsUrl}\n`);
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
  console.log("🎉 Sara Zamana Shorts Processing Completed!");
}

uploadSaraZamanaShorts().catch(console.error);
