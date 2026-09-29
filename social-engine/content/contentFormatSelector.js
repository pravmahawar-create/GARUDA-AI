/**
 * GARUDA Content Format Selector
 * Automatically determines the optimal visual/textual format per platform,
 * objective, topic, and asset availability.
 * 
 * Reuses existing Creative Engine assets when visuals materially enhance reach.
 */

const fs = require('fs');
const path = require('path');
const PlatformStrategyEngine = require('./platformStrategyEngine');

class ContentFormatSelector {
  /**
   * Select optimal format
   * @param {Object} params
   * @param {string} params.platform - LINKEDIN | FACEBOOK | INSTAGRAM | YOUTUBE
   * @param {string} params.objective - AWARENESS | AUTHORITY | EDUCATION | ENGAGEMENT | LEAD_GENERATION | TRAFFIC | CONVERSION
   * @param {string} params.topic
   * @param {string[]} [params.availableAssets=[]]
   * @param {Object} [params.historicalData=null]
   * @returns {Object} { format, mediaUrls, reason }
   */
  static selectFormat({ platform, objective, topic, availableAssets = [], historicalData = null }) {
    const plat = (platform || 'LINKEDIN').toUpperCase();
    const caps = PlatformStrategyEngine.getCapabilities(plat);

    let candidateFormat = 'TEXT';
    let mediaUrls = [...(availableAssets || [])];

    // 1. YouTube platform requirement
    if (plat === 'YOUTUBE') {
      const isShort = topic?.toLowerCase().includes('short') || objective === 'AWARENESS' || !availableAssets.some(a => a.endsWith('.mp4'));
      return {
        format: isShort ? 'SHORT' : 'SHORT_VIDEO',
        mediaUrls,
        reason: isShort ? 'YOUTUBE_SHORTS_OPTIMIZED_FOR_REACH' : 'YOUTUBE_STANDARD_VIDEO_ASSET'
      };
    }

    // 2. Instagram platform requirement (must have visual)
    if (plat === 'INSTAGRAM') {
      const hasVideo = mediaUrls.some(u => u.endsWith('.mp4'));
      if (hasVideo) {
        return { format: 'REEL', mediaUrls, reason: 'INSTAGRAM_VIDEO_REEL_FORMAT' };
      }
      const isMultiImage = mediaUrls.length > 1;
      return {
        format: isMultiImage ? 'CAROUSEL' : 'IMAGE',
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : this._findOrSelectCreativeVisual(topic),
        reason: isMultiImage ? 'INSTAGRAM_MULTI_IMAGE_CAROUSEL' : 'INSTAGRAM_STATIC_VISUAL'
      };
    }

    // 3. LinkedIn: Multi-page PDF or technical architecture image boosts dwell time
    if (plat === 'LINKEDIN') {
      if (['AUTHORITY', 'EDUCATION'].includes(objective)) {
        // High dwell time preference: CAROUSEL or IMAGE
        const creativeVisuals = mediaUrls.length > 0 ? mediaUrls : this._findOrSelectCreativeVisual(topic);
        return {
          format: creativeVisuals.some(u => u.endsWith('.pdf')) ? 'PDF_DOCUMENT' : 'IMAGE',
          mediaUrls: creativeVisuals,
          reason: 'LINKEDIN_AUTHORITY_DWELL_TIME_BOOST'
        };
      }
      if (objective === 'CONVERSION' || objective === 'LEAD_GENERATION') {
        const visuals = mediaUrls.length > 0 ? mediaUrls : this._findOrSelectCreativeVisual(topic);
        return {
          format: visuals.length > 0 ? 'IMAGE' : 'TEXT',
          mediaUrls: visuals,
          reason: 'LINKEDIN_LEAD_GEN_PROOF_ATTACHMENT'
        };
      }
      return {
        format: mediaUrls.length > 0 ? 'IMAGE' : 'TEXT',
        mediaUrls,
        reason: 'LINKEDIN_STANDARD_ENGAGEMENT'
      };
    }

    // 4. Facebook: Visual or conversational text
    if (plat === 'FACEBOOK') {
      if (mediaUrls.length > 0) {
        const hasVideo = mediaUrls.some(u => u.endsWith('.mp4'));
        return {
          format: hasVideo ? 'SHORT_VIDEO' : 'IMAGE',
          mediaUrls,
          reason: 'FACEBOOK_COMMUNITY_VISUAL'
        };
      }
      // Check if creative visual exists
      const creative = this._findOrSelectCreativeVisual(topic);
      return {
        format: creative.length > 0 ? 'IMAGE' : 'TEXT',
        mediaUrls: creative,
        reason: creative.length > 0 ? 'FACEBOOK_VISUAL_ATTACHED' : 'FACEBOOK_CONVERSATIONAL_TEXT'
      };
    }

    return {
      format: 'TEXT',
      mediaUrls: [],
      reason: 'DEFAULT_TEXT_FORMAT'
    };
  }

  /**
   * Helper: Locate existing relevant creative assets from data/creative-assets/ or output/
   */
  static _findOrSelectCreativeVisual(topic) {
    const searchDirs = [
      path.resolve(__dirname, '../../data/creative-assets'),
      path.resolve(__dirname, '../../output')
    ];

    for (const dir of searchDirs) {
      if (fs.existsSync(dir)) {
        try {
          const files = fs.readdirSync(dir);
          const images = files.filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
          if (images.length > 0) {
            // Find one matching topic if possible
            const topicKeyword = (topic || '').toLowerCase().split(' ')[0];
            const matched = images.find(img => img.toLowerCase().includes(topicKeyword)) || images[0];
            return [`/data/creative-assets/${matched}`];
          }
        } catch (e) {
          // ignore error
        }
      }
    }
    return [];
  }
}

module.exports = ContentFormatSelector;
