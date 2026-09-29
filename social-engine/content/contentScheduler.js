/**
 * GARUDA Autonomous Content Scheduler
 * Governs the end-to-end lifecycle:
 * CONTENT_READY → PLATFORM_SELECTION → FORMAT_SELECTION → PEAK_WINDOW_SELECTION 
 * → SCHEDULED → PUBLISH → VERIFY → MONITOR → ANALYZE → LEARN
 * 
 * Persists in MongoDB Atlas & survives Render restarts.
 * Principle: Zero unverified claims, deterministic audit trails.
 */

const fs = require('fs');
const path = require('path');
const PeakTimeEngine = require('./peakTimeEngine');
const PlatformStrategyEngine = require('./platformStrategyEngine');
const ContentFormatSelector = require('./contentFormatSelector');
const ContentVariantEngine = require('./contentVariantEngine');
const PublishingSafetyGate = require('./publishingSafetyGate');
const PerformanceLearner = require('./performanceLearner');
const ContentPolicyManager = require('./contentPolicyManager');
const { isMongoConnected } = require('../../src/database/db');

const SCHEDULE_BACKUP_FILE = path.resolve(__dirname, '../../data/content/content_schedule.json');

class ContentScheduler {
  /**
   * Plan and schedule a full cross-platform campaign from a single idea.
   * @param {Object} campaignInput
   * @param {string} campaignInput.idea
   * @param {string} campaignInput.topic
   * @param {string} [campaignInput.primaryObjective='AUTHORITY']
   * @param {string[]} [campaignInput.platforms]
   * @param {string} [campaignInput.targetUrl]
   * @param {string[]} [campaignInput.candidateHashtags]
   * @param {string[]} [campaignInput.availableAssets]
   * @param {boolean} [campaignInput.immediate=false] - If true, schedules for now + 1m
   * @returns {Promise<Object>} { campaignId, scheduledPosts: [] }
   */
  static async scheduleCampaign(campaignInput) {
    const policy = ContentPolicyManager.getPolicy();
    if (policy.killSwitch || policy.postingMode === 'STOPPED') {
      throw new Error('CONTENT_CREATION_BLOCKED: Content Kill Switch is active or posting mode is STOPPED.');
    }

    if (!ContentPolicyManager.isTopicAllowed(campaignInput.topic)) {
      throw new Error(`TOPIC_BLOCKED: Topic "${campaignInput.topic}" is on the prohibited content list.`);
    }

    // 1. Generate Platform-Native Variants
    const targetPlatforms = (campaignInput.platforms || policy.enabledPlatforms).filter(p => ContentPolicyManager.isPlatformEnabled(p));
    const variants = ContentVariantEngine.generateVariants({
      ...campaignInput,
      platforms: targetPlatforms
    });

    const scheduledPosts = [];

    // 2. Schedule each platform variant at its optimal peak window
    for (const variant of variants) {
      const windowCalc = await PeakTimeEngine.calculateWindows(variant.platform, new Date());
      let scheduledTime;

      if (campaignInput.immediate) {
        scheduledTime = new Date(Date.now() + 60 * 1000); // 1 minute from now
      } else {
        scheduledTime = PeakTimeEngine.getNextOptimalScheduleDate(windowCalc, new Date());
      }

      const initialStatus = policy.postingMode === 'APPROVAL_REQUIRED' ? 'AWAITING_APPROVAL' : 'SCHEDULED';

      const postRecord = {
        ...variant,
        scheduledTime,
        peakWindow: {
          windowType: windowCalc.bestWindow ? 'BEST_WINDOW' : 'SECONDARY_WINDOW',
          startHour: windowCalc.bestWindow.startHour,
          endHour: windowCalc.bestWindow.endHour,
          confidence: windowCalc.confidence,
          basis: windowCalc.bestWindow.basis
        },
        status: initialStatus,
        approvalRequired: policy.postingMode === 'APPROVAL_REQUIRED',
        approvedBy: policy.postingMode === 'AUTONOMOUS' ? 'autonomous_engine' : null,
        analytics: {
          impressions: 0,
          clicks: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          saves: 0,
          watchTimeSeconds: 0,
          retentionRate: 0,
          engagementRate: 0,
          leadsGenerated: 0
        },
        auditLog: [
          {
            stage: 'SCHEDULED',
            timestamp: new Date(),
            details: { windowType: 'BEST_WINDOW', confidence: windowCalc.confidence, scheduledTime }
          }
        ]
      };

      await this._persistPost(postRecord);
      scheduledPosts.push(postRecord);
    }

    console.log(`[ContentScheduler] 📅 Campaign scheduled successfully! ${scheduledPosts.length} variants across [${targetPlatforms.join(', ')}]`);
    return {
      contentFamilyId: variants[0]?.contentFamilyId,
      scheduledCount: scheduledPosts.length,
      scheduledPosts
    };
  }

