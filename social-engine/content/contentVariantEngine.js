/**
 * GARUDA Content Variant Engine
 * Adapts a single core idea into platform-native variants tailored for
 * LinkedIn, Facebook, Instagram, and YouTube.
 * 
 * Never copy-pastes generic text across channels.
 * Tracks contentFamilyId to maintain cross-platform lineage and analytics correlation.
 */

const crypto = require('crypto');
const PlatformStrategyEngine = require('./platformStrategyEngine');
const ContentFormatSelector = require('./contentFormatSelector');

class ContentVariantEngine {
  /**
   * Generate complete cross-platform variants for a campaign idea.
   * @param {Object} campaign
   * @param {string} campaign.idea - Core message, announcement, or insight
   * @param {string} campaign.topic - e.g. "Zero-Trust Agent Gateways"
   * @param {string} [campaign.primaryObjective='AUTHORITY']
   * @param {string[]} [campaign.platforms=['LINKEDIN', 'FACEBOOK', 'INSTAGRAM', 'YOUTUBE']]
   * @param {string} [campaign.targetUrl='https://www.garudaos.in']
   * @param {string[]} [campaign.candidateHashtags=[]]
   * @param {string[]} [campaign.availableAssets=[]]
   * @param {Object} [campaign.historicalData=null]
   * @returns {Object[]} Array of platform-native variant specifications
   */
  static generateVariants(campaign) {
    const contentFamilyId = campaign.contentFamilyId || `fam_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const topic = campaign.topic || 'Enterprise Autonomous AI Architecture';
    const objective = campaign.primaryObjective || 'AUTHORITY';
    const targetUrl = campaign.targetUrl || 'https://www.garudaos.in';
    const platforms = campaign.platforms || ['LINKEDIN', 'FACEBOOK', 'INSTAGRAM', 'YOUTUBE'];

    return platforms.map(platform => {
      const plat = platform.toUpperCase();
      const contentId = `cnt_${Date.now()}_${plat.toLowerCase()}_${crypto.randomBytes(2).toString('hex')}`;
      
      const linkStrategy = PlatformStrategyEngine.determineLinkStrategy(plat, objective, campaign.historicalData);
      const hashtags = PlatformStrategyEngine.selectHashtags(plat, topic, campaign.candidateHashtags, campaign.historicalData);
      const formatSelection = ContentFormatSelector.selectFormat({
        platform: plat,
        objective,
        topic,
        availableAssets: campaign.availableAssets,
        historicalData: campaign.historicalData
      });

      const copy = this._generatePlatformCopy({
        platform: plat,
        idea: campaign.idea,
        topic,
        objective,
        targetUrl,
        linkStrategy: linkStrategy.placement,
        hashtags,
        format: formatSelection.format
      });

      return {
        contentId,
        contentFamilyId,
        platform: plat,
        topic,
        primaryObjective: objective,
        sourceIdea: campaign.idea,
        format: formatSelection.format,
        mediaUrls: formatSelection.mediaUrls,
        headline: copy.headline,
        body: copy.body,
        hashtags,
        firstCommentText: copy.firstCommentText,
        cta: copy.cta,
        linkStrategy: {
          placement: linkStrategy.placement,
          url: targetUrl,
          tested: false
        },
        formatReason: formatSelection.reason,
        linkStrategyReason: linkStrategy.reason
      };
    });
  }

  /**
   * Platform-specific copy generator
   */
  static _generatePlatformCopy({ platform, idea, topic, objective, targetUrl, linkStrategy, hashtags, format }) {
    const tagsString = hashtags.join(' ');

    if (platform === 'LINKEDIN') {
      const headline = `Engineering Deep Dive: ${topic}`;
      let ctaText = 'What architecture patterns are you using to prevent multi-agent drift? Let’s discuss below.';
      let linkPrompt = '';

      if (linkStrategy === 'FIRST_COMMENT') {
        linkPrompt = '\n\n👉 Complete architectural documentation & benchmarks dropped in the first comment below.';
      } else if (linkStrategy === 'BODY') {
        linkPrompt = `\n\n👉 Review the live architecture: ${targetUrl}`;
      }

      const body = `${idea}\n\nKey architectural pillars:\n• Deterministic state machines with schema verification\n• Air-gapped tool execution via Model Context Protocol (MCP)\n• Sub-second reactive pipelines with zero probabilistic fallback${linkPrompt}\n\n${ctaText}\n\n${tagsString}`;
      
      return {
        headline,
        body: body.trim(),
        firstCommentText: linkStrategy === 'FIRST_COMMENT' ? `Architecture blueprints & verified specs: ${targetUrl}` : '',
        cta: { text: ctaText, type: 'DISCUSS_ARCHITECTURE', targetUrl: linkStrategy === 'BODY' ? targetUrl : '' }
      };
    }

    if (platform === 'FACEBOOK') {
      const headline = `Behind the Scenes: Building ${topic}`;
      let linkPrompt = '';
      if (linkStrategy === 'FIRST_COMMENT') {
        linkPrompt = '\n\n👉 Direct link is in the first comment!';
      } else if (linkStrategy === 'BODY') {
        linkPrompt = `\n\n👉 Learn more here: ${targetUrl}`;
      }

      const body = `Most systems break when scaled beyond prototype code. Here is how we engineered ${topic} to stay rock-solid 24/7:\n\n${idea}${linkPrompt}\n\nDrop a comment if you want a walkthrough of how this works in production!\n\n${tagsString}`;
      
      return {
        headline,
        body: body.trim(),
        firstCommentText: linkStrategy === 'FIRST_COMMENT' ? `Here is the full walkthrough link: ${targetUrl}` : '',
        cta: { text: 'Comment below for demo', type: 'COMMUNITY_CONVERSATION', targetUrl }
      };
    }

    if (platform === 'INSTAGRAM') {
      const headline = topic;
      const body = `${idea}\n\nSwipe through for the architecture breakdown ➡️\n\nSave this for your next engineering sprint.\n\n${tagsString}`;
      
      return {
        headline,
        body: body.trim(),
        firstCommentText: `Full platform documentation available at ${targetUrl} (link in bio).`,
        cta: { text: 'Save & share', type: 'SAVE_AND_SHARE', targetUrl: '' }
      };
    }

    if (platform === 'YOUTUBE') {
      const isShort = format === 'SHORT';
      const headline = isShort ? `${topic} in 60s #Shorts` : `Production Architecture: How We Built ${topic}`;
      const description = `${idea}\n\nTimestamps & Docs:\n• 00:00 Problem Breakdown\n• 00:30 Core Architecture\n• 00:50 Production Proof\n\nVerified platform portal: ${targetUrl}\n\n${tagsString}`;

      return {
        headline,
        body: description.trim(),
        firstCommentText: `Get the source blueprints and live verification at: ${targetUrl}`,
        cta: { text: 'Subscribe for deep-dive architecture', type: 'SUBSCRIBE', targetUrl }
      };
    }

    return {
      headline: topic,
      body: idea,
      firstCommentText: '',
      cta: { text: 'Learn more', type: 'LEARN_MORE', targetUrl }
    };
  }
}

module.exports = ContentVariantEngine;
