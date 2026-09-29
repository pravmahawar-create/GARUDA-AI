/**
 * GARUDA Content Revenue Bridge
 * Connects the Autonomous Social Content Engine to the Revenue Hunter.
 * 
 * Detects legitimate inbound buying signals in comments, replies, and reactions
 * on published content and safely passes them into the Revenue Hunter pipeline.
 * 
 * Principle: Zero spamming of commenters. Only flag genuine commercial buyer intent.
 */

const LeadQualification = require('../leads/leadQualification');
const LeadNormalizer = require('../leads/leadNormalizer');
const LeadDeduplication = require('../leads/leadDeduplication');
const TruthVerifier = require('../outreach/truthVerifier');
const CloudSync = require('../persistence/cloudSync');
const { isMongoConnected } = require('../../src/database/db');

class ContentRevenueBridge {
  /**
   * Process a comment or reply on published social content.
   * @param {Object} rawComment
   * @param {string} rawComment.platform - LINKEDIN | FACEBOOK | INSTAGRAM | YOUTUBE
   * @param {string} rawComment.contentId - ID of the parent published post
   * @param {string} rawComment.commenterName
   * @param {string} rawComment.commenterUsername
   * @param {string} rawComment.commenterProfileUrl
   * @param {string} rawComment.commentText
   * @param {string} [rawComment.commentUrl]
   * @returns {Promise<Object>} { isBuyerIntent: boolean, lead: Object|null, reason: string }
   */
  static async evaluateComment(rawComment) {
    const text = rawComment.commentText || '';
    if (!text || text.trim().length < 5) {
      return { isBuyerIntent: false, lead: null, reason: 'COMMENT_EMPTY_OR_TRIVIAL' };
    }

    // 1. Evaluate intent through LeadQualification
    const qual = LeadQualification.qualify(text);
    if (!qual.qualified) {
      return {
        isBuyerIntent: false,
        lead: null,
        reason: `NOT_BUYER_INTENT: ${qual.summary || 'General appreciation, question, or noise'}`
      };
    }

    // 2. Normalize into canonical lead schema
    const rawLeadCandidate = {
      platform: rawComment.platform,
      sourceType: 'content_comment',
      profileUrl: rawComment.commenterProfileUrl || '',
      postUrl: rawComment.commentUrl || '',
      name: rawComment.commenterName || rawComment.commenterUsername || 'Social Commenter',
      username: rawComment.commenterUsername || '',
      company: '',
      location: '',
      requirement: text,
      category: qual.category,
      intentSignals: qual.intentSignals,
      qualificationScore: qual.confidence,
      evidence: {
        parentContentId: rawComment.contentId,
        commentText: text,
        timestamp: new Date().toISOString()
      },
      confidence: qual.confidence
    };

    const canonicalLead = LeadNormalizer.normalize(rawComment.platform, rawLeadCandidate, qual.intentSignals, {
      qualificationScore: qual.confidence,
      category: qual.category
    });

    // 3. Deduplication and Opt-Out Check
    const dedup = new LeadDeduplication();
    const identity = canonicalLead.profileUrl || canonicalLead.username || canonicalLead.leadId;
    if (dedup.isOptedOut(identity)) {
      return {
        isBuyerIntent: false,
        lead: null,
        reason: 'OPTED_OUT: Identity is in DO_NOT_CONTACT registry'
      };
    }
    if (dedup.isDuplicateLead(canonicalLead.platform, identity)) {
      return {
        isBuyerIntent: true,
        lead: canonicalLead,
        reason: 'DEDUPLICATED: Lead already recorded in index'
      };
    }

    // Register deduplication
    dedup.registerLead(canonicalLead);

    // 4. Truth verification on the requirement match
    const truthCheck = await TruthVerifier.verifyMessage(canonicalLead.requirement, canonicalLead);

    canonicalLead.status = 'CONTENT_LEAD_QUALIFIED';
    canonicalLead.qualificationScore = qual.confidence;

    // 5. Persist to MongoDB via CloudSync
    if (isMongoConnected()) {
      await CloudSync.syncLead(canonicalLead);
    }

    console.log(`[ContentRevenueBridge] 🎯 High-Intent Inbound Lead Captured from ${rawComment.platform} comment! Lead ID: ${canonicalLead.leadId} (Score: ${qual.confidence})`);

    return {
      isBuyerIntent: true,
      lead: canonicalLead,
      reason: `HIGH_INTENT_BUYER_SIGNAL_IDENTIFIED (${qual.category})`
    };
  }
}

module.exports = ContentRevenueBridge;