  /**
   * Run one scheduler tick:
   * Finds due posts, passes safety gate, and dispatches.
   * @param {Object} [options={}]
   * @param {boolean} [options.dryRun=false]
   * @returns {Promise<Object>} Execution summary
   */
  static async runSchedulerCycle(options = {}) {
    const isDryRun = options.dryRun === true;
    const policy = ContentPolicyManager.getPolicy();

    if (policy.killSwitch || policy.postingMode === 'STOPPED') {
      return { status: 'HALTED', reason: 'KILL_SWITCH_OR_STOPPED' };
    }

    const now = new Date();
    const duePosts = await this._getDuePosts(now);

    const results = {
      evaluated: duePosts.length,
      published: 0,
      failed: 0,
      awaitingApproval: 0,
      details: []
    };

    for (const post of duePosts) {
      // 1. Check Approval Gate
      if (post.approvalRequired && !post.approvedBy) {
        results.awaitingApproval++;
        results.details.push({ contentId: post.contentId, status: 'AWAITING_APPROVAL' });
        continue;
      }

      // 2. Pre-Publish Safety Gate
      const safety = await PublishingSafetyGate.evaluate(post);
      if (!safety.safe) {
        post.status = safety.status === 'TRUTH_FAILED' ? 'CANCELLED' : safety.status;
        post.failureReason = safety.reason;
        post.auditLog.push({ stage: 'SAFETY_REJECTED', timestamp: new Date(), details: safety });
        await this._persistPost(post);
        results.failed++;
        results.details.push({ contentId: post.contentId, status: post.status, reason: safety.reason });
        continue;
      }

      // 3. Dispatch / Publish
      post.status = 'PUBLISHING';
      await this._persistPost(post);

      if (isDryRun) {
        // DRY RUN: Simulates verified dispatch without touching real platform APIs
        post.status = 'PUBLISHED';
        post.publishedAt = new Date();
        post.platformPostId = `dryrun_${post.platform.toLowerCase()}_${Date.now()}`;
        post.platformPostUrl = `https://${post.platform.toLowerCase()}.com/mock_post_${Date.now()}`;
        post.firstCommentPosted = post.linkStrategy.placement === 'FIRST_COMMENT' && Boolean(post.firstCommentText);
        post.auditLog.push({ stage: 'PUBLISHED_DRYRUN', timestamp: new Date() });
        await this._persistPost(post);

        results.published++;
        results.details.push({
          contentId: post.contentId,
          platform: post.platform,
          status: 'PUBLISHED (DRY-RUN)',
          firstCommentPosted: post.firstCommentPosted
        });
      } else {
        // Production dispatch via platform handler
        try {
          const dispatchRes = await this._dispatchToPlatform(post);
          if (dispatchRes.success) {
            post.status = 'PUBLISHED';
            post.publishedAt = new Date();
            post.platformPostId = dispatchRes.postId;
            post.platformPostUrl = dispatchRes.postUrl;
            post.firstCommentPosted = dispatchRes.firstCommentPosted || false;
            post.auditLog.push({ stage: 'PUBLISHED', timestamp: new Date(), details: dispatchRes });
            results.published++;
            results.details.push({ contentId: post.contentId, platform: post.platform, status: 'PUBLISHED' });
          } else {
            post.status = dispatchRes.status || 'PUBLISH_FAILED';
            post.failureReason = dispatchRes.error || 'Unknown dispatch error';
            post.auditLog.push({ stage: 'PUBLISH_FAILED', timestamp: new Date(), details: dispatchRes });
            results.failed++;
            results.details.push({ contentId: post.contentId, status: post.status, error: post.failureReason });
          }
          await this._persistPost(post);
        } catch (dispatchErr) {
          post.status = 'PUBLISH_FAILED';
          post.failureReason = dispatchErr.message;
          await this._persistPost(post);
          results.failed++;
          results.details.push({ contentId: post.contentId, status: 'PUBLISH_FAILED', error: dispatchErr.message });
        }
      }
    }

    return results;
  }

