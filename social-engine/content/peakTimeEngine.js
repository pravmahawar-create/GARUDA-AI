/**
 * GARUDA Peak-Time Intelligence Engine
 * Dynamically computes optimal scheduling windows per platform based on
 * real platform telemetry, audience-online reports, and historical post performance.
 * 
 * Never assumes a fixed universal "best time". Employs confidence-weighted learning
 * with conservative defaults for cold starts.
 */

const { isMongoConnected } = require('../../src/database/db');

// Conservative default operational windows (used ONLY when historical samples < 3)
const CONSERVATIVE_DEFAULTS = {
  LINKEDIN: {
    best: { startHour: 9, endHour: 11, basis: 'CONSERVATIVE_B2B_OPEN' },
    secondary: { startHour: 14, endHour: 16, basis: 'CONSERVATIVE_B2B_MIDDAY' },
    avoid: { startHour: 22, endHour: 6, basis: 'CONSERVATIVE_OVERNIGHT_LOW_B2B' }
  },
  FACEBOOK: {
    best: { startHour: 13, endHour: 15, basis: 'CONSERVATIVE_COMMUNITY_LUNCH' },
    secondary: { startHour: 19, endHour: 21, basis: 'CONSERVATIVE_COMMUNITY_EVENING' },
    avoid: { startHour: 1, endHour: 7, basis: 'CONSERVATIVE_OVERNIGHT' }
  },
  INSTAGRAM: {
    best: { startHour: 11, endHour: 13, basis: 'CONSERVATIVE_MOBILE_MIDDAY' },
    secondary: { startHour: 18, endHour: 20, basis: 'CONSERVATIVE_MOBILE_EVENING' },
    avoid: { startHour: 2, endHour: 8, basis: 'CONSERVATIVE_SLEEP_WINDOW' }
  },
  YOUTUBE: {
    best: { startHour: 15, endHour: 18, basis: 'CONSERVATIVE_AFTERNOON_INDEXING' },
    secondary: { startHour: 19, endHour: 21, basis: 'CONSERVATIVE_EVENING_VIEWING' },
    avoid: { startHour: 0, endHour: 9, basis: 'CONSERVATIVE_LOW_ACTIVITY' }
  }
};

class PeakTimeEngine {
  /**
   * Calculate best, secondary, and avoid windows for a platform on a given date.
   * @param {string} platform - LINKEDIN | FACEBOOK | INSTAGRAM | YOUTUBE
   * @param {Date} [targetDate=new Date()]
   * @param {Object} [liveTelemetry=null] - Optional external telemetry (e.g. YouTube viewers report)
   * @returns {Promise<Object>}
   */
  static async calculateWindows(platform, targetDate = new Date(), liveTelemetry = null) {
    const plat = (platform || 'LINKEDIN').toUpperCase();
    const defaults = CONSERVATIVE_DEFAULTS[plat] || CONSERVATIVE_DEFAULTS.LINKEDIN;
    
    // Check if we have learned platform profiles in MongoDB
    let profile = null;
    if (isMongoConnected()) {
      try {
        const PlatformIntelligenceProfile = require('../../src/models/PlatformIntelligenceProfile');
        profile = await PlatformIntelligenceProfile.findOne({ platform: plat }).lean();
      } catch (err) {
        // Fall back gracefully to memory/defaults
      }
    }

    // Determine day of week in Indian Standard Time (IST: UTC+5:30)
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(targetDate.getTime() + istOffsetMs);
    const dayOfWeek = istDate.getUTCDay(); // 0=Sun, 1=Mon...

    // 1. YouTube specific: If live viewer-online report is supplied, use it
    if (plat === 'YOUTUBE' && liveTelemetry?.viewerActivityByHour) {
      return this._computeFromHourlyHistogram(plat, liveTelemetry.viewerActivityByHour, 'YOUTUBE_STUDIO_VIEWERS_REPORT');
    }

    // 2. If profile exists with sufficient sample size (>= 3 posts analyzed)
    if (profile && profile.totalPostsAnalyzed >= 3 && Array.isArray(profile.activeWindows) && profile.activeWindows.length > 0) {
      const dayWindows = profile.activeWindows.filter(w => w.dayOfWeek === dayOfWeek);
      if (dayWindows.length > 0) {
        const sorted = [...dayWindows].sort((a, b) => (b.score || 0) - (a.score || 0));
        const best = sorted[0];
        const secondary = sorted.length > 1 ? sorted[1] : null;
        const avoid = sorted[sorted.length - 1];

        const confidence = profile.totalPostsAnalyzed >= 15 ? 'HIGH' : profile.totalPostsAnalyzed >= 5 ? 'MEDIUM' : 'LOW';

        return {
          platform: plat,
          dayOfWeek,
          confidence,
          bestWindow: {
            startHour: best.startHour,
            endHour: best.endHour,
            score: best.score,
            confidence,
            basis: `LEARNED_HISTORICAL_DATA (${profile.totalPostsAnalyzed} posts analyzed)`
          },
          secondaryWindow: secondary ? {
            startHour: secondary.startHour,
            endHour: secondary.endHour,
            score: secondary.score,
            confidence,
            basis: 'LEARNED_HISTORICAL_SECONDARY'
          } : {
            startHour: defaults.secondary.startHour,
            endHour: defaults.secondary.endHour,
            confidence: 'LOW',
            basis: defaults.secondary.basis
          },
          avoidWindow: (avoid && avoid.score < 0.3) ? {
            startHour: avoid.startHour,
            endHour: avoid.endHour,
            basis: 'LEARNED_HISTORICAL_LOW_CONVERSION'
          } : {
            startHour: defaults.avoid.startHour,
            endHour: defaults.avoid.endHour,
            basis: defaults.avoid.basis
          }
        };
      }
    }

    // 3. Fallback: Conservative default with explicit LOW confidence
    return {
      platform: plat,
      dayOfWeek,
      confidence: 'LOW',
      bestWindow: {
        startHour: defaults.best.startHour,
        endHour: defaults.best.endHour,
        score: 0.5,
        confidence: 'LOW',
        basis: `${defaults.best.basis} (COLD_START_FALLBACK)`
      },
      secondaryWindow: {
        startHour: defaults.secondary.startHour,
        endHour: defaults.secondary.endHour,
        score: 0.35,
        confidence: 'LOW',
        basis: `${defaults.secondary.basis} (COLD_START_FALLBACK)`
      },
      avoidWindow: {
        startHour: defaults.avoid.startHour,
        endHour: defaults.avoid.endHour,
        basis: `${defaults.avoid.basis} (COLD_START_FALLBACK)`
      }
    };
  }

