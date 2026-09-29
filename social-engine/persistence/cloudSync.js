/**
 * GARUDA Cloud Sync Service
 * Mirrors leads, outreach status, and metrics into MongoDB on Render Cloud.
 * Fully decoupled from local files: if MongoDB is available, persists to DB; otherwise falls back gracefully.
 */

const { isMongoConnected } = require('../../src/database/db');

class CloudSync {
  /**
   * Persist or update a canonical lead in MongoDB
   */
  static async syncLead(lead) {
    if (!isMongoConnected()) return null;
    try {
      const SocialRevenueLead = require('../../src/models/SocialRevenueLead');
      return await SocialRevenueLead.findOneAndUpdate(
        { leadId: lead.leadId },
        {
          $set: {
            platform: lead.platform,
            sourceType: lead.sourceType,
            profileUrl: lead.profileUrl,
            postUrl: lead.postUrl,
            name: lead.name,
            username: lead.username,
            company: lead.company,
            location: lead.location,
            category: lead.category || 'GENERAL_SOFTWARE',
            requirement: lead.requirement,
            intentSignals: lead.intentSignals,
            evidence: lead.evidence,
            confidence: lead.confidence,
            qualificationScore: lead.qualificationScore,
            status: lead.status || 'QUALIFIED',
            outreachStatus: lead.outreachStatus || 'NONE',
            responseStatus: lead.responseStatus || 'NONE',
            lastSeenAt: new Date()
          },
          $setOnInsert: {
            discoveredAt: lead.discoveredAt ? new Date(lead.discoveredAt) : new Date()
          }
        },
        { upsert: true, new: true }
      );
    } catch (err) {
      console.warn(`[CloudSync] MongoDB lead sync error: ${err.message}`);
      return null;
    }
  }

  /**
   * Sync queue outreach status and evidence to MongoDB
   */
  static async syncOutreach(queueItem) {
    if (!isMongoConnected()) return null;
    try {
      const SocialRevenueLead = require('../../src/models/SocialRevenueLead');
      const leadId = queueItem.lead?.leadId || queueItem.queueId;
      return await SocialRevenueLead.findOneAndUpdate(
        { leadId },
        {
          $set: {
            outreachStatus: queueItem.status,
            pitch: queueItem.pitch,
            messageHash: queueItem.messageHash,
            deliveryEvidence: queueItem.deliveryEvidence,
            dispatchedAt: queueItem.dispatchedAt ? new Date(queueItem.dispatchedAt) : null
          }
        },
        { new: true }
      );
    } catch (err) {
      console.warn(`[CloudSync] MongoDB outreach sync error: ${err.message}`);
      return null;
    }
  }
}

module.exports = CloudSync;