  /**
   * Platform Dispatch Router
   */
  static async _dispatchToPlatform(post) {
    const platform = post.platform.toUpperCase();

    // Check YouTube official service
    if (platform === 'YOUTUBE') {
      try {
        const youtubeService = require('../../src/services/youtubeDirectPushService');
        const ytStatus = youtubeService.getStatus();
        if (!ytStatus.connected) {
          return { success: false, status: 'MANUAL_ACTION_REQUIRED', error: 'YOUTUBE_OAUTH_TOKEN_REQUIRED' };
        }
        // Upload video if asset exists
        const videoAsset = (post.mediaUrls || []).find(u => u.endsWith('.mp4'));
        if (!videoAsset) {
          return { success: false, status: 'MANUAL_ACTION_REQUIRED', error: 'YOUTUBE_REQUIRES_MP4_VIDEO_ASSET' };
        }
        const uploadRes = await youtubeService.uploadVideo({
          videoFilePath: path.resolve(__dirname, '../..', videoAsset.replace(/^\//, '')),
          title: post.headline,
          description: post.body,
          tags: (post.hashtags || []).map(t => t.replace('#', '')),
          privacyStatus: 'public'
        });
        return {
          success: true,
          postId: uploadRes.videoId,
          postUrl: `https://youtube.com/watch?v=${uploadRes.videoId}`,
          firstCommentPosted: false
        };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    // For LinkedIn, Facebook, Instagram: check session availability
    if (platform === 'LINKEDIN') {
      if (!process.env.LINKEDIN_LI_AT) {
        return { success: false, status: 'MANUAL_ACTION_REQUIRED', error: 'LINKEDIN_LI_AT_SESSION_COOKIE_REQUIRED' };
      }
      // Note: Real publishing requires browser automation or official API
      return { success: false, status: 'MANUAL_ACTION_REQUIRED', error: 'LINKEDIN_SECURITY_REQUIRES_APPROVED_DISPATCH' };
    }

    return {
      success: false,
      status: 'MANUAL_ACTION_REQUIRED',
      error: `PLATFORM_DIRECT_DISPATCH_NOT_CONFIGURED_FOR_${platform}`
    };
  }

  /**
   * Query due posts from MongoDB or local store
   */
  static async _getDuePosts(cutoffDate) {
    if (isMongoConnected()) {
      try {
        const SocialContentSchedule = require('../../src/models/SocialContentSchedule');
        return await SocialContentSchedule.find({
          status: { $in: ['SCHEDULED', 'FOUNDER_APPROVED'] },
          scheduledTime: { $lte: cutoffDate }
        });
      } catch (e) {
        // Fall back
      }
    }

    // Local file fallback
    const all = this._loadLocalSchedule();
    return all.filter(p => ['SCHEDULED', 'FOUNDER_APPROVED'].includes(p.status) && new Date(p.scheduledTime) <= cutoffDate);
  }

  static async _persistPost(post) {
    if (isMongoConnected()) {
      try {
        const SocialContentSchedule = require('../../src/models/SocialContentSchedule');
        await SocialContentSchedule.findOneAndUpdate(
          { contentId: post.contentId },
          { $set: post },
          { upsert: true, new: true }
        );
      } catch (e) {
        console.warn(`[ContentScheduler] Mongo persist warning: ${e.message}`);
      }
    }

    // Local file mirror
    const all = this._loadLocalSchedule();
    const idx = all.findIndex(p => p.contentId === post.contentId);
    if (idx >= 0) {
      all[idx] = post;
    } else {
      all.push(post);
    }
    this._saveLocalSchedule(all);
  }

  static _loadLocalSchedule() {
    try {
      if (fs.existsSync(SCHEDULE_BACKUP_FILE)) {
        return JSON.parse(fs.readFileSync(SCHEDULE_BACKUP_FILE, 'utf8'));
      }
    } catch (e) {}
    return [];
  }

  static _saveLocalSchedule(allPosts) {
    try {
      const dir = path.dirname(SCHEDULE_BACKUP_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(SCHEDULE_BACKUP_FILE, JSON.stringify(allPosts, null, 2), 'utf8');
    } catch (e) {}
  }
}

module.exports = ContentScheduler;
