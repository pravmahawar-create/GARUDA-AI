const crypto = require("crypto");
const mongoose = require("mongoose");
const outboundCommunicationService = require("./outboundCommunicationService");
const missionControlService = require("./missionControlService");

/**
 * GARUDA Inbound Client Response & Decisioning Engine
 * Ingests client replies, classifies intent using Mother Brain logic, maps lifecycle states,
 * and drafts responses requiring Founder approval.
 */
class InboundResponseService {
  static inMemoryResponses = new Map();

  /**
   * Classifies client message intent cleanly using deterministic keyword & GoalEngine signals.
   */
  classifyIntent(messageText = "") {
    const text = String(messageText || "").toLowerCase().trim();

    if (/\b(not interested|cancel|decline|no thanks|stop|reject|not to proceed|do not proceed)\b/i.test(text)) {
      return { action: "close_opportunity", state: "CLOSED", confidence: 0.95 };
    }
    if (/\b(quote|price|cost|pricing|rate|how much|fee|budget)\b/i.test(text)) {
      return { action: "prepare_quote", state: "PRICE_PROPOSED", confidence: 0.9 };
    }
    if (/\b(scope|deliverable|milestones|timeline|architecture|specification|specs)\b/i.test(text)) {
      return { action: "prepare_scope", state: "SCOPE_PROPOSED", confidence: 0.9 };
    }
    if (/\b(call|meeting|schedule|zoom|google meet|talk|connect|discuss)\b/i.test(text)) {
      return { action: "schedule_call", state: "INTERESTED", confidence: 0.85 };
    }
    if (/\b(authorize|start work|begin work|approved|agree|accepted|accept|let's do it|lets do it|go ahead|proceed)\b/i.test(text)) {
      return { action: "authorize_work", state: "WORK_AUTHORIZED", confidence: 0.95 };
    }
    if (/\b(later|next month|next week|busy|hold|pause|revisit)\b/i.test(text)) {
      return { action: "follow_up_later", state: "FOLLOW_UP_SCHEDULED", confidence: 0.8 };
    }
    if (/\b(question|what|how|why|details|info|tell me)\b/i.test(text)) {
      return { action: "answer_question", state: "REQUIREMENTS_CLARIFICATION", confidence: 0.8 };
    }

    return { action: "ask_founder", state: "RESPONSE_RECEIVED", confidence: 0.7 };
  }

  /**
   * Ingests and processes an inbound client message.
   */
  async processInboundResponse(payload = {}, options = {}) {
    const sender = String(payload.sender || payload.from || "").trim();
    const messageText = String(payload.messageText || payload.text || "").trim();
    const opportunityId = payload.opportunityId || `opp_inbound_${Date.now()}`;

    if (!sender || !messageText) {
      throw Object.assign(new Error("Sender and messageText are required for inbound ingestion"), { statusCode: 400 });
    }

    const responseId = `inbound_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const classification = this.classifyIntent(messageText);

    // 1. Draft governed response if action requires outbound reply
    let draftedOutreach = null;
    if (["prepare_quote", "prepare_scope", "answer_question", "schedule_call", "ask_founder"].includes(classification.action)) {
      const replyBody = `Thank you for your message regarding opportunity ${opportunityId}.\n` +
        `GARUDA has analyzed your input (${classification.action}).\n` +
        `Proposed next step: ${classification.state}. Our Founder will review and confirm.`;

      draftedOutreach = await outboundCommunicationService.draftCommunication(
        {
          recipient: sender,
          channel: payload.channel || "email",
          subject: `Re: GARUDA Opportunity (${classification.state})`,
          body: replyBody,
          opportunityId
        },
        { founderApproved: false }
      );
    }

    // 2. Register tracking mission in Mission Control if Founder intervention or work execution is needed
    let mission = null;
    if (classification.action === "authorize_work") {
      const founderApproved = options.founderApproved === true || options.founderApproved === "true";
      mission = await missionControlService.createMission(
        `Execute client authorized work for opportunity ${opportunityId}`,
        { founderApproved }
      );
    }

    const responseRecord = {
      responseId,
      opportunityId,
      sender,
      channel: payload.channel || "email",
      messageText,
      classification,
      lifecycleState: classification.state,
      draftedOutreach,
      mission,
      createdAt: new Date()
    };

    InboundResponseService.inMemoryResponses.set(responseId, responseRecord);

    return responseRecord;
  }

  async getInboundResponse(responseId) {
    return InboundResponseService.inMemoryResponses.get(responseId) || null;
  }
}

module.exports = new InboundResponseService();
