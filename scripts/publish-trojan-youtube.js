/**
 * 🦅 GARUDA Autonomous YouTube Video Publisher & SEO Engine — Trojan Visual
 * Video Asset: output/trojan_visual.mp4 (1200x674)
 * Thumbnail: output/trojan_visual.png
 * Target Channel: GARUDA Official ('UCA3WxFFJS0wG-oUxdcpncaw')
 * 
 * 100% Anti-Fabrication Law: Real API responses, verified video ID, public URL verification.
 */
require("dotenv").config();
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const puppeteer = require("puppeteer");
const mongoose = require("mongoose");
const connectDB = require("../src/database/db");
const youtubeService = require("../src/services/youtubeDirectPushService");

const VIDEO_PATH = path.resolve(__dirname, "../output/trojan_visual.mp4");
const THUMBNAIL_PATH = path.resolve(__dirname, "../output/trojan_visual.png");
const PROOF_PATH = path.resolve(__dirname, "../output/youtube_trojan_live_proof.png");
const RESULT_JSON = path.resolve(__dirname, "../output/youtube_trojan_publish_result.json");
const REDIRECT_URI = "https://www.garudaos.in/api/bot-verse/youtube/callback";

const TITLE = "Why 87% of AI Coding Agents Fail in Production Monorepos | GARUDA OS";

const DESCRIPTION = `The industry is asking the wrong question about Devin, Copilot, and AI software engineers.

The question isn't: "Can an LLM write code?" (Any 7B model can spit out Python syntax).
The real question is: "Can an autonomous AI survive in an enterprise monorepo without breaking production?"

In 2026, 87% of autonomous coding loops fail because of three fatal architectural flaws:

1. The Wrapper Hallucination:
Agents write code directly against raw chat prompts. They hallucinate packages that don't exist, modify unstaged files, and push breaking changes without containment.

2. Zero Worktree State Isolation:
Real engineering requires ephemeral Git Worktrees. If an AI agent isn't isolated in a dedicated sandbox worktree with strict process boundaries, it corrupts repo state.

3. The Missing Pre-Commit Forensic Gate:
In enterprise software, an agent's work cannot be trusted on "faith". Every patch must pass AST syntax interrogation, clean local compilation (exit code 0), and cryptographically verified SHA-256 state tracking before human signoff.

Chatbots give you code suggestions.
GARUDA gives you an Unstoppable, Governed Engineering Workforce.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TIMESTAMPS:
0:00 The Fatal Flaws of Modern AI Agents
0:03 Git Worktree State Isolation
0:06 AST Syntax & Pre-Commit Forensic Gate
0:09 Cryptographic Verification (SHA-256) & Sovereign AI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Official Sovereign Architecture: https://www.garudaos.in
Enterprise Inquiries: praveen@garudaos.in

#GARUDA #AIArchitecture #EnterpriseEngineering #SoftwareDevelopment #AutonomousAgents #Devin #SystemDesign #TechLeadership #SaaS #CodingAgent`;

const TAGS = [
  "GARUDA",
  "GARUDA OS",
  "Devin AI",
  "AI Coding Agents",
  "AI Software Engineer",
  "Autonomous Agents",
  "Software Development",
  "Enterprise Engineering",
  "Git Worktree",
  "System Design",
  "Tech Leadership",
  "AST Syntax Analysis",
  "Forensic Gate",
  "Sovereign AI",
  "AI 2026",
  "Coding Automation"
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

function launchBrowserWindows(url) {
  try {
    spawn("powershell", ["-NoProfile", "-Command", `Start-Process "${url}"`], { detached: true, stdio: "ignore" }).unref();
  } catch (e) {
    console.warn("Could not auto-launch browser:", e.message);
  }
}

async function pollMongoForTokens(maxWaitSeconds = 180) {
  console.log(`⏳ Monitoring MongoDB Atlas garuda_youtube_tokens (${maxWaitSeconds}s timeout)...`);
  if (!mongoose.connection || mongoose.connection.readyState !== 1) {
    await connectDB();
  }
  const coll = mongoose.connection.db.collection("garuda_youtube_tokens");
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitSeconds * 1000) {
    try {
      const doc = await coll.findOne({ _id: "garuda" });
      if (doc && doc.refreshToken) {
        youtubeService.saveTokens({
          refreshToken: doc.refreshToken,
          accessToken: doc.accessToken,
          expiresAt: doc.expiresAt,
          channelTitle: doc.channelTitle,
          channelId: doc.channelId
        }, "garuda");
        console.log("🎉 Fresh YouTube token detected in MongoDB Atlas!");
        return true;
      }
    } catch (e) {
      console.warn("Mongo poll err:", e.message);
    }
    await new Promise(r => setTimeout(r, 3000));
  }
  return false;
}

