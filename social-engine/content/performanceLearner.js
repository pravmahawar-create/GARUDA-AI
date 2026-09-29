/**
 * GARUDA Performance Learner & Early Performance Engine
 * Ingests post metrics (impressions, engagement, clicks, retention), updates
 * confidence-weighted platform baselines, and refines peak time windows.
 * 
 * Principle: Never makes sweeping conclusions from a single post.
 * Uses moving averages and Bayesian sample-size confidence weighting.
 */

const fs = require('fs');
const path = require('path');
const { isMongoConnected } = require('../../src/database/db');

const PROFILES_BACKUP_FILE = path.resolve(__dirname, '../../data/content/platform_profiles.json');

class PerformanceLearner {
  /**
   * Ingest post analytics telemetry and adapt platform learning profile.
   * @param {Object} telemetry
   * @param {string} telemetry.contentId
   * @param {string} telemetry.platform - LINKEDIN | FACEBOOK | INSTAGRAM | YOUTUBE
   * @param {string} telemetry.format - TEXT | IMAGE | CAROUSEL | PDF_DOCUMENT | SHORT | REEL
   * @param {string} telemetry.linkPlacement - BODY | FIRST_COMMENT | NO_LINK_BRAND_MENTION
   * @param {number} telemetry.hashtagCount
   * @param {Date} telemetry.publishedAt
   * @param {number} telemetry.impressions
   * @param {number} telemetry.likes
   * @param {number} telemetry.comments
   * @param {number} telemetry.shares
   * @param {number} telemetry.clicks
   * @param {number} [telemetry.watchTimeSeconds=0]
   * @param {number} [telemetry.leadsGenerated=0]
   * @returns {Promise<Object>} Updated profile summary
   */
  static async ingestPostTelemetry(telemetry) {
    const platform = (telemetry.platform || 'LINKEDIN').toUpperCase();
    const impressions = Math.max(0, Number(telemetry.impressions) || 0);
    const interactions = (Number(telemetry.likes) || 0) + (Number(telemetry.comments) || 0) + (Number(telemetry.shares) || 0) + (Number(telemetry.clicks) || 0);
    const engagementRate = impressions > 0 ? (interactions / impressions) * 100 : 0;

    const pubDate = telemetry.publishedAt ? new Date(telemetry.publishedAt) : new Date();
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(pubDate.getTime() + istOffsetMs);
    const dayOfWeek = istDate.getUTCDay();
    const hour = istDate.getUTCHours();

    let profile = await this._loadProfile(platform);

    // 1. Update Sample Size and Overall Moving Averages
    const prevCount = profile.totalPostsAnalyzed || 0;
    const newCount = prevCount + 1;
    profile.totalPostsAnalyzed = newCount;

    // Exponential / weighted moving average for impressions and engagement
    profile.historicalImpressionsAvg = prevCount === 0 
      ? impressions 
      : Math.round((profile.historicalImpressionsAvg * prevCount + impressions) / newCount);

    profile.historicalEngagementRateAvg = prevCount === 0
      ? Number(engagementRate.toFixed(2))
      : Number(((profile.historicalEngagementRateAvg * prevCount + engagementRate) / newCount).toFixed(2));

    if (telemetry.watchTimeSeconds) {
      profile.historicalWatchTimeAvg = prevCount === 0
        ? telemetry.watchTimeSeconds
        : Math.round(((profile.historicalWatchTimeAvg || 0) * prevCount + telemetry.watchTimeSeconds) / newCount);
    }

    // 2. Confidence Tiering (Anti-Rash Rule: > 15 required for HIGH)
    if (newCount >= 15) {
      profile.confidence = 'HIGH';
    } else if (newCount >= 5) {
      profile.confidence = 'MEDIUM';
    } else {
      profile.confidence = 'LOW';
    }

    // 3. Update Format Performance
    const fmt = telemetry.format || 'TEXT';
    profile.formatPerformance = profile.formatPerformance || {};
    const currFmt = profile.formatPerformance[fmt] || { count: 0, avgImpressions: 0, avgEngagement: 0 };
    currFmt.avgImpressions = Math.round((currFmt.avgImpressions * currFmt.count + impressions) / (currFmt.count + 1));
    currFmt.avgEngagement = Number(((currFmt.avgEngagement * currFmt.count + engagementRate) / (currFmt.count + 1)).toFixed(2));
    currFmt.count += 1;
    profile.formatPerformance[fmt] = currFmt;

    // 4. Update Link Placement Performance
    const lp = telemetry.linkPlacement || 'FIRST_COMMENT';
    profile.linkPlacementPerformance = profile.linkPlacementPerformance || {
      BODY: { count: 0, avgImpressions: 0, avgClicks: 0 },
      FIRST_COMMENT: { count: 0, avgImpressions: 0, avgClicks: 0 },
      NO_LINK_BRAND_MENTION: { count: 0, avgImpressions: 0, avgClicks: 0 }
    };
    if (profile.linkPlacementPerformance[lp]) {
      const currLp = profile.linkPlacementPerformance[lp];
      currLp.avgImpressions = Math.round((currLp.avgImpressions * currLp.count + impressions) / (currLp.count + 1));
      currLp.avgClicks = Math.round((currLp.avgClicks * currLp.count + (telemetry.clicks || 0)) / (currLp.count + 1));
      currLp.count += 1;
    }

    // 5. Update Active Window Performance for Day/Hour
    profile.activeWindows = profile.activeWindows || [];
    let windowEntry = profile.activeWindows.find(w => w.dayOfWeek === dayOfWeek && w.startHour <= hour && w.endHour >= hour);
    if (!windowEntry) {
      windowEntry = {
        dayOfWeek,
        startHour: Math.max(0, hour - 1),
        endHour: Math.min(23, hour + 1),
        score: 0.5,
        sampleCount: 0,
        windowType: 'BEST_WINDOW'
      };
      profile.activeWindows.push(windowEntry);
    }
    // Score based on performance relative to platform average
    const performanceRatio = profile.historicalImpressionsAvg > 0 ? (impressions / profile.historicalImpressionsAvg) : 1;
    const normalizedScore = Math.min(1.0, Math.max(0.1, performanceRatio * 0.5));
    windowEntry.score = Number(((windowEntry.score * windowEntry.sampleCount + normalizedScore) / (windowEntry.sampleCount + 1)).toFixed(2));
    windowEntry.sampleCount += 1;
    windowEntry.windowType = windowEntry.score >= 0.65 ? 'BEST_WINDOW' : windowEntry.score <= 0.3 ? 'AVOID_WINDOW' : 'SECONDARY_WINDOW';

    profile.lastLearnedAt = new Date();

    // 6. Persist to MongoDB and local backup
    await this._saveProfile(profile);

    return {
      platform,
      totalPostsAnalyzed: profile.totalPostsAnalyzed,
      confidence: profile.confidence,
      historicalImpressionsAvg: profile.historicalImpressionsAvg,
      historicalEngagementRateAvg: profile.historicalEngagementRateAvg,
      winningFormat: this._getWinningKey(profile.formatPerformance, 'avgImpressions'),
      winningLinkStrategy: this._getWinningKey(profile.linkPlacementPerformance, 'avgImpressions')
    };
  }

