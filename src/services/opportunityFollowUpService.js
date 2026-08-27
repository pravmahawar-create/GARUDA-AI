const crypto = require("crypto");
const mongoose = require("mongoose");
const outboundCommunicationService = require("./outboundCommunicationService");
const { DiscoveryCandidate } = require("../models/DiscoveryCandidate");

/**
 * GARUDA Opportunity Follow-Up, Timeout & Learning Loop Engine
 * Enforces governed follow-up cadences, timeout transitions (UNRESPONSIVE, EXPIRED),
 * and feeds rejection feedback into discovery scoring.
 */
class OpportunityFollowUpService {
  static inMemoryFollowUps = new Map();
  static learningStore = [];

  /**
   * Evaluates whether a follow-up is due for an opportunity.
   */
  evaluateFollowUp(candidate = {}, now = new Date()) {
    const status = candidate.status || "AWAITING_RESPONSE";
    if (status !== "AWAITING_RESPONSE" && status !== "OUTREACH_SENT") {
      return { isDue: false, reason: "Opportunity is not awaiting response" };
    }

    const lastOutreachAt = candidate.lastOutreachAt ? new Date(candidate.lastOutreachAt) : new Date(candidate.updatedAt || now);
    const followUpCount = candidate.followUpCount || 0;

    if (followUpCount >= 2) {
      return { isDue: false, isTimeout: true, targetState: "UNRESPONSIVE", reason: "Max follow-ups (2) reached without response" };
    }

    const daysElapsed = (now.getTime() - lastOutreachAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysElapsed >= 14) {
      return { isDue: false, isTimeout: true, targetState: "UNRESPONSIVE", reason: "14-day response timeout reached" };
    }

    if (daysElapsed >= 3) {
      return { isDue: true, isTimeout: false, targetState: "FOLLOW_UP_DUE", followUpNumber: followUpCount + 1 };
    }

    return { isDue: false, isTimeout: false, reason: `Cadence wait period active (${daysElapsed.toFixed(1)} days elapsed, 3 required)` };
  }

  /**
   * Schedules or drafts a governed follow-up for an opportunity.
   */
  async draftFollowUp(candidate = {}, options = {}) {
    const evalRes = this.evaluateFollowUp(candidate);
    if (!evalRes.isDue) {
      if (evalRes.isTimeout) {
        return await this.transitionTerminalState(candidate.externalId || candidate.id, evalRes.targetState, evalRes.reason);
      }
      return { scheduled: false, reason: evalRes.reason };
    }

    const recipient = candidate.contactEmail || candidate.recipient || `applications@${(candidate.company || "company").toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;
    const followUpBody = `Follow-Up #${evalRes.followUpNumber} regarding opportunity "${candidate.title || "Technical Scope"}" for ${candidate.company || "Client"}.\n` +
      `GARUDA AI OS remains available to execute structured deliverables. Please let us know if you would like to proceed.`;

    const draft = await outboundCommunicationService.draftCommunication(
      {
        recipient,
        channel: "email",
        subject: `Follow-Up: Commercial Proposal for ${candidate.title || "Technical Opportunity"}`,
        body: followUpBody,
        opportunityId: candidate.externalId || candidate.id,
        evidence: { followUpNumber: evalRes.followUpNumber }
      },
      { founderApproved: false }
    );

    const record = {
      opportunityId: candidate.externalId || candidate.id,
      followUpNumber: evalRes.followUpNumber,
      draftedCommunicationId: draft.communicationId,
      status: "APPROVAL_REQUIRED",
      createdAt: new Date()
    };

    OpportunityFollowUpService.inMemoryFollowUps.set(record.opportunityId, record);

    return {
      scheduled: true,
      followUpNumber: evalRes.followUpNumber,
      draftedCommunication: draft,
      status: "APPROVAL_REQUIRED"
    };
  }

  /**
   * Transitions an opportunity to a truthful terminal state.
   */
  async transitionTerminalState(opportunityId, targetState, reason) {
    const validTerminalStates = ["CONVERTED", "REJECTED", "EXPIRED", "UNRESPONSIVE", "BLOCKED", "CANCELLED"];
    if (!validTerminalStates.includes(targetState)) {
      throw Object.assign(new Error(`Invalid terminal state '${targetState}'`), { statusCode: 400 });
    }

    let updated = null;
    if (mongoose.connection.readyState === 1) {
      updated = await DiscoveryCandidate.findOneAndUpdate(
        { externalId: opportunityId },
        { $set: { status: targetState, terminalReason: reason, updatedAt: new Date() } },
        { new: true }
      ).lean();
    }

    // Record learning feedback
    this.recordLearningFeedback(opportunityId, targetState, reason);

    return {
      opportunityId,
      status: targetState,
      terminalReason: reason,
      updatedAt: new Date()
    };
  }

  /**
   * Records failure/rejection reasons for discovery feedback loops.
   */
  recordLearningFeedback(opportunityId, outcomeState, reason) {
    const entry = {
      opportunityId,
      outcomeState,
      reason,
      recordedAt: new Date()
    };
    OpportunityFollowUpService.learningStore.push(entry);
    return entry;
  }

  /**
   * Gets learning feedback summary for candidate scoring adjustment.
   */
  getLearningSummary() {
    return OpportunityFollowUpService.learningStore;
  }
}

module.exports = new OpportunityFollowUpService();
