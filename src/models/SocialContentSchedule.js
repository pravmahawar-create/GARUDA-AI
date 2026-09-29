/**
 * GARUDA Social Content Schedule & Intelligence Model
 * Persistent cloud storage for scheduled posts, platform variants, 
 * performance analytics, and adaptive learning state.
 * Survives Render restarts and laptop power cycles.
 */

const mongoose = require('mongoose');

const socialContentScheduleSchema = new mongoose.Schema(
  {
    contentId: { type: String, required: true, unique: true, index: true },
    contentFamilyId: { type: String, required: true, index: true },
    topic: { type: String, required: true, index: true },
    category: { type: String, default: 'ARCHITECTURE', index: true },
    primaryObjective: {
      type: String,
      enum: [
        'AWARENESS',
        'AUTHORITY',
        'EDUCATION',
        'ENGAGEMENT',
        'LEAD_GENERATION',
        'PRODUCT_DISCOVERY',
        'TRAFFIC',
        'CONVERSION'
      ],
      default: 'AUTHORITY',
      index: true
    },
    sourceIdea: { type: String, required: true },
    platform: {
      type: String,
      enum: ['LINKEDIN', 'FACEBOOK', 'INSTAGRAM', 'YOUTUBE'],
      required: true,
      index: true
    },
    format: {
      type: String,
      enum: [
        'TEXT',
        'IMAGE',
        'CAROUSEL',
        'PDF_DOCUMENT',
        'SHORT_VIDEO',
        'LONG_VIDEO',
        'REEL',
        'SHORT',
        'THREAD'
      ],
      required: true
    },
    headline: { type: String, default: '' },
    body: { type: String, required: true },
    hashtags: [{ type: String }],
    mediaUrls: [{ type: String }],
    firstCommentText: { type: String, default: '' },
    cta: {
      text: { type: String, default: '' },
      type: { type: String, default: 'ENGAGEMENT' },
      targetUrl: { type: String, default: '' }
    },
    linkStrategy: {
      placement: {
        type: String,
        enum: ['BODY', 'FIRST_COMMENT', 'NO_LINK_BRAND_MENTION'],
        default: 'FIRST_COMMENT'
      },
      url: { type: String, default: '' },
      tested: { type: Boolean, default: false }
    },
    scheduledTime: { type: Date, required: true, index: true },
    timezone: { type: String, default: 'Asia/Kolkata' },
    peakWindow: {
      windowType: {
        type: String,
        enum: ['BEST_WINDOW', 'SECONDARY_WINDOW', 'AVOID_WINDOW'],
        default: 'BEST_WINDOW'
      },
      startHour: { type: Number, default: 9 },
      endHour: { type: Number, default: 11 },
      confidence: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH'],
        default: 'LOW'
      },
      basis: { type: String, default: 'CONSERVATIVE_DEFAULT' }
    },
    status: {
      type: String,
      enum: [
        'CONTENT_READY',
        'PLATFORM_SELECTED',
        'FORMAT_SELECTED',
        'SCHEDULED',
        'AWAITING_APPROVAL',
        'FOUNDER_APPROVED',
        'PUBLISHING',
        'PUBLISHED',
        'PUBLISH_FAILED',
        'MANUAL_ACTION_REQUIRED',
        'CANCELLED'
      ],
      default: 'CONTENT_READY',
      index: true
    },
    approvalRequired: { type: Boolean, default: false },
    approvedBy: { type: String, default: null },
    publishedAt: { type: Date, default: null },
    platformPostId: { type: String, default: null },
    platformPostUrl: { type: String, default: null },
    firstCommentPosted: { type: Boolean, default: false },
    failureReason: { type: String, default: null },
    analytics: {
      monitoredAt: { type: Date, default: null },
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      saves: { type: Number, default: 0 },
      watchTimeSeconds: { type: Number, default: 0 },
      retentionRate: { type: Number, default: 0 },
      engagementRate: { type: Number, default: 0 },
      leadsGenerated: { type: Number, default: 0 },
      rawTelemetry: { type: mongoose.Schema.Types.Mixed, default: {} }
    },
    experiment: {
      isExperiment: { type: Boolean, default: false },
      dimension: { type: String, default: null },
      variantGroup: { type: String, default: 'A' },
      hypothesis: { type: String, default: null }
    },
    auditLog: [
      {
        stage: { type: String },
        timestamp: { type: Date, default: Date.now },
        details: { type: mongoose.Schema.Types.Mixed }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Compound index for query performance on Render
socialContentScheduleSchema.index({ platform: 1, status: 1, scheduledTime: 1 });
socialContentScheduleSchema.index({ contentFamilyId: 1 });

module.exports = mongoose.models.SocialContentSchedule || mongoose.model('SocialContentSchedule', socialContentScheduleSchema);