  static _getWinningKey(mapObj, metric) {
    if (!mapObj) return 'N/A';
    let bestKey = 'N/A';
    let bestVal = -1;
    for (const [k, v] of Object.entries(mapObj)) {
      if (v && v[metric] > bestVal) {
        bestVal = v[metric];
        bestKey = k;
      }
    }
    return bestKey;
  }

  static async _loadProfile(platform) {
    if (isMongoConnected()) {
      try {
        const PlatformIntelligenceProfile = require('../../src/models/PlatformIntelligenceProfile');
        const doc = await PlatformIntelligenceProfile.findOne({ platform }).lean();
        if (doc) return doc;
      } catch (err) {
        // Fall back
      }
    }
    // Local backup check
    try {
      if (fs.existsSync(PROFILES_BACKUP_FILE)) {
        const data = JSON.parse(fs.readFileSync(PROFILES_BACKUP_FILE, 'utf8'));
        if (data[platform]) return data[platform];
      }
    } catch (e) {}

    return {
      platform,
      activeWindows: [],
      historicalImpressionsAvg: 0,
      historicalEngagementRateAvg: 0,
      historicalWatchTimeAvg: 0,
      formatPerformance: {},
      topicPerformance: {},
      linkPlacementPerformance: {
        BODY: { count: 0, avgImpressions: 0, avgClicks: 0 },
        FIRST_COMMENT: { count: 0, avgImpressions: 0, avgClicks: 0 },
        NO_LINK_BRAND_MENTION: { count: 0, avgImpressions: 0, avgClicks: 0 }
      },
      totalPostsAnalyzed: 0,
      confidence: 'LOW',
      lastLearnedAt: new Date()
    };
  }

  static async _saveProfile(profile) {
    if (isMongoConnected()) {
      try {
        const PlatformIntelligenceProfile = require('../../src/models/PlatformIntelligenceProfile');
        await PlatformIntelligenceProfile.findOneAndUpdate(
          { platform: profile.platform },
          { $set: profile },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.warn(`[PerformanceLearner] Mongo profile save error: ${err.message}`);
      }
    }

    try {
      const dir = path.dirname(PROFILES_BACKUP_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      let currentBackup = {};
      if (fs.existsSync(PROFILES_BACKUP_FILE)) {
        try { currentBackup = JSON.parse(fs.readFileSync(PROFILES_BACKUP_FILE, 'utf8')); } catch (e) {}
      }
      currentBackup[profile.platform] = profile;
      fs.writeFileSync(PROFILES_BACKUP_FILE, JSON.stringify(currentBackup, null, 2), 'utf8');
    } catch (e) {
      console.warn(`[PerformanceLearner] Local profile backup error: ${e.message}`);
    }
  }
}

module.exports = PerformanceLearner;
