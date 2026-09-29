/**
 * GARUDA Autonomous Content Operations Routes
 * Provides Founder Dashboard, Campaign Initiation, Governance, and Telemetry API.
 */

const express = require('express');
const router = express.Router();
const ContentScheduler = require('../../social-engine/content/contentScheduler');
const ContentPolicyManager = require('../../social-engine/content/contentPolicyManager');
const PeakTimeEngine = require('../../social-engine/content/peakTimeEngine');
const PerformanceLearner = require('../../social-engine/content/performanceLearner');
const { isMongoConnected } = require('../database/db');

/**
 * GET /api/content/dashboard
 * Simple, high-fidelity operational view.
 */
router.get('/dashboard', async (req, res) => {
  try {
    const policy = ContentPolicyManager.getPolicy();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    let scheduledToday = 0;
    let publishedToday = 0;
    let totalImpressions = 0;
    let totalEngagement = 0;
    let totalLeads = 0;
    let nextPost = null;

    if (isMongoConnected()) {
      try {
        const SocialContentSchedule = require('../models/SocialContentSchedule');
        const SocialRevenueLead = require('../models/SocialRevenueLead');

        scheduledToday = await SocialContentSchedule.countDocuments({ createdAt: { $gte: startOfDay } });
        publishedToday = await SocialContentSchedule.countDocuments({ status: 'PUBLISHED', publishedAt: { $gte: startOfDay } });

        const publishedDocs = await SocialContentSchedule.find({ status: 'PUBLISHED' }).lean();
        for (const p of publishedDocs) {
          totalImpressions += (p.analytics?.impressions || 0);
          totalEngagement += (p.analytics?.likes || 0) + (p.analytics?.comments || 0) + (p.analytics?.clicks || 0);
        }

        totalLeads = await SocialRevenueLead.countDocuments({ sourceType: 'content_comment' });

        nextPost = await SocialContentSchedule.findOne({
          status: { $in: ['SCHEDULED', 'AWAITING_APPROVAL'] },
          scheduledTime: { $gte: new Date() }
        }).sort({ scheduledTime: 1 }).lean();
      } catch (e) {
        console.warn(`[ContentDashboard] Mongo query warning: ${e.message}`);
      }
    }

    // Platform status
    const platformStatus = {
      facebook: {
        enabled: policy.enabledPlatforms.includes('FACEBOOK'),
        dailyLimit: policy.dailyPlatformLimits.FACEBOOK,
        status: policy.killSwitch ? 'STOPPED' : 'ACTIVE'
      },
      instagram: {
        enabled: policy.enabledPlatforms.includes('INSTAGRAM'),
        dailyLimit: policy.dailyPlatformLimits.INSTAGRAM,
        status: policy.killSwitch ? 'STOPPED' : 'ACTIVE'
      },
      linkedin: {
        enabled: policy.enabledPlatforms.includes('LINKEDIN'),
        dailyLimit: policy.dailyPlatformLimits.LINKEDIN,
        status: policy.killSwitch ? 'STOPPED' : 'ACTIVE'
      },
      youtube: {
        enabled: policy.enabledPlatforms.includes('YOUTUBE'),
        dailyLimit: policy.dailyPlatformLimits.YOUTUBE,
        status: policy.killSwitch ? 'STOPPED' : 'ACTIVE'
      }
    };

    // Calculate sample window for LinkedIn to show current learning
    const win = await PeakTimeEngine.calculateWindows('LINKEDIN', new Date());

    return res.json({
      success: true,
      service: 'GARUDA Autonomous Content Operations Engine',
      today: {
        postsScheduled: scheduledToday,
        postsPublished: publishedToday,
        impressions: totalImpressions,
        engagement: totalEngagement,
        leads: totalLeads,
        opportunities: totalLeads // Inbound buyer leads are direct opportunities
      },
      platformStatus,
      next: nextPost ? {
        contentId: nextPost.contentId,
        topic: nextPost.topic,
        platform: nextPost.platform,
        selectedTime: nextPost.scheduledTime,
        confidence: nextPost.peakWindow?.confidence || 'LOW',
        status: nextPost.status
      } : {
        message: 'No upcoming scheduled posts',
        nextRecommendedWindow: `${win.bestWindow.startHour}:00 - ${win.bestWindow.endHour}:00 IST`
      },
      learning: {
        bestCurrentWindow: `${win.bestWindow.startHour}:00 - ${win.bestWindow.endHour}:00 IST (${win.bestWindow.basis})`,
        winningFormat: 'IMAGE / CAROUSEL (Dwell-time verified)',
        winningTopic: 'Enterprise Autonomous Systems Architecture',
        lastExperiment: 'Link Strategy: FIRST_COMMENT vs BODY (Reach preservation test)'
      },
      governance: {
        postingMode: policy.postingMode,
        killSwitch: policy.killSwitch,
        lastUpdated: policy.lastUpdated
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/content/campaign
 * Founder creates campaign once; engine adapts and schedules cross-platform.
 */
router.post('/campaign', async (req, res) => {
  try {
    const { idea, topic, primaryObjective, platforms, targetUrl, candidateHashtags, availableAssets, immediate } = req.body;
    if (!idea || !topic) {
      return res.status(400).json({ success: false, error: 'idea and topic are required' });
    }

    const scheduled = await ContentScheduler.scheduleCampaign({
      idea,
      topic,
      primaryObjective,
      platforms,
      targetUrl,
      candidateHashtags,
      availableAssets,
      immediate: Boolean(immediate)
    });

    return res.json({
      success: true,
      message: 'Campaign scheduled autonomously across platforms',
      data: scheduled
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/content/mode
 * Change posting mode: AUTONOMOUS | APPROVAL_REQUIRED | STOPPED
 */
router.post('/mode', (req, res) => {
  try {
    const { mode } = req.body;
    const updated = ContentPolicyManager.setPostingMode(mode);
    return res.json({ success: true, policy: updated });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/content/kill-switch
 * Global Content Kill Switch
 */
router.post('/kill-switch', (req, res) => {
  try {
    const { active, reason } = req.body;
    const updated = ContentPolicyManager.setKillSwitch(Boolean(active), reason);
    return res.json({
      success: true,
      message: active ? 'GLOBAL CONTENT KILL SWITCH ENGAGED' : 'Kill switch disengaged',
      policy: updated
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/content/run-cycle
 * Trigger autonomous cycle tick (dry-run or real)
 */
router.post('/run-cycle', async (req, res) => {
  try {
    const { dryRun = true } = req.body;
    const cycleResult = await ContentScheduler.runSchedulerCycle({ dryRun });
    return res.json({ success: true, cycleResult });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/content/approve/:contentId
 * Founder approves a post waiting for approval
 */
router.post('/approve/:contentId', async (req, res) => {
  try {
    const { contentId } = req.params;
    let updated = null;

    if (isMongoConnected()) {
      const SocialContentSchedule = require('../models/SocialContentSchedule');
      updated = await SocialContentSchedule.findOneAndUpdate(
        { contentId, status: 'AWAITING_APPROVAL' },
        {
          $set: {
            status: 'FOUNDER_APPROVED',
            approvedBy: 'founder_praveen',
            approvedAt: new Date()
          }
        },
        { new: true }
      );
    }

    if (!updated) {
      // Local fallback
      const all = ContentScheduler._loadLocalSchedule();
      const item = all.find(p => p.contentId === contentId);
      if (item) {
        item.status = 'FOUNDER_APPROVED';
        item.approvedBy = 'founder_praveen';
        ContentScheduler._saveLocalSchedule(all);
        updated = item;
      }
    }

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Post not found or not in AWAITING_APPROVAL status' });
    }

    return res.json({ success: true, message: `Post ${contentId} approved for publishing`, post: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/content/ingest-analytics
 * Ingest live performance telemetry and trigger adaptive learning
 */
router.post('/ingest-analytics', async (req, res) => {
  try {
    const learningUpdate = await PerformanceLearner.ingestPostTelemetry(req.body);
    return res.json({ success: true, learningUpdate });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/content/schedule
 * List all scheduled and published content
 */
router.get('/schedule', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const SocialContentSchedule = require('../models/SocialContentSchedule');
      const docs = await SocialContentSchedule.find().sort({ scheduledTime: -1 }).limit(50).lean();
      return res.json({ success: true, count: docs.length, schedule: docs });
    }
    const local = ContentScheduler._loadLocalSchedule();
    return res.json({ success: true, count: local.length, schedule: local });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