  /**
   * Helper: compute optimal slots from an hourly histogram (e.g. YouTube studio data)
   */
  static _computeFromHourlyHistogram(platform, hourlyMap, basisTag) {
    const hours = Object.entries(hourlyMap).map(([h, val]) => ({ hour: parseInt(h, 10), val: Number(val) }));
    hours.sort((a, b) => b.val - a.val);

    const peak = hours[0] || { hour: 16, val: 100 };
    const second = hours[1] || { hour: 19, val: 80 };
    const low = hours[hours.length - 1] || { hour: 3, val: 5 };

    return {
      platform,
      confidence: 'HIGH',
      bestWindow: {
        startHour: Math.max(0, peak.hour - 1),
        endHour: Math.min(23, peak.hour + 1),
        score: 0.95,
        confidence: 'HIGH',
        basis: basisTag
      },
      secondaryWindow: {
        startHour: Math.max(0, second.hour - 1),
        endHour: Math.min(23, second.hour + 1),
        score: 0.75,
        confidence: 'HIGH',
        basis: `${basisTag}_SECONDARY`
      },
      avoidWindow: {
        startHour: Math.max(0, low.hour - 2),
        endHour: Math.min(23, low.hour + 2),
        basis: `${basisTag}_MINIMUM_ACTIVITY`
      }
    };
  }

  /**
   * Get next upcoming schedule Date within the best window.
   * Ensures the scheduled time is always in the future (minimum +15m buffer).
   * @param {Object} windowCalc - output from calculateWindows
   * @param {Date} [fromTime=new Date()]
   * @returns {Date}
   */
  static getNextOptimalScheduleDate(windowCalc, fromTime = new Date()) {
    const now = new Date(fromTime);
    // Convert to IST representation for hour comparison
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const nowIst = new Date(now.getTime() + istOffsetMs);
    const currentIstHour = nowIst.getUTCHours();
    const currentIstMinute = nowIst.getUTCMinutes();

    const targetHour = windowCalc.bestWindow.startHour;
    
    const scheduledIst = new Date(nowIst);
    scheduledIst.setUTCHours(targetHour, 15, 0, 0); // 15 minutes past the start hour

    // If the scheduled slot is already in the past or within a 15-minute buffer, advance to next day
    if (scheduledIst.getTime() <= nowIst.getTime() + 15 * 60 * 1000) {
      scheduledIst.setUTCDate(scheduledIst.getUTCDate() + 1);
    }

    // Convert back from IST representation to real UTC Date
    return new Date(scheduledIst.getTime() - istOffsetMs);
  }
}

module.exports = PeakTimeEngine;
