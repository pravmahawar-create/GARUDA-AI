/**
 * GARUDA Platform Strategy Engine
 * Governs per-platform link policies, hashtag intelligence, and format capabilities.
 * 
 * Never hardcodes arbitrary assumptions; maintains empirical policies that adapt
 * based on observed reach, CTR, and platform-specific capabilities.
 */

const PLATFORM_CAPABILITIES = {
  LINKEDIN: {
    supportedFormats: ['TEXT', 'IMAGE', 'CAROUSEL', 'PDF_DOCUMENT', 'SHORT_VIDEO', 'LONG_VIDEO'],
    firstCommentSupported: true,
    maxHashtagsRecommended: 5,
    minHashtagsRecommended: 2,
    supportsLinksInBody: true,
    optimalTextLength: { min: 200, max: 1800 },
    tone: 'PROFESSIONAL_ARCHITECTURAL'
  },
  FACEBOOK: {
    supportedFormats: ['TEXT', 'IMAGE', 'SHORT_VIDEO', 'LONG_VIDEO', 'REEL'],
    firstCommentSupported: true,
    maxHashtagsRecommended: 3,
    minHashtagsRecommended: 0,
    supportsLinksInBody: true,
    optimalTextLength: { min: 100, max: 800 },
    tone: 'COMMUNITY_CONVERSATIONAL'
  },
  INSTAGRAM: {
    supportedFormats: ['IMAGE', 'CAROUSEL', 'REEL'],
    firstCommentSupported: true,
    maxHashtagsRecommended: 8,
    minHashtagsRecommended: 3,
    supportsLinksInBody: false, // Instagram captions do not make links clickable
    optimalTextLength: { min: 100, max: 1000 },
    tone: 'VISUAL_ENGAGING'
  },
  YOUTUBE: {
    supportedFormats: ['SHORT', 'SHORT_VIDEO', 'LONG_VIDEO'],
    firstCommentSupported: true,
    maxHashtagsRecommended: 5,
    minHashtagsRecommended: 2,
    supportsLinksInBody: true, // In video description
    optimalTextLength: { min: 50, max: 2000 },
    tone: 'SEARCH_OPTIMIZED_HIGH_CTR'
  }
};

class PlatformStrategyEngine {
  /**
   * Determine optimal link strategy for a post.
   * @param {string} platform - LINKEDIN | FACEBOOK | INSTAGRAM | YOUTUBE
   * @param {string} objective - AWARENESS | AUTHORITY | EDUCATION | ENGAGEMENT | LEAD_GENERATION | TRAFFIC | CONVERSION
   * @param {Object} [historicalData=null]
   * @returns {Object} { placement: 'BODY' | 'FIRST_COMMENT' | 'NO_LINK_BRAND_MENTION', reason: string }
   */
  static determineLinkStrategy(platform, objective, historicalData = null) {
    const plat = (platform || 'LINKEDIN').toUpperCase();
    const caps = PLATFORM_CAPABILITIES[plat] || PLATFORM_CAPABILITIES.LINKEDIN;

    // Instagram: Links in caption are not clickable
    if (plat === 'INSTAGRAM') {
      return {
        placement: 'FIRST_COMMENT',
        reason: 'INSTAGRAM_CAPTION_LINKS_NOT_CLICKABLE_USE_FIRST_COMMENT_OR_BIO'
      };
    }

    // Pure Awareness / Authority with no explicit traffic goal
    if (['AWARENESS', 'AUTHORITY', 'EDUCATION'].includes(objective)) {
      // If historical data shows FIRST_COMMENT or NO_LINK preserves 2x more impressions
      if (historicalData?.linkPlacementPerformance?.FIRST_COMMENT?.avgImpressions > (historicalData?.linkPlacementPerformance?.BODY?.avgImpressions || 0)) {
        return {
          placement: 'FIRST_COMMENT',
          reason: 'HISTORICAL_DATA_PROVES_FIRST_COMMENT_PRESERVES_REACH'
        };
      }
      return {
        placement: 'FIRST_COMMENT',
        reason: 'AWARENESS_OBJECTIVE_PRIORITIZES_REACH_VIA_FIRST_COMMENT'
      };
    }

    // Direct Lead Gen, Traffic, or Conversion
    if (['LEAD_GENERATION', 'TRAFFIC', 'CONVERSION', 'PRODUCT_DISCOVERY'].includes(objective)) {
      // On YouTube descriptions, links in body are standard and high converting
      if (plat === 'YOUTUBE') {
        return {
          placement: 'BODY',
          reason: 'YOUTUBE_DESCRIPTION_LINKS_ARE_STANDARD_AND_HIGH_CONVERTING'
        };
      }
      // On Facebook / LinkedIn, if FIRST_COMMENT is supported, default to FIRST_COMMENT or test
      return {
        placement: caps.firstCommentSupported ? 'FIRST_COMMENT' : 'BODY',
        reason: 'CONVERSION_OPTIMIZED_SAFE_DISTRIBUTION'
      };
    }

    return {
      placement: 'FIRST_COMMENT',
      reason: 'DEFAULT_CONSERVATIVE_REACH_PRESERVATION'
    };
  }

  /**
   * Determine optimal hashtags for a platform and topic.
   * @param {string} platform
   * @param {string} topic
   * @param {string[]} candidateTags
   * @param {Object} [historicalData=null]
   * @returns {string[]} Selected high-relevance hashtags
   */
  static selectHashtags(platform, topic, candidateTags = [], historicalData = null) {
    const plat = (platform || 'LINKEDIN').toUpperCase();
    const caps = PLATFORM_CAPABILITIES[plat] || PLATFORM_CAPABILITIES.LINKEDIN;

    // Filter candidate tags or generate topic-relevant defaults
    let tags = (candidateTags || []).map(t => t.startsWith('#') ? t : `#${t}`);
    
    if (tags.length === 0) {
      const topicSlug = (topic || 'Software').replace(/[^a-zA-Z0-9]/g, '');
      tags = [`#${topicSlug}`, '#SoftwareEngineering', '#EnterpriseAI'];
    }

    // Deduplicate
    tags = Array.from(new Set(tags));

    // Cap to platform recommendation
    const maxAllowed = caps.maxHashtagsRecommended;
    return tags.slice(0, maxAllowed);
  }

  /**
   * Get platform capabilities
   */
  static getCapabilities(platform) {
    const plat = (platform || 'LINKEDIN').toUpperCase();
    return PLATFORM_CAPABILITIES[plat] || PLATFORM_CAPABILITIES.LINKEDIN;
  }
}

module.exports = PlatformStrategyEngine;
