/**
 * GARUDA Follow-Up Engine
 * Manages polite, policy-controlled follow-ups with strict limits.
 * Principle: Zero spam, zero harassment. Max 1 follow-up, never if opted out.
 */

const LeadDeduplication = require('../leads/leadDeduplication');
const OutreachPolicyEngine = require('./policyEngine');

class FollowUpEngine {
  constructor(options = {}) {
    this.options = options;
    this.dedup = new LeadDeduplication(options.dedupFile);
    this.policy = new OutreachPolicyEngine(options);
    this.cooldownHours = options.cooldownHours || 72; // Default 3 days
    this.maxFollowUps = options.maxFollowUps || 1; // Strict maximum 1 follow-up
  }

  /**
   * Determine whether a lead is eligible for a follow-up
   * @param {object} leadRecord - Lead with outreach history
   * @returns {{ eligible: boolean, reason: string }}
   */
  evaluateEligibility(leadRecord) {
    if (!leadRecord) {
      return { eligible: false, reason: 'INVALID_RECORD' };
    }

    const identity = leadRecord.profileUrl || leadRecord.username || leadRecord.leadId;

    // 1. Opt-out check
    if (this.dedup.isOptedOut(identity)) {
      return { eligible: false, reason: 'OPTED_OUT: Identity is in DO_NOT_CONTACT registry.' };
    }

    // 2. Initial message check
    if (leadRecord.outreachStatus !== 'SENT') {
      return { eligible: false, reason: 'INITIAL_MESSAGE_NOT_SENT: Lead was never contacted.' };
    }

    // 3. Response check
    if (['INTERESTED', 'REPLIED', 'NOT_INTERESTED', 'OPT_OUT'].includes(leadRecord.responseStatus)) {
      return { eligible: false, reason: `ALREADY_RESPONDED: Status is ${leadRecord.responseStatus}.` };
    }

    // 4. Follow-up count limit check
    const currentFollowUps = leadRecord.followUpCount || 0;
    if (currentFollowUps >= this.maxFollowUps) {
      return { eligible: false, reason: `MAX_FOLLOWUPS_EXCEEDED: Already reached limit of ${this.maxFollowUps}.` };
    }

    // 5. Cooldown check
    const dispatchedAt = new Date(leadRecord.dispatchedAt || 0).getTime();
    const now = Date.now();
    const elapsedHours = (now - dispatchedAt) / (1000 * 60 * 60);

    if (elapsedHours < this.cooldownHours) {
      return {
        eligible: false,
        reason: `COOLDOWN_ACTIVE: ${Math.round(this.cooldownHours - elapsedHours)} hours remaining in cooldown window.`
      };
    }

    // 6. Policy engine check
    const policyResult = this.policy.evaluate({
      platform: leadRecord.platform,
      action: 'FOLLOW_UP',
      lead: leadRecord
    });

    if (!policyResult.allowed) {
      return { eligible: false, reason: `POLICY_DENIED: ${policyResult.reason}` };
    }

    return {
      eligible: true,
      reason: 'ELIGIBLE_FOR_SINGLE_POLITE_FOLLOW_UP'
    };
  }

  /**
   * Generates a context-aware, non-aggressive follow-up draft
   * @param {object} leadRecord
   * @returns {string}
   */
  generateFollowUpPitch(leadRecord) {
    const name = leadRecord.name && leadRecord.name !== 'UNKNOWN' ? leadRecord.name.split(' ')[0] : 'there';
    return `Hi ${name}, following up gently in case you're still looking for help with your ${leadRecord.category || 'software'} project. If you've already found a solution, no worries at all and wish you the best!`;
  }
}

module.exports = FollowUpEngine;
