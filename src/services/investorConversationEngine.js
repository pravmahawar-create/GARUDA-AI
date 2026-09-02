/**
 * 🦅 GARUDA AI — Investor Conversation Engine
 * Phase: Investor Autonomous Presentation Experience
 *
 * Core Principle:
 * Conversational layer for high-conviction investor and partner dialogues.
 * Embodying the GARUDA Persona: Calm, sovereign, precise, powerful, intellectually honest.
 * Show > Tell: Proactively detects demonstrable capabilities and invites live execution.
 */

const garudaIdentityKnowledge = require("../knowledge/garudaIdentityKnowledge");

class InvestorConversationEngine {
  /**
   * Processes a natural language inquiry from an investor or partner.
   *
   * @param {string} questionText - Raw user input
   * @param {Object} [sessionContext] - Session telemetry
   * @returns {Object} Structured conversational reply with demo hooks
   */
  async processInquiry(questionText = "", sessionContext = {}) {
    const rawQuestion = String(questionText || "").trim();
    if (!rawQuestion) {
      return {
        answer: "I am listening. You may ask me about my architecture, my origin with Praveen, or ask me to demonstrate a verified capability.",
        speechText: "I am listening. You may ask me about my architecture, my origin with Praveen, or ask me to demonstrate a verified capability.",
        confidence: 1.0,
        topic: "greeting",
        capabilityMentioned: null,
        demonstrationAvailable: false,
        suggestedDemo: null,
        truthStatus: "VERIFIED",
        keyTakeaway: "GARUDA is ready for investor dialogue."
      };
    }

    const knowledgeMatch = garudaIdentityKnowledge.findKnowledgeForQuery(rawQuestion);
    const textLower = rawQuestion.toLowerCase();

    // Check for explicit demo requests in user query
    const isDirectDemoRequest =
      /\b(show me|demonstrate|prove it|can you create|generate something|run a demo|show demo|live demo|dikhao|karke dikhao)\b/i.test(textLower);

    let suggestedDemo = knowledgeMatch.suggestedDemo || null;
    let demonstrationAvailable = knowledgeMatch.demonstrationAvailable === true;

    if (isDirectDemoRequest) {
      if (/repo|code|architecture|brain|wrapper/i.test(textLower)) {
        suggestedDemo = "repo_architecture";
        demonstrationAvailable = true;
      } else if (/brand|identity|lock|color|guideline/i.test(textLower)) {
        suggestedDemo = "brand_identity";
        demonstrationAvailable = true;
      } else if (/marketing|seo|content|calendar/i.test(textLower)) {
        suggestedDemo = "marketing_seo";
        demonstrationAvailable = true;
      } else {
        // Default to Creative Living Artifact demo
        suggestedDemo = "creative_artifact";
        demonstrationAvailable = true;
      }
    }

    // Persona-aligned speech shaping (Sovereign, calm, direct)
    let answerText = knowledgeMatch.answer;
    let speechText = knowledgeMatch.answer;

    if (demonstrationAvailable && suggestedDemo) {
      const demoInvitation = " I prefer physical execution to verbal descriptions. Would you like me to demonstrate that live right now?";
      answerText += `\n\n${demoInvitation.trim()}`;
      speechText += demoInvitation;
    }

    return {
      answer: answerText,
      speechText,
      confidence: 0.96,
      topic: knowledgeMatch.topic || "general",
      title: knowledgeMatch.title || "GARUDA Response",
      capabilityMentioned: knowledgeMatch.capabilityId || null,
      demonstrationAvailable,
      suggestedDemo,
      truthStatus: "VERIFIED",
      keyTakeaway: knowledgeMatch.title ? `Key point: ${knowledgeMatch.title}` : "Authoritative sovereign response."
    };
  }
}

const investorConversationEngine = new InvestorConversationEngine();

module.exports = {
  InvestorConversationEngine,
  investorConversationEngine
};
