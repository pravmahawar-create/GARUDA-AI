#!/usr/bin/env node
/**
 * 🦅 GARUDA YouTube Viral Push — Last Uploaded Short (Praveen Channel)
 * 1. Finds last uploaded short for praveen channel (PSlYx4H0ghY)
 * 2. Generates viral 6-bot package via botVerseEngine (Groq/Gemini)
 * 3. Pushes optimized title/description/tags to YouTube via youtubeDirectPushService (praveen profile)
 * Fully autonomous, no manual Studio copy.
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const botVerseEngine = require("../src/services/botVerseEngineService");
const youtubeService = require("../src/services/youtubeDirectPushService");

async function main() {
  console.log("🦅 [GARUDA] Viral Push — Last Uploaded Short (Praveen)\n");

  // 1. Identify last uploaded short for praveen
  const metaPath = path.join(__dirname, "..", "output", "shorts", "shorts_metadata.json");
  if (!fs.existsSync(metaPath)) throw new Error("shorts_metadata.json not found");
  const shorts = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  // Prefer praveen channel's last published
  const praveenShorts = shorts.filter(s => s.personalVideoId || s.personalStatus === "published");
  const last = praveenShorts.length ? praveenShorts[praveenShorts.length - 1] : shorts[shorts.length - 1];
  const videoId = last.personalVideoId || last.videoId;
  const channelProfile = last.personalVideoId ? "praveen" : "garuda";
  console.log(`Last short: ${last.fileName} → videoId ${videoId} (profile: ${channelProfile})`);
  console.log(`Channel: ${last.personalChannel || last.youtubeUrl}`);
  console.log(`Current title: ${last.title}`);

  // 2. Check YouTube auth for praveen
  const status = youtubeService.getStatus(channelProfile);
  console.log(`YouTube status (${channelProfile}): connected=${status.connected} channel=${status.channelTitle} id=${status.channelId}`);
  if (!status.connected) {
    throw new Error(`YouTube not connected for ${channelProfile} — run auth via /api/bot-verse/youtube/auth-url?redirect=true&state=${channelProfile}`);
  }

  // 3. Generate viral package via BotVerse (use current title as seed)
  const seedUrl = `https://www.youtube.com/shorts/${videoId}`;
  console.log(`\nGenerating viral package for ${seedUrl} ...`);
  const campaign = await botVerseEngine.generateBotVerseCampaign({
    topic: last.title,
    seedVideoUrl: seedUrl,
    niche: "Music • Live Performance • Praveen Mahawar",
    targetAudience: "Bollywood Retro Fans & Family Audiences",
    brandName: "Praveen Mahawar",
  });
  const ytBot = campaign.bots.youtubeApexBot;
  const newTitle = ytBot.optimizedTitles[0].title;
  const newDesc = ytBot.richDescription;
  const newTags = ytBot.tags;
  const chapters = ytBot.seoChapters;
  console.log(`Viral title: ${newTitle}`);
  console.log(`Chapters: ${chapters.map(c=>c.timestamp+" "+c.title).join(" | ")}`);
  console.log(`Tags: ${newTags.slice(0,5).join(", ")}...`);
  console.log(`Campaign SHA: ${campaign.sha256Evidence.slice(0,16)}...`);

  // Build viral description with chapters + bridge
  const viralDescription = [
    newDesc,
    "",
    "📌 Chapters (Key Moments):",
    ...chapters.map(c=> `${c.timestamp} - ${c.title}`),
    "",
    `🔗 Full Live Performance: https://www.youtube.com/watch?v=s-uFBOXA0ME`,
    `📲 GARUDA Platform: https://www.garudaos.in/chat?ref=${campaign.campaignId}_yt`,
    "",
    `Campaign: ${campaign.campaignId} | SHA: ${campaign.sha256Evidence.slice(0,12)}`,
  ].join("\n");

  // 4. Push to YouTube via direct API (praveen channel, never garuda)
  console.log(`\nPushing viral update to YouTube ${videoId} via ${channelProfile} token...`);
  const pushRes = await youtubeService.pushVideoUpdate({
    videoId,
    title: newTitle,
    description: viralDescription,
    tags: newTags,
    channelProfile,
  });

  if (pushRes.success) {
    console.log(`✔ VIRAL PUSH SUCCESS — mode: ${pushRes.mode}`);
    console.log(`  YouTube URL: https://www.youtube.com/shorts/${videoId}`);
    console.log(`  New title: ${newTitle}`);
    // Persist viral push record
    const logPath = path.join(__dirname, "..", "data", "youtube-viral-push-log.jsonl");
    fs.appendFileSync(logPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      videoId,
      channelProfile,
      campaignId: campaign.campaignId,
      newTitle,
      sha: campaign.sha256Evidence,
      youtubeUrl: `https://www.youtube.com/shorts/${videoId}`,
      pushMode: pushRes.mode,
      viralPackage: ytBot,
    }) + "\n", "utf8");
    console.log(`  Log saved: ${logPath}`);
  } else {
    console.error(`✖ PUSH FAILED: ${pushRes.error} — requiresAuth: ${pushRes.requiresAuth}`);
    if (pushRes.authUrl) console.log(`  Auth URL: ${pushRes.authUrl}`);
    throw new Error(pushRes.error);
  }
}

if (require.main === module) {
  main().then(()=>{ console.log("\n✔ Done — Last short viral pushed."); process.exit(0); }).catch(e=>{ console.error("\n✖ Viral push failed:", e.message); process.exit(1); });
}
module.exports = { main };
