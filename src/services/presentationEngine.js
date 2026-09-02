/**
 * 🦅 GARUDA AI — Presentation Engine
 * Phase: Investor Autonomous Presentation Experience
 *
 * Core Principle:
 * Modular, non-linear presentation state machine that allows GARUDA to introduce itself,
 * explain its architecture, answer live investor interruptions, execute real capability demonstrations,
 * and resume presentation flow naturally without getting stuck in a rigid script.
 */

const crypto = require("crypto");
const garudaIdentityKnowledge = require("../knowledge/garudaIdentityKnowledge");

const PRESENTATION_STATES = Object.freeze({
  IDLE: "IDLE",
  INTRODUCTION: "INTRODUCTION",
  ORIGIN_AND_MISSION: "ORIGIN_AND_MISSION",
  DIFFERENTIATION_AND_TRUTH: "DIFFERENTIATION_AND_TRUTH",
  CAPABILITY_REALITY: "CAPABILITY_REALITY",
  LIVE_DEMONSTRATION_INVITATION: "LIVE_DEMONSTRATION_INVITATION",
  INVESTOR_QA: "INVESTOR_QA",
  LIVE_DEMONSTRATION: "LIVE_DEMONSTRATION",
  RETURN_TO_CONVERSATION: "RETURN_TO_CONVERSATION",
  SESSION_CLOSING: "SESSION_CLOSING"
});

const MODULE_STATE_MAP = Object.freeze({
  origin_and_mission: PRESENTATION_STATES.ORIGIN_AND_MISSION,
  differentiation_and_truth: PRESENTATION_STATES.DIFFERENTIATION_AND_TRUTH,
  capability_reality: PRESENTATION_STATES.CAPABILITY_REALITY
});

const sessionStore = new Map();

