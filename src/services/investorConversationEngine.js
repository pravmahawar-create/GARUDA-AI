/**
 * 🦅 GARUDA AI — Investor Conversation Engine
 * Phase: Investor Autonomous Presentation Experience (Powered by Conversation Brain V1)
 *
 * Core Principle:
 * Conversational layer for high-conviction investor and partner dialogues.
 * Embodying the GARUDA Persona: Calm, sovereign, precise, powerful, intellectually humble about limitations.
 * Show > Tell: Proactively detects demonstrable capabilities, resolves multi-turn co-references, and invites live execution.
 */

const { conversationBrainService, CONVERSATION_INTENTS } = require("./conversationBrainService");
const garudaIdentityKnowledge = require("../knowledge/garudaIdentityKnowledge");

class InvestorConversationEngine {
  constructor() {
    this.brain = conversationBrainService;
  }

  /**
   * Retrieves or initializes session memory.
   * @param {string} sessionId
   * @returns {Object}
   */
  _getSession(sessionId = "default") {
    return this.brain.getSession(sessionId);
  }

  /**
   * Processes a natural language inquiry from an investor or partner with full multi-turn memory.
   *
   * @param {string} questionText - Raw user input
   * @param {Object} [sessionContext] - Session telemetry and identifiers
   * @returns {Promise<Object>} Structured conversational reply with demo hooks and presentation mode
   */
  async processInquiry(questionText = "", sessionContext = {}) {
    const rawQuestion = String(questionText || "").trim();
    const sessionId = sessionContext.sessionId || "default";

    const brainResult = await this.brain.process(rawQuestion, {
      sessionId,
      garudaContext: sessionContext.garudaContext || null,
      sessionMetadata: sessionContext.metadata || {},
      options: sessionContext.options || {}
    });

    const data = brainResult.data;
    const textLower = rawQuestion.toLowerCase();

    // Determine presentation stage mode for UI
    let presentationMode = "CONVERSATION";
    if (data.intent === CONVERSATION_INTENTS.EXECUTE_CAPABILITY || data.intent === CONVERSATION_INTENTS.OFFER_DEMONSTRATION) {
      presentationMode = "DEMO";
    } else if (/mother brain|architecture|how do you think|brain|router|universes/i.test(textLower)) {
      presentationMode = "ARCHITECTURE";
    } else if (/create|design|image|poster|creative|visual|generate|artwork|living artifact/i.test(textLower)) {
      presentationMode = "CREATIVE";
    } else if (/revenue|monetiz|pricing|business model|tiers|commercial|sales|charge/i.test(textLower)) {
      presentationMode = "REVENUE";
    } else if (/security|safe|safety|secure|privacy|trust|data protection|rogue|isolation|tenant|governance|compliance/i.test(textLower)) {
      presentationMode = "GOVERNANCE_SECURITY";
    } else if (/why (should i |to )?invest|moat|advantage|competitive|why buy|competitor|diff/i.test(textLower)) {
      presentationMode = "DIFFERENTIATION_MOAT";
    }

    return {
      answer: data.answer,
      speechText: data.speechText,
      confidence: data.confidence,
      topic: data.topic,
      title: data.topic ? `GARUDA — ${data.topic.toUpperCase().replace(/_/g, " ")}` : "GARUDA Sovereign Response",
      presentationMode,
      capabilityMentioned: data.capabilitySelected,
      demonstrationAvailable: data.demonstrationAvailable,
      suggestedDemo: data.suggestedDemo,
      truthStatus: data.truthStatus,
      keyTakeaway: `Sovereign response: ${data.topic || "general"}`,
      intent: data.intent,
      evidence: data.evidence,
      executionResult: data.executionResult,
      observability: data.observability
    };
  }

  /**
   * Records a completed live capability demonstration into session memory.
   * @param {string} sessionId
   * @param {string} demoKey
   */
  recordDemonstrationExecuted(sessionId, demoKey) {
    const session = this._getSession(sessionId);
    session.demonstratedCapabilities.add(demoKey);
    session.presentationDepthMode = "DEMO";
  }
}

const investorConversationEngine = new InvestorConversationEngine();

module.exports = {
  InvestorConversationEngine,
  investorConversationEngine
};
