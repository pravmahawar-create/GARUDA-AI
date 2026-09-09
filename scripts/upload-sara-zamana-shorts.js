/**
 * 🦅 GARUDA Autonomous Uploader: Sara Zamana Live Performance Shorts
 * Exclusively publishes to Founder Praveen Mahawar's Personal Channel (@Praveen-Mahawar-111)
 * 
 * STRICT MANDATE (Permanent Founder Rule):
 * 1. ZERO GARUDA BRAND POLLUTION: Must strictly upload to Channel ID: UC68_XAkGvyU95T1VrTnrw0Q.
 * 2. SINGLE VIDEO PRIME-TIME CADENCE: Exactly 1 video per day (6:30 PM - 8:00 PM IST).
 *    Never blast all 3 videos at once to prevent YouTube algorithm cannibalization.
 */

const fs = require("fs");
const path = require("path");
const youtubeService = require("../src/services/youtubeDirectPushService");

const PRAVEEN_CHANNEL_ID = "UC68_XAkGvyU95T1VrTnrw0Q";
const PRAVEEN_HANDLE = "@Praveen-Mahawar-111";

async function uploadSaraZamanaShorts() {
  console.log("===============================================================");
  console.log("🦅 SARA ZAMANA VIRAL SHORTS ENGINE: FOUNDER PERSONAL CHANNEL");
  console.log(`Target: ${PRAVEEN_HANDLE} (Channel ID: ${PRAVEEN_CHANNEL_ID})`);
  console.log("===============================================================\n");

  // Step 1: Verify Praveen channel authorization status
  const status = youtubeService.getStatus("praveen");
  console.log(`Connection Status: ${status.connected ? "CONNECTED ✔" : "DISCONNECTED ⚠️"}`);
  console.log(`Authorized Profile: ${status.channelProfile}`);
  console.log(`Channel Title: ${status.channelTitle}`);
  console.log(`Channel ID: ${status.channelId || "Pending OAuth"}\n`);

  if (!status.connected) {
    const auth = youtubeService.getAuthUrl("https://www.garudaos.in/api/bot-verse/youtube/callback", "praveen");
    console.error("⚠️ PRAVEEN'S PERSONAL CHANNEL NOT CONNECTED VIA OAUTH YET!");
    console.error("To prevent accidental uploads to GARUDA corporate channel, please authorize");
    console.error(`Founder Praveen Mahawar's personal YouTube channel (${PRAVEEN_HANDLE}):`);
    console.error("\n" + auth.authUrl + "\n");
    console.error("Once authorized, run this script to dispatch the single prime-time short.\n");
    return;
  }

  // Step 2: Read metadata manifest
  const metadataPath = path.resolve(__dirname, "../output/shorts/shorts_metadata.json");
  if (!fs.existsSync(metadataPath)) {
    console.error("❌ Metadata manifest not found at: " + metadataPath);
    return;
  }

  const items = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
  console.log(`Total Shorts in Queue: ${items.length}`);

  // Step 3: Enforce Single Video Prime-Time Cadence
  // Find the FIRST video that has not yet been published to Praveen's channel
  const targetIndex = items.findIndex(item => item.personalStatus !== "published");

  if (targetIndex === -1) {
    console.log("🎉 All 3 Sara Zamana shorts have already been published to Founder Praveen's channel!");
    items.forEach((it, idx) => {
      console.log(`[#${idx + 1}] ID: ${it.personalVideoId || it.videoId} | Link: ${it.personalShortsUrl || it.shortsUrl}`);
    });
    return;
  }

  const item = items[targetIndex];
  const targetFilePath = path.resolve(__dirname, "../output/shorts", item.fileName);
  if (!fs.existsSync(targetFilePath)) {
    console.error(`❌ Video file not found: ${targetFilePath}`);
    return;
  }

  console.log(`\n🎯 SINGLE VIDEO CADENCE ACTIVE: Dispatching Video #${targetIndex + 1} of ${items.length}`);
  console.log(`File: ${item.fileName} (${(fs.statSync(targetFilePath).size / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`Title: ${item.title}`);
  console.log(`Song: ${item.songName}`);
  console.log(`Performer: ${item.performer}\n`);

  // Step 4: Execute upload strictly to Praveen's channel
  const res = await youtubeService.uploadVideo({
    videoFilePath: targetFilePath,
    title: item.title,
    description: item.description,
    tags: item.tags || [],
    privacyStatus: "public",
    categoryId: "10", // Music Category
    channelProfile: "praveen",
    expectedChannelId: PRAVEEN_CHANNEL_ID
  });

  if (res.success) {
    console.log(`\n✔ SUCCESS: Short #${targetIndex + 1} LIVE on Praveen's Channel (${PRAVEEN_HANDLE})!`);
    console.log(`Video ID: ${res.videoId}`);
    console.log(`Clickable Shorts Link: [Watch Short on Praveen's Channel](${res.shortsUrl}) -> ${res.shortsUrl}`);

    // Update manifest record
    item.personalStatus = "published";
    item.personalVideoId = res.videoId;
    item.personalYoutubeUrl = res.youtubeUrl;
    item.personalShortsUrl = res.shortsUrl;
    item.personalUploadedAt = new Date().toISOString();
    item.personalChannel = PRAVEEN_HANDLE;
    fs.writeFileSync(metadataPath, JSON.stringify(items, null, 2), "utf8");

    // Post engaging pinned prompt (without dead raw hyperlinks)
    try {
      console.log("\n💬 Injecting conversational engagement prompt on video...");
      await youtubeService.postComment({
        videoId: res.videoId,
        commentText: "Aapke ghar me Kishore Da ka sabse favorite gana kaunsa hai? Comment me batao! Aur agla live performance kaunse gaane ka dekhna chahte ho? 🎤✨",
        channelProfile: "praveen"
      });
      console.log("✔ Pinned engagement comment active!");
    } catch (commentErr) {
      console.warn("⚠️ Comment injection skipped:", commentErr.message);
    }

    console.log(`\n⏰ NEXT STEP: Video #${targetIndex + 2 <= items.length ? targetIndex + 2 : "COMPLETE"} will be dispatched tomorrow at Prime Time.`);
  } else {
    console.error(`❌ Upload failed: ${res.error}`);
  }
}

uploadSaraZamanaShorts().catch(console.error);