function generateSessionId() {
  return `pres_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
}

class PresentationEngine {
  constructor() {
    this.modules = garudaIdentityKnowledge.getPresentationModules();
  }

  createSession(options = {}) {
    const sessionId = options.sessionId || generateSessionId();
    const now = new Date().toISOString();

    const session = {
      sessionId,
      state: PRESENTATION_STATES.INTRODUCTION,
      currentModuleIndex: 0,
      presentedModules: [],
      questionsAsked: [],
      demonstrationsPerformed: [],
      interrupted: false,
      lastInteractionAt: now,
      createdAt: now,
      metadata: options.metadata || {}
    };

    sessionStore.set(sessionId, session);
    return session;
  }

  getSession(sessionId) {
    if (!sessionId) return null;
    return sessionStore.get(sessionId) || null;
  }

  getOrCreateSession(sessionId, options = {}) {
    let session = this.getSession(sessionId);
    if (!session) {
      session = this.createSession({ sessionId, ...options });
    }
    return session;
  }

  /**
   * Starts or restarts the presentation experience.
   */
  startPresentation(sessionId, options = {}) {
    const session = this.getOrCreateSession(sessionId, options);
    const initialModule = this.modules[0];

    session.state = PRESENTATION_STATES.INTRODUCTION;
    session.currentModuleIndex = 0;
    session.presentedModules = [initialModule.id];
    session.lastInteractionAt = new Date().toISOString();

    return {
      sessionId: session.sessionId,
      state: session.state,
      module: initialModule,
      speechText: initialModule.speechLines.join(" "),
      speechLines: initialModule.speechLines,
      keyPoints: initialModule.keyPoints,
      nextModuleId: initialModule.suggestedFollowUp,
      hasMoreModules: this.modules.length > 1,
      availableDemonstrations: garudaIdentityKnowledge.getCapabilityTaxonomy().verified.filter((c) => c.demonstrable)
    };
  }

  /**
   * Advances to the next presentation module in sequence.
   */
  nextModule(sessionId) {
    const session = this.getOrCreateSession(sessionId);
    const nextIdx = session.currentModuleIndex + 1;

    if (nextIdx >= this.modules.length) {
      session.state = PRESENTATION_STATES.LIVE_DEMONSTRATION_INVITATION;
      session.lastInteractionAt = new Date().toISOString();

      return {
        sessionId: session.sessionId,
        state: session.state,
        module: null,
        speechText: "That concludes my core architectural overview. You may now ask me any question, or ask me to demonstrate my verified capabilities live. How would you like to proceed?",
        speechLines: [
          "That concludes my core architectural overview.",
          "You may now ask me any question, or ask me to demonstrate my verified capabilities live.",
          "How would you like to proceed?"
        ],
        hasMoreModules: false,
        availableDemonstrations: garudaIdentityKnowledge.getCapabilityTaxonomy().verified.filter((c) => c.demonstrable)
      };
    }

    const nextMod = this.modules[nextIdx];
    session.currentModuleIndex = nextIdx;
    session.state = MODULE_STATE_MAP[nextMod.id] || PRESENTATION_STATES.AUTONOMOUS_PRESENTATION;
    if (!session.presentedModules.includes(nextMod.id)) {
      session.presentedModules.push(nextMod.id);
    }
    session.lastInteractionAt = new Date().toISOString();

    return {
      sessionId: session.sessionId,
      state: session.state,
      module: nextMod,
      speechText: nextMod.speechLines.join(" "),
      speechLines: nextMod.speechLines,
      keyPoints: nextMod.keyPoints,
      nextModuleId: nextMod.suggestedFollowUp,
      hasMoreModules: nextIdx + 1 < this.modules.length,
      availableDemonstrations: garudaIdentityKnowledge.getCapabilityTaxonomy().verified.filter((c) => c.demonstrable)
    };
  }

  /**
   * Allows the investor to interrupt the presentation with a question.
   * State transitions to INVESTOR_QA while remembering current module index.
   */
  interruptWithQuestion(sessionId, questionText) {
    const session = this.getOrCreateSession(sessionId);
    const cleanQuestion = String(questionText || "").trim();

    session.state = PRESENTATION_STATES.INVESTOR_QA;
    session.interrupted = true;
    session.questionsAsked.push({
      question: cleanQuestion,
      askedAt: new Date().toISOString(),
      atModuleIndex: session.currentModuleIndex
    });
    session.lastInteractionAt = new Date().toISOString();

    return {
      sessionId: session.sessionId,
      state: session.state,
      resumableModuleIndex: session.currentModuleIndex,
      interrupted: true
    };
  }

  /**
   * Transitions state into LIVE_DEMONSTRATION.
   */
  transitionToDemonstration(sessionId, demoKey) {
    const session = this.getOrCreateSession(sessionId);
    session.state = PRESENTATION_STATES.LIVE_DEMONSTRATION;
    session.lastInteractionAt = new Date().toISOString();

    return {
      sessionId: session.sessionId,
      state: session.state,
      demoKey
    };
  }

  /**
   * Concludes a live demonstration and returns smoothly to conversation.
   */
  completeDemonstrationAndReturn(sessionId, demonstrationResult) {
    const session = this.getOrCreateSession(sessionId);
    session.state = PRESENTATION_STATES.RETURN_TO_CONVERSATION;
    session.demonstrationsPerformed.push({
      demoKey: demonstrationResult.demoKey,
      success: demonstrationResult.success,
      timestamp: new Date().toISOString(),
      summary: demonstrationResult.summary || "Demonstration executed"
    });
    session.lastInteractionAt = new Date().toISOString();

    return {
      sessionId: session.sessionId,
      state: session.state,
      speechText: "That was a live, physical execution of my capability. Would you like to inspect another universe, or ask any further questions?",
      demonstrationsCount: session.demonstrationsPerformed.length,
      canResumePresentation: session.currentModuleIndex + 1 < this.modules.length
    };
  }

  /**
   * Concludes the presentation session.
   */
  closeSession(sessionId) {
    const session = this.getOrCreateSession(sessionId);
    session.state = PRESENTATION_STATES.SESSION_CLOSING;
    session.lastInteractionAt = new Date().toISOString();

    return {
      sessionId: session.sessionId,
      state: session.state,
      speechText: "Thank you for experiencing GARUDA. Praveen and our team are ready to discuss bespoke integrations, deployment profiles, or strategic partnerships.",
      sessionSummary: {
        totalModulesPresented: session.presentedModules.length,
        totalQuestionsAsked: session.questionsAsked.length,
        totalDemonstrationsPerformed: session.demonstrationsPerformed.length
      }
    };
  }

  clearForTesting() {
    sessionStore.clear();
  }
}

const presentationEngine = new PresentationEngine();

module.exports = {
  PRESENTATION_STATES,
  PresentationEngine,
  presentationEngine
};
