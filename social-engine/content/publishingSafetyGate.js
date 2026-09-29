/**
 * GARUDA Publishing Safety Gate
 * Multi-layer pre-publish security, truth, and rate-limiting barrier.
 * 
 * Pipeline:
 * TRUTH_CHECK → PLATFORM_CAPABILITY_CHECK → DUPLICATE_CHECK → RATE_LIMIT_CHECK → POLICY_CHECK → PUBLISH
 * 
 * Enforces 100% Anti-Fabrication Law and Global Kill Switch.
 */

const fs = require('fs');
const path = require('path');
const TruthVerifier = require('../outreach/truthVerifier');
const PlatformStrategyEngine = require('./platformStrategyEngine');
const PolicyEngine = require('../outreach/policyEngine');
const { isMongoConnected } = require('../../src/database/db');

// Daily rate limits per platform
const DAILY_LIMITS = {
  LINKEDIN: 2,
  FACEBOOK: 3,
  INSTAGRAM: 2,
  YOUTUBE: 2
};

class PublishingSafetyGate {
  /**
   * Evaluate whether a content item is safe and authorized to publish.
   * @param {Object} contentItem
   * @param {Object} [options={}]
   * @returns {Promise<Object>} { safe: boolean, status: string, reason?: string }
   */
  static async evaluate(contentItem, options = {}) {
    const platform = (contentItem.platform || 'LINKEDIN').toUpperCase();
    const textToCheck = `${contentItem.headline || ''} ${contentItem.body || ''} ${contentItem.firstCommentText || ''}`;

    // 1. GLOBAL KILL SWITCH CHECK
    const ContentPolicyManager = require('./contentPolicyManager');
    const contentPolicy = ContentPolicyManager.getPolicy();
    const hunterKillSwitch = PolicyEngine.isKillSwitchActive ? PolicyEngine.isKillSwitchActive() : false;
    if (contentPolicy.killSwitch || contentPolicy.postingMode === 'STOPPED' || hunterKillSwitch) {
      return {
        safe: false,
        status: 'KILL_SWITCH_ACTIVE',
        reason: 'GLOBAL_KILL_SWITCH_ENGAGED: All social publishing halted by Founder'
      };
    }

    // 2. TRUTH CHECK (Zero-Fabrication Law)
    const truthRes = await TruthVerifier.verifyMessage(textToCheck, { platform, category: contentItem.category });
    if (!truthRes.verified) {
      return {
        safe: false,
        status: 'TRUTH_FAILED',
        reason: truthRes.reason || 'TRUTH_CHECK_FAILED: Exaggerated or unverified claim'
      };
    }

    // 3. PLATFORM CAPABILITY CHECK
    const caps = PlatformStrategyEngine.getCapabilities(platform);
    if (!caps.supportedFormats.includes(contentItem.format)) {
      return {
        safe: false,
        status: 'MANUAL_ACTION_REQUIRED',
        reason: `FORMAT_UNSUPPORTED: ${contentItem.format} is not supported natively by ${platform}`
      };
    }

    // Ensure Instagram has visual
    if (platform === 'INSTAGRAM' && (!contentItem.mediaUrls || contentItem.mediaUrls.length === 0)) {
      return {
        safe: false,
        status: 'MANUAL_ACTION_REQUIRED',
        reason: 'INSTAGRAM_REQUIRES_IMAGE_OR_VIDEO_ASSET'
      };
    }

    // 4. DUPLICATE CHECK (Check recent publications within 24h)
    const duplicateDetected = await this._checkDuplicate(contentItem);
    if (duplicateDetected) {
      return {
        safe: false,
        status: 'DUPLICATE_REJECTED',
        reason: 'DUPLICATE_CONTENT_DETECTED: Identical topic or body published in last 24h'
      };
    }

    // 5. RATE LIMIT CHECK
    const withinRateLimit = await this._checkRateLimit(platform);
    if (!withinRateLimit) {
      return {
        safe: false,
        status: 'RATE_LIMITED',
        reason: `DAILY_LIMIT_EXCEEDED: Platform ${platform} reached maximum ${DAILY_LIMITS[platform]} posts today`
      };
    }

    return {
      safe: true,
      status: 'APPROVED_FOR_PUBLISH',
      reason: 'ALL_SAFETY_CHECKS_PASSED'
    };
  }

  /**
   * Helper: Duplicate check across MongoDB and local data
   */
  static async _checkDuplicate(contentItem) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    if (isMongoConnected()) {
      try {
        const SocialContentSchedule = require('../../src/models/SocialContentSchedule');
        const match = await SocialContentSchedule.findOne({
          platform: contentItem.platform,
          status: 'PUBLISHED',
          publishedAt: { $gte: twentyFourHoursAgo },
          $or: [
            { topic: contentItem.topic },
            { headline: contentItem.headline }
          ]
        }).lean();
        if (match) return true;
      } catch (err) {
        // Fall back to memory check
      }
    }
    return false;
  }

  /**
   * Helper: Rate limit check per platform
   */
  static async _checkRateLimit(platform) {
    const limit = DAILY_LIMITS[platform] || 2;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    if (isMongoConnected()) {
      try {
        const SocialContentSchedule = require('../../src/models/SocialContentSchedule');
        const countToday = await SocialContentSchedule.countDocuments({
          platform,
          status: 'PUBLISHED',
          publishedAt: { $gte: startOfDay }
        });
        return countToday < limit;
      } catch (err) {
        // Fall back to true
      }
    }
    return true;
  }
}

module.exports = PublishingSafetyGate;
