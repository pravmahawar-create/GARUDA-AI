/**
 * 🦅 GARUDA FIRST GENUINE AUTONOMOUS PUBLISHING CYCLE
 * Executes real publishing on connected platforms (YouTube Data API v3 OAuth),
 * routes disconnected/challenge platforms to MANUAL_ACTION_REQUIRED,
 * captures platform-side proof, and feeds learning into PerformanceLearner.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const ContentScheduler = require('../social-engine/content/contentScheduler');
const ContentPolicyManager = require('../social-engine/content/contentPolicyManager');
const PeakTimeEngine = require('../social-engine/content/peakTimeEngine');
const PerformanceLearner = require('../social-engine/content/performanceLearner');
const youtubeService = require('../src/services/youtubeDirectPushService');

async function runCycle() {
  console.log('================================================================');
  console.log('🦅 GARUDA: FIRST GENUINE AUTONOMOUS PUBLISHING CYCLE');
  console.log('================================================================\n');

  // 1. Ensure clean policy
  ContentPolicyManager.setKillSwitch(false);
  ContentPolicyManager.setPostingMode('AUTONOMOUS');

  // 2. Select Video Asset
  const videoFile = 'output/shorts/GARUDA_EXPLAINS_ITSELF_WORKING_DEMO.mp4';
  if (!fs.existsSync(videoFile)) {
    throw new Error('Video asset not found: ' + videoFile);
  }
  console.log('▶ [1/5] Verified Authentic Video Asset:', videoFile, `(${fs.statSync(videoFile).size} bytes)`);

  // 3. Peak-Time Window Calculation per platform
  console.log('\n▶ [2/5] PeakTimeEngine Calculating Optimal Windows:');
  const platforms = ['FACEBOOK', 'INSTAGRAM', 'LINKEDIN', 'YOUTUBE'];
  const windowResults = {};
  for (const p of platforms) {
    const w = await PeakTimeEngine.calculateWindows(p, new Date());
    windowResults[p] = w;
    console.log(`   • ${p}: Best Window=${w.bestWindow.startHour}:00-${w.bestWindow.endHour}:00 IST | Confidence=${w.confidence} | Basis=${w.bestWindow.basis}`);
  }

  // 4. Schedule Authentic Content Campaign
  console.log('\n▶ [3/5] Scheduling Authentic Campaign via ContentScheduler...');
  const campaign = await ContentScheduler.scheduleCampaign({
    topic: 'GARUDA Sovereign AI Operating System',
    idea: 'What if a single Founder could command an autonomous AI workforce? Meet GARUDA OS — built for autonomous software engineering, deterministic state verification, and sovereign execution.',
    primaryObjective: 'PRODUCT_DISCOVERY',
    platforms,
    targetUrl: 'https://www.garudaos.in',
    candidateHashtags: ['#GARUDAOS', '#EnterpriseAI', '#AutonomousSoftware', '#TechInnovation'],
    availableAssets: [videoFile],
    immediate: true
  });

  console.log(`✔ Campaign Scheduled! Family ID: ${campaign.contentFamilyId} (${campaign.scheduledCount} variants)`);

  // 5. Execute Autonomous Dispatch Cycle
  console.log('\n▶ [4/5] Executing Autonomous Dispatch Cycle (Real Platform Execution)...');
  const dispatchResults = await ContentScheduler.runSchedulerCycle({ dryRun: false });
  console.log('Dispatch Cycle Summary:', JSON.stringify(dispatchResults, null, 2));

  // 6. Platform-Side Verification for Published Items
  console.log('\n▶ [5/5] Platform-Side Verification & Telemetry Ingestion:');
  for (const item of dispatchResults.details) {
    if (item.status === 'PUBLISHED' && item.platform === 'YOUTUBE') {
      const scheduleDoc = ContentScheduler._loadLocalSchedule().find(p => p.contentId === item.contentId);
      const videoId = scheduleDoc?.platformPostId;
      console.log(`\n🔎 Verifying YouTube Video ID: ${videoId}...`);
      
      const token = await youtubeService.getFreshAccessToken('garuda');
      const verifyRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,status,statistics&id=${videoId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const verifyData = await verifyRes.json();
      
      if (verifyData.items && verifyData.items.length > 0) {
        const liveVideo = verifyData.items[0];
        console.log('✅ PLATFORM CONFIRMATION RECEIVED FROM GOOGLE YOUTUBE API:');
        console.log(`   • Title: ${liveVideo.snippet.title}`);
        console.log(`   • Status: ${liveVideo.status.uploadStatus} (${liveVideo.status.privacyStatus})`);
        console.log(`   • URL: https://youtube.com/watch?v=${videoId}`);
        console.log(`   • PublishedAt: ${liveVideo.snippet.publishedAt}`);
        console.log(`   • Views: ${liveVideo.statistics.viewCount || 0}`);
        console.log(`   • Likes: ${liveVideo.statistics.likeCount || 0}`);
        console.log(`   • Comments: ${liveVideo.statistics.commentCount || 0}`);

        // Ingest into PerformanceLearner
        const learningRes = await PerformanceLearner.ingestPostTelemetry({
          contentId: item.contentId,
          platform: 'YOUTUBE',
          format: 'SHORT',
          linkPlacement: 'FIRST_COMMENT',
          hashtagCount: 4,
          publishedAt: liveVideo.snippet.publishedAt,
          impressions: Number(liveVideo.statistics.viewCount || 0),
          likes: Number(liveVideo.statistics.likeCount || 0),
          comments: Number(liveVideo.statistics.commentCount || 0),
          shares: 0,
          clicks: 0
        });
        console.log('✔ Ingested to PerformanceLearner:', learningRes);
      } else {
        console.log('⚠️ Video verification unconfirmed on platform.');
      }
    } else {
      console.log(`   • ${item.platform}: ${item.status} (${item.error || item.reason || 'Handled safely'})`);
    }
  }

  console.log('\n================================================================');
  console.log('🎉 FIRST GENUINE AUTONOMOUS PUBLISHING CYCLE COMPLETED');
  console.log('================================================================');
}

runCycle().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
