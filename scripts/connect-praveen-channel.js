/**
 * 🦅 GARUDA Autonomous YouTube Connector: Founder Personal Channel
 * Authorizes and links https://www.youtube.com/@Praveen-Mahawar-111
 * 
 * Usage:
 *   1. View Auth URL:
 *      node scripts/connect-praveen-channel.js
 * 
 *   2. Exchange code after approving in browser:
 *      node scripts/connect-praveen-channel.js "url_or_code"
 */

try { require("dotenv").config(); } catch {}
const fs = require("fs");
const path = require("path");
const youtubeService = require("../src/services/youtubeDirectPushService");

const PRAVEEN_CHANNEL_ID = "UC68_XAkGvyU95T1VrTnrw0Q";
const PRAVEEN_HANDLE = "@Praveen-Mahawar-111";
const REDIRECT_URI = "https://www.garudaos.in/api/bot-verse/youtube/callback";

async function runConnector() {
  const arg = process.argv[2];

  console.log("===============================================================");
  console.log("🦅 GARUDA YOUTUBE CONNECTOR: FOUNDER PERSONAL CHANNEL");
  console.log("Target Handle: " + PRAVEEN_HANDLE);
  console.log("Target Channel ID: " + PRAVEEN_CHANNEL_ID);
  console.log("===============================================================\n");

  if (!arg) {
    const auth = youtubeService.getAuthUrl(REDIRECT_URI, "praveen");
    console.log("1. Open this 1-click Google Authorization URL in your browser:\n");
    console.log(auth.authUrl + "\n");
    console.log("2. Choose your Google Account and select channel: 'Praveen Mahawar' (@Praveen-Mahawar-111)");
    console.log("3. Click 'Allow'. Google will redirect to: https://www.garudaos.in/api/bot-verse/youtube/callback?code=...");
    console.log("4. Copy either the full URL or just the code from the address bar, and run:\n");
    console.log('   node scripts/connect-praveen-channel.js "<copied_url_or_code>"\n');
    return;
  }

  let code = arg.trim();
  if (code.includes("code=")) {
    try {
      const urlObj = new URL(code.startsWith("http") ? code : "https://dummy.com/?" + code);
      code = urlObj.searchParams.get("code") || code;
    } catch {
      const match = code.match(/code=([^&]+)/);
      if (match) code = decodeURIComponent(match[1]);
    }
  }

  console.log("Exchanging authorization code with Google OAuth endpoint...");

  try {
    const res = await youtubeService.handleCallback(code, REDIRECT_URI, "praveen");
    console.log("\n✔ SUCCESS:", res.message);
    console.log("Connected Channel Title: " + res.channelTitle);
    console.log("Connected Channel ID:    " + res.channelId);

    if (res.channelId === PRAVEEN_CHANNEL_ID) {
      console.log("\n🎯 100% IDENTITY MATCH CONFIRMED!");
      console.log("This token is verified for " + PRAVEEN_HANDLE + ".");
      console.log("Personal singing performance videos are now ready to be dispatched to Praveen's channel.");
    } else {
      console.warn("\n⚠️ WARNING: Connected channel (" + res.channelId + ") differs from expected (" + PRAVEEN_CHANNEL_ID + ").");
    }

    try {
      const mongoose = require("mongoose");
      if (process.env.MONGODB_URI) {
        await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 4000 });
        const coll = mongoose.connection.db.collection("garuda_youtube_tokens");
        const tokens = youtubeService.getStoredTokens("praveen");
        await coll.updateOne(
          { _id: "praveen" },
          { $set: { ...tokens, channelProfile: "praveen", updatedAt: new Date() } },
          { upsert: true }
        );
        console.log("✔ Token safely synced to persistent MongoDB Atlas!");
        await mongoose.disconnect();
      }
    } catch (dbErr) {
      console.log("(MongoDB sync note: " + dbErr.message + ")");
    }

    console.log("\n🚀 You can now run 'node scripts/upload-sara-zamana-shorts.js' to publish Short #1 at Prime Time!");
  } catch (error) {
    console.error("\n❌ Authorization exchange failed:", error.message);
  }
}

runConnector().catch(console.error);
