#!/usr/bin/env node
/**
 * 🦅 GARUDA YouTube Daily Viral Daemon — Praveen Channel (1 short/day)
 * - Picks next pending short from output/shorts/shorts_metadata.json (personalStatus != published)
 * - Uploads via youtubeDirectPushService (praveen profile, isolated token)
 * - Generates viral 6-bot package via botVerseEngine
 * - Pushes viral title/description/tags via YouTube API (100% autonomous)
 * - Persists state, enforces 1/day prime-time window (18:00-20:00 IST) unless --force
 *
 * Usage:
 *   node scripts/youtube-daily-viral-daemon.js          # normal (checks window + pending)
 *   node scripts/youtube-daily-viral-daemon.js --force  # upload next pending now
 *   node scripts/youtube-daily-viral-daemon.js --dry-run
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const botVerseEngine = require("../src/services/botVerseEngineService");
const youtubeService = require("../src/services/youtubeDirectPushService");

const META_PATH = path.join(__dirname, "..", "output", "shorts", "shorts_metadata.json");
const LOG_PATH = path.join(__dirname, "..", "data", "youtube-daily-daemon-log.jsonl");

function isPrimeTime(force) {
  if (force) return true;
  const now = new Date();
  // IST = UTC+5:30
  const istHour = (now.getUTCHours() + 5.5) % 24;
  return istHour >= 18 && istHour < 20; // 18:00-20:00 IST
}

function getNextPendingShort() {
  if (!fs.existsSync(META_PATH)) throw new Error("shorts_metadata.json not found");
  const shorts = JSON.parse(fs.readFileSync(META_PATH, "utf8"));
  const pending = shorts.filter(s => !s.personalVideoId && s.status === "published");
  // Also include Short_2/3 that have no personalStatus
  const queue = shorts.filter(s => !s.personalVideoId);
  return queue.length ? queue[0] : null;
}

async function viralPushForVideoId(videoId, baseTitle) {
  const seedUrl = `https://www.youtube.com/shorts/${videoId}`;
  const campaign = await botVerseEngine.generateBotVerseCampaign({
    topic: baseTitle,
    seedVideoUrl: seedUrl,
    niche: "Music • Live Performance • Praveen Mahawar",
    targetAudience: "Bollywood Retro Fans & Family Audiences",
    brandName: "Praveen Mahawar",
  });
  const yt = campaign.bots.youtubeApexBot;
  return { campaign, yt };
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const dryRun = args.includes("--dry-run");
  console.log("🦅 [GARUDA] Daily Viral Daemon — Praveen (1/day)\n");
  console.log(`Prime time check (18-20 IST): ${isPrimeTime(false) ? "IN WINDOW" : "OUTSIDE"} | force=${force} dryRun=${dryRun}`);

  if (!isPrimeTime(force) && !dryRun) {
    console.log("⏸ Outside prime window — skipping today. Use --force to override or --dry-run to preview.");
    return;
  }

  const status = youtubeService.getStatus("praveen");
  console.log(`YouTube praveen: connected=${status.connected} channel=${status.channelTitle}`);
  if (!status.connected) throw new Error("Praveen YouTube not connected — auth via /api/bot-verse/youtube/auth-url?state=praveen");

  const next = getNextPendingShort();
  if (!next) {
    console.log("✔ No pending short for praveen — queue empty. All 3 shorts already mirrored.");
    return;
  }
  console.log(`Next pending: ${next.fileName} → ${next.title}`);
  console.log(`Local file: output/shorts/${next.fileName} exists=${fs.existsSync(path.join(__dirname,"..","output","shorts",next.fileName))}`);

  if (dryRun) {
    console.log("\n[DRY-RUN] Viral package preview:");
    const { campaign, yt } = await viralPushForVideoId(next.videoId, next.title);
    console.log(`  Title: ${yt.optimizedTitles[0].title}`);
    console.log(`  Chapters: ${yt.seoChapters.map(c=>c.timestamp).join(", ")}`);
    console.log(`  Campaign SHA: ${campaign.sha256Evidence.slice(0,16)}...`);
    console.log("[DRY-RUN] No upload/push performed.");
    return;
  }

  // 1. Upload next short to praveen channel with original title (brand separation guard ensures praveen→praveen)
  const filePath = path.join(__dirname, "..", "output", "shorts", next.fileName);
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);

  console.log(`\nUploading ${next.fileName} to praveen channel (UC68_XAkGvyU95T1VrTnrw0Q)...`);
  const uploadRes = await youtubeService.uploadVideo({
    videoFilePath: filePath,
    title: next.title,
    description: next.description,
    tags: next.tags,
    channelProfile: "praveen",
    privacyStatus: "public",
  });
  if (!uploadRes.success) throw new Error(`Upload failed: ${uploadRes.error}`);
  const newVideoId = uploadRes.videoId;
  console.log(`✔ Uploaded → https://www.youtube.com/shorts/${newVideoId} (GARUDA ID ${newVideoId})`);

  // 2. Generate viral package for new video and push optimized metadata
  console.log(`Generating viral package for ${newVideoId}...`);
  const { campaign, yt } = await viralPushForVideoId(newVideoId, next.title);
  const viralTitle = yt.optimizedTitles[0].title;
  const viralDesc = [
    yt.richDescription,
    "", "📌 Chapters:",
    ...yt.seoChapters.map(c=> `${c.timestamp} - ${c.title}`),
    "", `🔗 Full Live: https://www.youtube.com/watch?v=s-uFBOXA0ME`,
    `📲 GARUDA: https://www.garudaos.in/chat?ref=${campaign.campaignId}_yt`,
    `Campaign ${campaign.campaignId} SHA ${campaign.sha256Evidence.slice(0,12)}`,
  ].join("\n");

  console.log(`Pushing viral metadata to ${newVideoId}...`);
  const pushRes = await youtubeService.pushVideoUpdate({
    videoId: newVideoId,
    title: viralTitle,
    description: viralDesc,
    tags: yt.tags,
    channelProfile: "praveen",
  });
  if (!pushRes.success) throw new Error(`Viral push failed: ${pushRes.error}`);
  console.log(`✔ Viral push SUCCESS — ${pushRes.mode} → ${viralTitle}`);

  // 3. Persist to shorts_metadata.json (mirror personal fields)
  const shorts = JSON.parse(fs.readFileSync(META_PATH, "utf8"));
  const idx = shorts.findIndex(s => s.fileName === next.fileName);
  if (idx !== -1) {
    shorts[idx].personalVideoId = newVideoId;
    shorts[idx].personalYoutubeUrl = `https://www.youtube.com/watch?v=${newVideoId}`;
    shorts[idx].personalShortsUrl = `https://www.youtube.com/shorts/${newVideoId}`;
    shorts[idx].personalUploadedAt = new Date().toISOString();
    shorts[idx].personalChannel = "@Praveen-Mahawar-111";
    shorts[idx].personalStatus = "published";
    shorts[idx].personalViralCampaignId = campaign.campaignId;
    shorts[idx].personalViralSha = campaign.sha256Evidence;
    fs.writeFileSync(META_PATH, JSON.stringify(shorts, null, 2), "utf8");
    console.log(`✔ Metadata updated: ${META_PATH}`);
  }

  // 4. Log
  const entry = {
    timestamp: new Date().toISOString(),
    fileName: next.fileName,
    videoId: newVideoId,
    channelProfile: "praveen",
    campaignId: campaign.campaignId,
    viralTitle,
    sha: campaign.sha256Evidence,
    youtubeUrl: `https://www.youtube.com/shorts/${newVideoId}`,
  };
  fs.appendFileSync(LOG_PATH, JSON.stringify(entry) + "\n", "utf8");
  console.log(`✔ Log saved: ${LOG_PATH}`);
  console.log("\n✔ Daily viral daemon complete — 1 short/day enforced.");
}

if (require.main === module) {
  main().then(()=>process.exit(0)).catch(e=>{ console.error("\n✖ Daemon failed:", e.message); process.exit(1); });
}
module.exports = { main, getNextPendingShort };
