/**
 * GARUDA Conversation Scout
 * Analyzes multi-tier conversation graphs: Post -> Comments -> Replies.
 * Identifies secondary buyer intent (e.g. commenters stating "I also need this for my company").
 * Never confuses author with commenter; qualifies each candidate independently.
 */

const BaseScout = require('./baseScout');
const crypto = require('crypto');
const LeadQualification = require('../leads/leadQualification');

class ConversationScout extends BaseScout {
  constructor(options = {}) {
    super('Conversation-Scout', options);
  }

  /**
   * Parses a post and its associated comments & replies into discrete candidates
   * @param {object} threadData - { post, comments: [ { author, text, replies: [] } ] }
   * @returns {Array<object>} Raw candidate objects
   */
  extractFromThread(threadData) {
    const candidates = [];
    if (!threadData || !threadData.post) return candidates;

    const { post, comments = [] } = threadData;

    // 1. Evaluate primary post author
    if (post.text) {
      candidates.push({
        platform: post.platform || 'facebook',
        sourceType: 'post',
        name: post.authorName || 'Thread Author',
        username: post.authorUsername || 'author',
        profileUrl: post.authorProfileUrl || '',
        postUrl: post.postUrl || '',
        snippet: post.text,
        confidence: 85,
        evidence: {
          threadRole: 'POST_AUTHOR',
          postUrl: post.postUrl
        }
      });
    }

    // 2. Evaluate comment tree
    for (const comment of comments) {
      if (!comment.text) continue;

      // Check if comment exhibits independent buyer intent
      const qual = LeadQualification.qualify(comment.text);
      if (qual.qualified || qual.intentSignals.length > 0) {
        candidates.push({
          platform: comment.platform || post.platform || 'facebook',
          sourceType: 'comment',
          name: comment.authorName || 'Commenter',
          username: comment.authorUsername || 'commenter',
          profileUrl: comment.authorProfileUrl || '',
          postUrl: post.postUrl || '',
          snippet: comment.text,
          confidence: qual.confidence,
          evidence: {
            threadRole: 'COMMENTER',
            parentPostAuthor: post.authorName,
            commentSnippet: comment.text.slice(0, 150)
          }
        });
      }

      // 3. Evaluate replies to comments
      if (Array.isArray(comment.replies)) {
        for (const reply of comment.replies) {
          if (!reply.text) continue;
          const replyQual = LeadQualification.qualify(reply.text);
          if (replyQual.qualified || replyQual.intentSignals.length > 0) {
            candidates.push({
              platform: reply.platform || post.platform || 'facebook',
              sourceType: 'reply',
              name: reply.authorName || 'Reply Author',
              username: reply.authorUsername || 'replier',
              profileUrl: reply.authorProfileUrl || '',
              postUrl: post.postUrl || '',
              snippet: reply.text,
              confidence: replyQual.confidence,
              evidence: {
                threadRole: 'REPLIER',
                parentCommenter: comment.authorName,
                replySnippet: reply.text.slice(0, 150)
              }
            });
          }
        }
      }
    }

    return candidates;
  }

  /**
   * Default discovery hook for conversation scout
   */
  async discover() {
    // Demonstration thread parsing
    const sampleThread = {
      post: {
        platform: 'facebook',
        authorName: 'David Miller',
        authorUsername: 'david_m_biz',
        authorProfileUrl: 'https://facebook.com/david_m_biz',
        postUrl: 'https://facebook.com/posts/1029384756',
        text: 'Can anyone recommend an experienced agency to build an ecommerce portal for our retail brand? Budget is ready.'
      },
      comments: [
        {
          authorName: 'Sarah Jenkins',
          authorUsername: 'sarah_j_ops',
          authorProfileUrl: 'https://facebook.com/sarah_j_ops',
          text: 'Following this thread. We also need someone to develop a custom dashboard and inventory tracking system for our warehouse.',
          replies: []
        },
        {
          authorName: 'Spammy Agency',
          authorUsername: 'spam_agency',
          authorProfileUrl: 'https://facebook.com/spam_agency',
          text: 'We are the best web agency contact us today for cheap website discount!',
          replies: []
        }
      ]
    };

    return this.extractFromThread(sampleThread);
  }
}

module.exports = ConversationScout;
