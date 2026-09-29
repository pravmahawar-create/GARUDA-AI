/**
 * GARUDA Platform Intelligence Profile Model
 * Persistent store for platform audience active windows, format performance,
 * link placement performance, and confidence-weighted adaptive learning.
 */

const mongoose = require('mongoose');

const platformIntelligenceProfileSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      enum: ['LINKEDIN', 'FACEBOOK', 'INSTAGRAM', 'YOUTUBE'],
      required: true,
      unique: true,
      index: true
    },
    activeWindows: [
      {
        dayOfWeek: { type: Number, min: 0, max: 6 }, // 0=Sunday, 1=Monday...
        startHour: { type: Number, min: 0, max: 23 },
        endHour: { type: Number, min: 0, max: 23 },
        score: { type: Number, default: 0.5 }, // 0.0 - 1.0
        sampleCount: { type: Number, default: 0 },
        windowType: {
          type: String,
          enum: ['BEST_WINDOW', 'SECONDARY_WINDOW', 'AVOID_WINDOW'],
          default: 'BEST_WINDOW'
        }
      }
    ],
    historicalImpressionsAvg: { type: Number, default: 0 },
    historicalEngagementRateAvg: { type: Number, default: 0 },
    historicalWatchTimeAvg: { type: Number, default: 0 },
    formatPerformance: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    topicPerformance: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    linkPlacementPerformance: {
      BODY: { count: { type: Number, default: 0 }, avgImpressions: { type: Number, default: 0 }, avgClicks: { type: Number, default: 0 } },
      FIRST_COMMENT: { count: { type: Number, default: 0 }, avgImpressions: { type: Number, default: 0 }, avgClicks: { type: Number, default: 0 } },
      NO_LINK_BRAND_MENTION: { count: { type: Number, default: 0 }, avgImpressions: { type: Number, default: 0 }, avgClicks: { type: Number, default: 0 } }
    },
    hashtagCountPerformance: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    totalPostsAnalyzed: { type: Number, default: 0 },
    confidence: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'LOW'
    },
    lastLearnedAt: { type: Date, default: Date.now },
    notes: { type: String, default: '' }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.models.PlatformIntelligenceProfile || mongoose.model('PlatformIntelligenceProfile', platformIntelligenceProfileSchema);
