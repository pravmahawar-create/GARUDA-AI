#!/usr/bin/env node
/**
 * 🦅 Autonomous YouTube Uploader for Official GARUDA Tech Video
 * Channel: @GARUDA-AIAIOPERATINGSYSTEM (UCA3WxFFJS0wG-oUxdcpncaw)
 * Video: GARUDA_OS_Sovereign_AI_Swara_Short.mp4 (39s Full Length)
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const youtubeService = require("../src/services/youtubeDirectPushService");

async function uploadGarudaVideo() {
  console.log("🦅 [GARUDA] Initiating 100% Autonomous YouTube Upload to Official Channel...\n");

  const videoFilePath = path.join(__dirname, "..", "output", "shorts", "GARUDA_OS_Sovereign_AI_Swara_Short.mp4");
  if (!fs.existsSync(videoFilePath)) {
    throw new Error(`Video file not found at: ${videoFilePath}`);
  }

  const title = "Inside India's Sovereign AI Operating System 🦅⚡ (1 Founder = 1,000 AI Engineers) #GARUDA #Shorts";
  const description = `What if a single Founder could command a 1,000-engineer autonomous AI workforce? Meet GARUDA OS — India's Sovereign AI Operating System built for extreme engineering velocity, zero manual bottlenecks, and 48-hour production deployments.

🎙️ Voice Engine: Swara AI (hi-IN-SwaraNeural — Authentic Indian Neural Voice)
👑 Founder: Praveen Mahawar
🦅 Explore Official Platform: https://www.garudaos.in
⚡ Architecture: Sovereign AI Workforce (Ring 3 Executable)

Key Highlights:
0:00 - India's Sovereign AI Operating System
0:09 - 1 Founder = 1,000 Autonomous AI Engineers
0:19 - No Slow Agencies · 48-Hour Deployment Sprint
0:29 - Explore GARUDA OS (garudaos.in)

#GARUDA #AIOperatingSystem #ArtificialIntelligence #TechFounders #DevCommunity #SoftwareEngineering #FutureTech #AutonomousAI #IndianTech #ViralShorts`;

  const tags = [
    "GARUDA OS",
    "Sovereign AI",
    "AI Operating System",
    "Praveen Mahawar",
    "Autonomous AI Agents",
    "AI Workforce",
    "Indian Tech",
    "DevCommunity",
    "Future of Programming",
    "Tech Founders",
    "Software Engineering",
    "Swara AI",
    "Viral Shorts",
    "NextGen Tech"
  ];

  console.log(`Video File: ${videoFilePath} (${(fs.statSync(videoFilePath).size / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`Target Profile: garuda (@GARUDA-AIAIOPERATINGSYSTEM)`);
  console.log(`Title: "${title}"`);
  console.log(`Category: 28 (Science & Technology) | Tags: ${tags.length}\n`);

  const result = await youtubeService.uploadVideo({
    videoFilePath,
    title,
    description,
    tags,
    privacyStatus: "public",
    categoryId: "28",
    channelProfile: "garuda"
  });

  console.log("Upload Result:", JSON.stringify(result, null, 2));

  if (result.success) {
    console.log("\n==============================================================");
    console.log(`🎉 VIDEO PUBLISHED SUCCESSFULLY ON OFFICIAL GARUDA CHANNEL!`);
    console.log(`Video ID: ${result.videoId}`);
    console.log(`YouTube Watch URL: ${result.youtubeUrl}`);
    console.log(`YouTube Shorts URL: ${result.shortsUrl}`);
    console.log("==============================================================\n");
  } else {
    console.error("[-] Upload failed:", result);
    process.exit(1);
  }
}

uploadGarudaVideo().catch(err => {
  console.error("[-] Fatal Upload Error:", err.message);
  process.exit(1);
});