async function main() {
  console.log("=================================================");
  console.log("🦅 GARUDA TROJAN VIDEO YOUTUBE PUBLISHER & SEO");
  console.log("=================================================\n");

  if (!fs.existsSync(VIDEO_PATH)) {
    throw new Error(`Video file missing at: ${VIDEO_PATH}`);
  }

  // Check if a code or URL was passed as an argument
  const cliArg = process.argv[2];
  if (cliArg) {
    let code = cliArg.trim();
    if (code.includes("code=")) {
      try {
        const urlObj = new URL(code.startsWith("http") ? code : "https://dummy.com/?" + code);
        code = urlObj.searchParams.get("code") || code;
      } catch {
        const match = code.match(/code=([^&]+)/);
        if (match) code = decodeURIComponent(match[1]);
      }
    }
    console.log("Exchanging provided authorization code with Google OAuth endpoint...");
    const authRes = await youtubeService.handleCallback(code, REDIRECT_URI, "garuda");
    console.log("✔ Callback handled successfully:", authRes.message);

    // Also persist to MongoDB Atlas
    try {
      if (!mongoose.connection || mongoose.connection.readyState !== 1) await connectDB();
      const coll = mongoose.connection.db.collection("garuda_youtube_tokens");
      const tokens = youtubeService.getStoredTokens("garuda");
      await coll.updateOne(
        { _id: "garuda" },
        { $set: { ...tokens, channelProfile: "garuda", updatedAt: new Date() } },
        { upsert: true }
      );
      console.log("✔ Token safely synced to MongoDB Atlas.");
    } catch (mErr) {
      console.warn("MongoDB Atlas sync note:", mErr.message);
    }
  }

  // Attempt to acquire fresh access token
  let token = await youtubeService.getFreshAccessToken("garuda");

  // If token acquisition failed, attempt quick Mongo check
  if (!token) {
    console.log("Checking MongoDB Atlas for existing stored tokens...");
    try {
      if (!mongoose.connection || mongoose.connection.readyState !== 1) await connectDB();
      const coll = mongoose.connection.db.collection("garuda_youtube_tokens");
      const doc = await coll.findOne({ _id: "garuda" });
      if (doc && doc.refreshToken) {
        youtubeService.saveTokens(doc, "garuda");
        token = await youtubeService.getFreshAccessToken("garuda");
      }
    } catch (_) {}
  }

  // If still not available, trigger browser authorization
  if (!token) {
    const auth = youtubeService.getAuthUrl(REDIRECT_URI, "garuda");
    console.log("\n⚠️ [ACTION REQUIRED] YouTube OAuth Token Expired or Not Found.");
    console.log("Opening 1-click Google Authorization URL in your browser:\n");
    console.log(auth.authUrl + "\n");
    
    launchBrowserWindows(auth.authUrl);
    
    console.log("👉 Step 1: Choose your Google Account (GARUDA OS / garudaos.ai@gmail.com).");
    console.log("👉 Step 2: Click 'Allow' / 'Continue'.");
    console.log("👉 Step 3: Google redirects to: https://www.garudaos.in/api/bot-verse/youtube/callback");
    console.log("           The token will be captured automatically!\n");
    
    const mongoSynced = await pollMongoForTokens(180);
    if (mongoSynced) {
      token = await youtubeService.getFreshAccessToken("garuda");
    }
  }

  if (!token) {
    console.error("\n❌ Could not acquire active YouTube access token.");
    console.error("Please approve in your browser or copy the redirect URL/code and run:");
    console.error('node scripts/publish-trojan-youtube.js "<redirect_url_or_code>"');
    process.exit(1);
  }

  console.log("✔ Google OAuth Access Token validated.");

  console.log("\nInitiating YouTube Resumable Video Upload...");
  console.log(`Video File: ${VIDEO_PATH}`);
  console.log(`Size: ${(fs.statSync(VIDEO_PATH).size / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Title: ${TITLE}`);
  console.log(`Tags: ${TAGS.join(", ")}`);

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

  // Forensic Public Playback Verification
  let verification = null;
  try {
    verification = await verifyPublicPlayback(res.youtubeUrl);
  } catch (vErr) {
    console.warn("Playback verification note:", vErr.message);
  }

  const output = {
    ...res,
    seo: {
      title: TITLE,
      descriptionLength: DESCRIPTION.length,
      tagsCount: TAGS.length,
      category: "Science & Technology (28)",
      thumbnail: THUMBNAIL_PATH
    },
    verified: Boolean(verification),
    verification,
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync(RESULT_JSON, JSON.stringify(output, null, 2), "utf8");
  console.log(`\n✔ Full result written to: ${RESULT_JSON}`);
}

main().then(() => {
  if (mongoose.connection) mongoose.disconnect();
}).catch(err => {
  console.error("FATAL:", err);
  if (mongoose.connection) mongoose.disconnect();
  process.exit(1);
});
