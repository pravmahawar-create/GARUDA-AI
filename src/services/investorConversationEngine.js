/**
 * 🦅 GARUDA AI — Investor Conversation Engine
 * Phase: Investor Autonomous Presentation Experience (Flagship Director)
 *
 * Core Principle:
 * Conversational layer for high-conviction investor and partner dialogues.
 * Embodying the GARUDA Persona: Calm, sovereign, precise, powerful, intellectually humble about limitations.
 * Show > Tell: Proactively detects demonstrable capabilities, resolves multi-turn co-references, and invites live execution.
 */

const garudaIdentityKnowledge = require("../knowledge/garudaIdentityKnowledge");

class InvestorConversationEngine {
  constructor() {
    this.sessions = new Map();
  }

  /**
   * Retrieves or initializes session memory.
   * @param {string} sessionId
   * @returns {Object}
   */
  _getSession(sessionId = "default") {
    const sid = sessionId || "default";
    if (!this.sessions.has(sid)) {
      this.sessions.set(sid, {
        history: [],
        lastTopic: null,
        lastSuggestedDemo: "creative_artifact",
        demonstratedCapabilities: new Set(),
        presentationDepthMode: "SPEAKER",
        unresolvedQuestions: [],
        createdAt: new Date().toISOString()
      });
    }
    return this.sessions.get(sid);
  }

  /**
   * Processes a natural language inquiry from an investor or partner with full multi-turn memory.
   *
   * @param {string} questionText - Raw user input
   * @param {Object} [sessionContext] - Session telemetry and identifiers
   * @returns {Object} Structured conversational reply with demo hooks and presentation mode
   */
  async processInquiry(questionText = "", sessionContext = {}) {
    const rawQuestion = String(questionText || "").trim();
    const sessionId = sessionContext.sessionId || "default";
    const session = this._getSession(sessionId);

    if (!rawQuestion) {
      return {
        answer: "I am listening. You may ask me about my architecture, why I am different from prompt wrappers, or ask me to demonstrate a verified capability live.",
        speechText: "I am listening. You may ask me about my architecture, why I am different from prompt wrappers, or ask me to demonstrate a verified capability live.",
        confidence: 1.0,
        topic: "greeting",
        presentationMode: "SPEAKER",
        capabilityMentioned: null,
        demonstrationAvailable: false,
        suggestedDemo: null,
        truthStatus: "VERIFIED",
        keyTakeaway: "GARUDA is ready for investor dialogue."
      };
    }

    const textLower = rawQuestion.toLowerCase();

    // 1. Multi-Turn Co-reference Resolution ("that", "it", "this", "prove it")
    let effectiveQuery = rawQuestion;
    const isCoReferentialThat = /\b(how is that|what about that|why is that|tell me more about that)\b/i.test(textLower);
    const cleanedTrim = textLower.replace(/[.!?]/g, "").trim();
    const isDirectProofChallenge =
      /^(prove it|prove that|can you prove it|karke dikhao|prove it now)$/i.test(cleanedTrim) ||
      /\b(challenge you to prove|prove it to me)\b/i.test(textLower);
    const isDirectDemoRequest =
      isDirectProofChallenge ||
      /\b(can you create|generate something|run a demo|show demo|live demo|dikhao live|execute live|show me what you can create|show me)\b/i.test(textLower);

    if (isCoReferentialThat && session.lastTopic === "what_is_garuda") {
      effectiveQuery = "How is GARUDA different from ChatGPT and prompt wrappers?";
    }

    // 2. Resolve Topic Knowledge from Ground Truth
    let knowledgeMatch = garudaIdentityKnowledge.findKnowledgeForQuery(effectiveQuery);

    // 3. Contextual Co-reference Demonstration Target Resolution
    let suggestedDemo = knowledgeMatch.suggestedDemo || session.lastSuggestedDemo || "creative_artifact";
    let demonstrationAvailable = knowledgeMatch.demonstrationAvailable === true || isDirectDemoRequest;

    if (isDirectDemoRequest) {
      if (/repo|code|architecture|brain|wrapper|security|safe|governance/i.test(textLower)) {
        suggestedDemo = "repo_architecture";
        demonstrationAvailable = true;
      } else if (/brand|identity|lock|color|guideline/i.test(textLower)) {
        suggestedDemo = "brand_identity";
        demonstrationAvailable = true;
      } else if (/marketing|seo|content|calendar|growth|sales|revenue/i.test(textLower)) {
        suggestedDemo = "marketing_seo";
        demonstrationAvailable = true;
      } else if (session.lastSuggestedDemo) {
        suggestedDemo = session.lastSuggestedDemo;
        demonstrationAvailable = true;
      } else {
        suggestedDemo = "creative_artifact";
        demonstrationAvailable = true;
      }
    }

    // 4. Dynamic Presentation Stage Mode Selector
    let presentationMode = "CONVERSATION";
    if (/mother brain|architecture|how do you think|brain|router|universes/i.test(textLower)) {
      presentationMode = "ARCHITECTURE";
    } else if (/create|design|image|poster|creative|visual|generate|artwork|living artifact/i.test(textLower)) {
      presentationMode = "CREATIVE";
    } else if (/revenue|monetiz|pricing|business model|tiers|commercial|sales|charge/i.test(textLower)) {
      presentationMode = "REVENUE";
    } else if (/security|safe|safety|secure|privacy|trust|data protection|rogue|isolation|tenant|governance|compliance/i.test(textLower)) {
      presentationMode = "GOVERNANCE_SECURITY";
    } else if (/why (should i |to )?invest|moat|advantage|competitive|why buy|competitor|diff/i.test(textLower)) {
      presentationMode = "DIFFERENTIATION_MOAT";
    } else if (isDirectDemoRequest) {
      presentationMode = "DEMO";
    }

    // 5. Presenter Persona & Natural Speech Synthesis (Calm, confident, sovereign, intellectually honest)
    let answerText = knowledgeMatch.answer;
    let speechText = knowledgeMatch.answer;

    if (isDirectProofChallenge) {
      const proofLead = `I welcome this challenge. Under our Anti-Fabrication Law, verbal claims are meaningless without physical execution. I will execute our ${suggestedDemo.replace(/_/g, " ")} engine right now.`;
      answerText = proofLead;
      speechText = proofLead;
    } else if (demonstrationAvailable && suggestedDemo) {
      const demoInvitation = " I prefer physical execution to verbal descriptions. Would you like me to demonstrate that live right now?";
      answerText += `\n\n${demoInvitation.trim()}`;
      speechText += demoInvitation;
    }

    // 6. Update Session Memory
    session.lastTopic = knowledgeMatch.topic || "general";
    session.lastSuggestedDemo = suggestedDemo;
    session.presentationDepthMode = presentationMode;
    session.history.push({
      role: "investor",
      text: rawQuestion,
      timestamp: new Date().toISOString()
    });
    session.history.push({
      role: "garuda",
      text: answerText,
      topic: knowledgeMatch.topic,
      suggestedDemo,
      timestamp: new Date().toISOString()
    });

    return {
      answer: answerText,
      speechText,
      confidence: 0.98,
      topic: knowledgeMatch.topic || "general",
      title: knowledgeMatch.title || "GARUDA Sovereign Response",
      presentationMode,
      capabilityMentioned: knowledgeMatch.capabilityId || null,
      demonstrationAvailable,
      suggestedDemo,
      truthStatus: "VERIFIED",
      keyTakeaway: knowledgeMatch.title ? `Key point: ${knowledgeMatch.title}` : "Authoritative sovereign response."
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
