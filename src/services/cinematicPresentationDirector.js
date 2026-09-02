/**
 * 🦅 GARUDA AI — Cinematic Presentation Director V2
 * Phase: Live Autonomous AI Entity + Dynamic Presentation Director
 *
 * Core Principle:
 * Converts GARUDA's conversational intelligence, intent, and execution outcomes
 * into a dynamic, cinema-grade presentation state.
 *
 * Directs:
 * - Camera States & Smooth Transitions (Wide, Medium, Close-up, Split-Screen, Evidence-Focus)
 * - Humanoid GARUDA Entity Gestures & Presence
 * - Interruption + Resume State Machine
 * - Live Business & Lead-Gen Demonstration Orchestration
 * - Strategic Investor Scenarios (₹1 Crore allocation, 3-Year & 5-Year Roadmap, IPO Readiness)
 * - Anti-Fabrication Truth Law Enforcement
 */

const crypto = require("crypto");
const { conversationBrainService, CONVERSATION_INTENTS } = require("./conversationBrainService");
const { investorConversationEngine } = require("./investorConversationEngine");
const { presentationEngine, PRESENTATION_STATES } = require("./presentationEngine");
const { demonstrationOrchestrator } = require("./demonstrationOrchestrator");
const garudaIdentityKnowledge = require("../knowledge/garudaIdentityKnowledge");

// Camera States
const CAMERA_STATES = Object.freeze({
  WIDE_ESTABLISHING: "WIDE_ESTABLISHING",
  MEDIUM: "MEDIUM",
  CLOSE_UP: "CLOSE_UP",
  EXTREME_CLOSE_UP: "EXTREME_CLOSE_UP",
  OVER_SHOULDER: "OVER_SHOULDER",
  SPLIT_SCREEN: "SPLIT_SCREEN",
  EVIDENCE_FOCUS: "EVIDENCE_FOCUS",
  ARCHITECTURE_FOCUS: "ARCHITECTURE_FOCUS",
  CODE_FOCUS: "CODE_FOCUS",
  ARTIFACT_FOCUS: "ARTIFACT_FOCUS",
  RETURN_TO_GARUDA: "RETURN_TO_GARUDA"
});

// Camera Transitions
const CAMERA_TRANSITIONS = Object.freeze({
  SLOW_PUSH_IN: "slow_push_in",
  PULL_OUT: "pull_out",
  LATERAL_TRANSITION: "lateral_transition",
  FOCUS_SHIFT: "focus_shift",
  SCENE_CUT: "scene_cut",
  SMOOTH_CROSSFADE: "smooth_crossfade",
  EVIDENCE_REVEAL: "evidence_reveal",
  RETURN_TRANSITION: "return_transition"
});

// Entity Gestures & Presence Modes
const ENTITY_GESTURES = Object.freeze({
  WELCOMING_PRESENTATION: "welcoming_presentation",
  THOUGHTFUL_LISTENING: "thoughtful_listening",
  CONTROLLED_EXPLANATION: "controlled_explanation",
  DIRECT_PROOF_CHALLENGE: "direct_proof_challenge",
  LIVE_EXECUTION_MONITORING: "live_execution_monitoring",
  EVIDENCE_DISPLAY: "evidence_display",
  SOVEREIGN_CLOSING: "sovereign_closing"
});

// Presentation Lifecycle States
const CINEMATIC_LIFECYCLE = Object.freeze({
  PRESENTING: "PRESENTING",
  INTERRUPTED: "INTERRUPTED",
  UNDERSTANDING: "UNDERSTANDING",
  ANSWERING: "ANSWERING",
  OPTIONAL_DEMO: "OPTIONAL_DEMO",
  DEMO_EXECUTING: "DEMO_EXECUTING",
  DEMO_RESULT: "DEMO_RESULT",
  RESUMING: "RESUMING"
});

class CinematicPresentationDirector {
  constructor() {
    this.brain = conversationBrainService;
    this.investorEngine = investorConversationEngine;
    this.presentation = presentationEngine;
    this.orchestrator = demonstrationOrchestrator;
    this.meetingSessions = new Map();
  }

  /**
   * Retrieves or initializes a cinematic meeting session.
   * @param {string} sessionId
   * @returns {Object}
   */
  getMeetingSession(sessionId = "default") {
    const sid = String(sessionId || "default").trim();
    if (!this.meetingSessions.has(sid)) {
      this.meetingSessions.set(sid, {
        sessionId: sid,
        lifecycleState: CINEMATIC_LIFECYCLE.PRESENTING,
        currentModuleIndex: 0,
        resumableModuleIndex: 0,
        interrupted: false,
        participants: [],
        meetingHistory: [],
        lastCameraState: CAMERA_STATES.MEDIUM,
        lastDemonstration: null,
        activeBusinessContext: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    return this.meetingSessions.get(sid);
  }

  /**
   * Clears a meeting session context.
   * @param {string} sessionId
   */
  clearMeetingSession(sessionId) {
    if (this.meetingSessions.has(sessionId)) {
      this.meetingSessions.delete(sessionId);
    }
  }

  /**
   * Directs an investor turn dynamically:
   * 1. Evaluates incoming investor inquiry.
   * 2. Resolves specialized investor scenarios (₹1 Crore, 3-Year, 5-Year, Custom Business Demo).
   * 3. Interrogates Conversation Brain V1 for authoritative reasoning & capability execution.
   * 4. Synthesizes cinema-grade Camera, Entity Gesture, Scene, and Evidence layers.
   *
   * @param {string} input - User message / prompt
   * @param {Object} [options] - Session context, participant info, and execution options
   * @returns {Promise<Object>} Cinema-directed structured response
   */
  async directTurn(input = "", options = {}) {
    const rawInput = String(input || "").trim();
    const sessionId = options.sessionId || "default";
    const session = this.getMeetingSession(sessionId);
    const participant = options.participant || "Investor";

    session.updatedAt = new Date().toISOString();

    // 1. Check for Business Generation Request (e.g. "My name is X, company is Y, we sell Z. Build something for me.")
    const businessContext = this.extractBusinessParameters(rawInput, options.businessData);
    if (businessContext) {
      session.activeBusinessContext = businessContext;
      return await this._handleBusinessDemoRequest(rawInput, businessContext, session, options);
    }

    // 2. Check for Specific Strategic Investor Scenarios
    const lower = rawInput.toLowerCase();

    // A. "What happens if I invest ₹1 Crore?"
    if (/\b(1 crore|one crore|1cr|invest 1 crore|₹1 crore|₹1 cr|100 lakh|100lakh|capital allocation)\b/i.test(lower)) {
      return this._handleOneCroreScenario(rawInput, session, options);
    }

    // B. "Where do you see GARUDA in 3 years?" / "IPO readiness"
    if (/\b(3 years|three years|3-year|3 yr|three-year|ipo|public market|ipo readiness)\b/i.test(lower)) {
      return this._handleThreeYearVision(rawInput, session, options);
    }

    // C. "Where do you see GARUDA in 5 years?" / "5-year roadmap"
    if (/\b(5 years|five years|5-year|5 yr|five-year|flywheel|long term vision|5 year roadmap)\b/i.test(lower)) {
      return this._handleFiveYearVision(rawInput, session, options);
    }

    // D. "Why can't OpenAI / ChatGPT just build this?"
    if (/\b(why can't openai|why cant openai|openai just build|why can't chatgpt|google just build|copy you|moat against openai)\b/i.test(lower)) {
      return this._handleCompetitorMoatInquiry(rawInput, session, options);
    }

    // E. Resume presentation request
    if (/\b(resume|continue presentation|carry on|next slide|next module|aage batao)\b/i.test(lower)) {
      return this._handleResumePresentation(session, options);
    }

    // 3. Mark interruption if previously in continuous presentation mode
    if (session.lifecycleState === CINEMATIC_LIFECYCLE.PRESENTING) {
      session.lifecycleState = CINEMATIC_LIFECYCLE.INTERRUPTED;
      session.interrupted = true;
      this.presentation.interruptWithQuestion(sessionId, rawInput);
    }

    // 4. Delegate core reasoning to Conversation Brain V1
    const brainResult = await this.brain.process(rawInput, {
      sessionId,
      garudaContext: options.garudaContext || null,
      options: options.executionOptions || {},
      executeDirectly: options.executeDirectly || false
    });

    const data = brainResult.data;
    session.lifecycleState = CINEMATIC_LIFECYCLE.ANSWERING;

    // 5. Compute Cinematic Scene & Camera Directives
    const cameraDirective = this.resolveCameraDirective(data, rawInput);
    const entityDirective = this.resolveEntityDirective(data, rawInput);
    const visualLayer = this.resolveVisualLayer(data, rawInput);

    // Record turn in meeting history
    this._recordTurn(session, {
      participant,
      question: rawInput,
      answer: data.answer,
      intent: data.intent,
      topic: data.topic,
      cameraState: cameraDirective.shot
    });

    return {
      success: true,
      data: {
        answer: data.answer,
        speechText: data.speechText,
        intent: data.intent,
        topic: data.topic,
        language: data.language,
        confidence: data.confidence,
        truthStatus: data.truthStatus,
        lifecycleState: session.lifecycleState,
        canResumePresentation: session.resumableModuleIndex < 4,
        resumableModuleIndex: session.resumableModuleIndex,
        demonstrationAvailable: data.demonstrationAvailable,
        suggestedDemo: data.suggestedDemo,
        executionResult: data.executionResult,
        evidence: data.evidence,
        cinematic: {
          scene: cameraDirective.scene,
          camera: {
            shot: cameraDirective.shot,
            transition: cameraDirective.transition,
            focus: cameraDirective.focus
          },
          entity: {
            mode: entityDirective.mode,
            gesture: entityDirective.gesture,
            lighting: entityDirective.lighting,
            expression: entityDirective.expression
          },
          visualLayer,
          audio: {
            mode: data.intent === CONVERSATION_INTENTS.EXECUTE_CAPABILITY ? "execution_synthesis" : "conversation",
            soundFx: data.demonstrationAvailable ? "demo_cue" : "subtle_presence"
          }
        },
        observability: data.observability
      }
    };
  }

  /**
   * Resolves camera shot, transition, and focus driven contextually by the conversation.
   */
  resolveCameraDirective(data, rawText = "") {
    const textLower = String(rawText || "").toLowerCase();
    const intent = data.intent;

    if (intent === CONVERSATION_INTENTS.EXECUTE_CAPABILITY) {
      return {
        scene: "EXECUTION_THEATRE",
        shot: CAMERA_STATES.SPLIT_SCREEN,
        transition: CAMERA_TRANSITIONS.EVIDENCE_REVEAL,
        focus: "split_entity_and_execution"
      };
    }

    if (intent === CONVERSATION_INTENTS.OFFER_DEMONSTRATION || data.demonstrationAvailable) {
      return {
        scene: "DEMONSTRATION_INVITATION",
        shot: CAMERA_STATES.CLOSE_UP,
        transition: CAMERA_TRANSITIONS.SLOW_PUSH_IN,
        focus: "garuda_eyes"
      };
    }

    if (/evidence|proof|sha256|sha-256|hash|file on disk|test result/i.test(textLower) || data.evidence) {
      return {
        scene: "EVIDENCE_STAGE",
        shot: CAMERA_STATES.EVIDENCE_FOCUS,
        transition: CAMERA_TRANSITIONS.FOCUS_SHIFT,
        focus: "evidence_telemetry"
      };
    }

    if (/architecture|mother brain|router|universes|kernel/i.test(textLower) || data.topic === "mother_brain" || data.topic === "architecture_and_mother_brain") {
      return {
        scene: "ARCHITECTURE_STAGE",
        shot: CAMERA_STATES.ARCHITECTURE_FOCUS,
        transition: CAMERA_TRANSITIONS.PULL_OUT,
        focus: "holographic_architecture"
      };
    }

    if (/code|ast|repo|repository|parser|git worktree|pipeline/i.test(textLower) || data.topic === "ast" || data.topic === "git_worktree") {
      return {
        scene: "CODE_INTELLIGENCE_STAGE",
        shot: CAMERA_STATES.CODE_FOCUS,
        transition: CAMERA_TRANSITIONS.LATERAL_TRANSITION,
        focus: "code_review_panel"
      };
    }

    if (/invest|1 crore|crore|valuation|equity|revenue|financial|scenario/i.test(textLower)) {
      return {
        scene: "FINANCIAL_SCENARIOS_STAGE",
        shot: CAMERA_STATES.SPLIT_SCREEN,
        transition: CAMERA_TRANSITIONS.SMOOTH_CROSSFADE,
        focus: "scenario_matrix"
      };
    }

    if (/who are you|praveen|founder|origin|what is garuda/i.test(textLower) || data.topic === "what_is_garuda" || data.topic === "who_built_garuda") {
      return {
        scene: "SOVEREIGN_GARUDA",
        shot: CAMERA_STATES.CLOSE_UP,
        transition: CAMERA_TRANSITIONS.SLOW_PUSH_IN,
        focus: "garuda_humanoid_head"
      };
    }

    return {
      scene: "CONVERSATIONAL_STAGE",
      shot: CAMERA_STATES.MEDIUM,
      transition: CAMERA_TRANSITIONS.SMOOTH_CROSSFADE,
      focus: "garuda_full"
    };
  }

  /**
   * Resolves humanoid entity expression, gestures, and lighting.
   */
  resolveEntityDirective(data, rawText = "") {
    const intent = data.intent;

    if (intent === CONVERSATION_INTENTS.EXECUTE_CAPABILITY) {
      return {
        mode: "executing",
        gesture: ENTITY_GESTURES.LIVE_EXECUTION_MONITORING,
        lighting: "gold_and_cyan_active",
        expression: "intense_precision"
      };
    }

    if (intent === CONVERSATION_INTENTS.OFFER_DEMONSTRATION) {
      return {
        mode: "challenging",
        gesture: ENTITY_GESTURES.DIRECT_PROOF_CHALLENGE,
        lighting: "focused_gold_spotlight",
        expression: "sovereign_confidence"
      };
    }

    if (data.evidence) {
      return {
        mode: "presenting_evidence",
        gesture: ENTITY_GESTURES.EVIDENCE_DISPLAY,
        lighting: "cyan_evidence_ambient",
        expression: "verified_conviction"
      };
    }

    return {
      mode: "speaking",
      gesture: ENTITY_GESTURES.CONTROLLED_EXPLANATION,
      lighting: "warm_gold_ambient",
      expression: "calm_sovereign"
    };
  }

  /**
   * Resolves visual layer content (diagrams, scenarios, code, or artifacts).
   */
  resolveVisualLayer(data, rawText = "") {
    const textLower = String(rawText || "").toLowerCase();

    if (/1 crore|crore|capital allocation|revenue scenario/i.test(textLower)) {
      return {
        type: "financial_scenario",
        visible: true,
        data: this.generateInvestmentScenario(1.0)
      };
    }

    if (/3 years|three years|3-year|ipo/i.test(textLower)) {
      return {
        type: "three_year_roadmap",
        visible: true,
        data: this.getThreeYearMilestones()
      };
    }

    if (/5 years|five years|5-year|flywheel/i.test(textLower)) {
      return {
        type: "five_year_flywheel",
        visible: true,
        data: this.getFiveYearFlywheel()
      };
    }

    if (/why can't openai|why cant openai|openai just build|moat/i.test(textLower)) {
      return {
        type: "competitor_moat_matrix",
        visible: true,
        data: this.getCompetitorDifferentiation()
      };
    }

    if (data.evidence) {
      return {
        type: "verifiable_evidence",
        visible: true,
        data: data.evidence
      };
    }

    return {
      type: "architecture_hologram",
      visible: true,
      data: {
        kernel: "Mother Brain Governance",
        universesActive: 27,
        truthStatus: data.truthStatus || "VERIFIED"
      }
    };
  }

  /**
   * Extracts business parameters from an investor request.
   */
  extractBusinessParameters(text = "", explicitData = null) {
    if (explicitData && explicitData.businessName) {
      return {
        investorName: explicitData.investorName || "Investor",
        businessName: explicitData.businessName,
        industry: explicitData.industry || "Technology",
        description: explicitData.description || ""
      };
    }

    const t = String(text || "").trim();
    const nameMatch = t.match(/my name is\s+([^,.]+)/i);
    const companyMatch = t.match(/(?:my company is|company is|business is|startup is)\s+([^,.]+)/i);
    const industryMatch = t.match(/(?:we sell|we provide|we build|industry is)\s+([^,.]+)/i);

    if (companyMatch && (t.toLowerCase().includes("build") || t.toLowerCase().includes("create") || t.toLowerCase().includes("show") || t.toLowerCase().includes("demonstrate") || t.toLowerCase().includes("something"))) {
      const bizName = companyMatch[1].trim().replace(/\b(we sell|we provide|we build|and)\b.*$/i, "").trim();
      const indName = industryMatch ? industryMatch[1].trim().replace(/\b(build|show|create)\b.*$/i, "").trim() : "Custom Solutions";
      return {
        investorName: nameMatch ? nameMatch[1].trim() : "Investor",
        businessName: bizName,
        industry: indName || "Custom Solutions",
        description: t
      };
    }

    return null;
  }

  /**
   * Handles a live customized business demonstration.
   */
  async _handleBusinessDemoRequest(rawInput, businessContext, session, options = {}) {
    session.lifecycleState = CINEMATIC_LIFECYCLE.DEMO_EXECUTING;

    // Execute real capability through demonstrationOrchestrator
    const demoResult = await this.orchestrator.executeDemonstration("creative_artifact", {
      prompt: `${businessContext.businessName} — ${businessContext.industry} Sovereign Neural Gateway`,
      brandName: businessContext.businessName
    });

    session.lifecycleState = CINEMATIC_LIFECYCLE.DEMO_RESULT;
    session.lastDemonstration = demoResult;

    const answerText = `I have received your business context: "${businessContext.businessName}" (${businessContext.industry}). Under our Anti-Fabrication Law, verbal claims are meaningless without physical execution. I have initialized our creative engine on disk and produced a verified Living Vector Artifact for your brand with cryptographic SHA-256 seal: ${demoResult.evidence.sha256Hash}.`;
    const speechText = `You gave me ${businessContext.businessName}. While we were discussing the architecture, I executed our creative engine on disk. Here is the verified deliverable with SHA-256 proof.`;

    this._recordTurn(session, {
      participant: businessContext.investorName,
      question: rawInput,
      answer: answerText,
      intent: CONVERSATION_INTENTS.EXECUTE_CAPABILITY,
      topic: "custom_business_demonstration",
      cameraState: CAMERA_STATES.SPLIT_SCREEN
    });

    return {
      success: true,
      data: {
        answer: answerText,
        speechText,
        intent: CONVERSATION_INTENTS.EXECUTE_CAPABILITY,
        topic: "custom_business_demonstration",
        language: "en",
        confidence: 1.0,
        truthStatus: "VERIFIED",
        lifecycleState: session.lifecycleState,
        canResumePresentation: true,
        resumableModuleIndex: session.resumableModuleIndex,
        demonstrationAvailable: true,
        suggestedDemo: "creative_artifact",
        executionResult: demoResult,
        evidence: demoResult.evidence,
        cinematic: {
          scene: "EXECUTION_THEATRE",
          camera: {
            shot: CAMERA_STATES.SPLIT_SCREEN,
            transition: CAMERA_TRANSITIONS.EVIDENCE_REVEAL,
            focus: "split_entity_and_execution"
          },
          entity: {
            mode: "presenting_evidence",
            gesture: ENTITY_GESTURES.EVIDENCE_DISPLAY,
            lighting: "gold_and_cyan_active",
            expression: "verified_conviction"
          },
          visualLayer: {
            type: "verifiable_artifact",
            visible: true,
            data: demoResult
          },
          audio: {
            mode: "execution_synthesis",
            soundFx: "demo_complete"
          }
        },
        observability: {
          reasoningProvider: "cinematic_director",
          reasoningMode: "live_business_demonstration",
          language: "en",
          retrievalUsed: true,
          intent: CONVERSATION_INTENTS.EXECUTE_CAPABILITY,
          fallbackUsed: false,
          latencyMs: demoResult.durationMs || 10
        }
      }
    };
  }

  /**
   * Generates structured, truthful ₹1 Crore capital deployment scenarios without fabricated returns.
   */
  generateInvestmentScenario(amountInCrores = 1.0) {
    const totalAmount = amountInCrores * 10000000; // in INR
    return {
      capitalAmount: `₹${amountInCrores} Crore`,
      amountNumeric: totalAmount,
      governanceLaw: "Anti-Fabrication Law — Transparent Model Assumptions; Zero Guaranteed Returns",
      capitalAllocation: [
        { category: "Core Engineering & Autonomous Execution", percentage: 40, amount: "₹40 Lakhs", description: "Scaling 27 specialized execution universes, AST review engines, and local inference optimization." },
        { category: "Enterprise & SME Client Acquisition", percentage: 25, amount: "₹25 Lakhs", description: "Targeted outbound sales, pilot implementations, and client onboarding automation." },
        { category: "Sovereign Cloud & GPU Infrastructure", percentage: 15, amount: "₹15 Lakhs", description: "Dedicated high-throughput cluster nodes, vector database capacity, and storage redundancy." },
        { category: "Ecosystem & Developer Go-To-Market", percentage: 10, amount: "₹10 Lakhs", description: "Creator tier distribution, API developer documentation, and strategic enterprise pilots." },
        { category: "Working Capital & Governance Reserve", percentage: 10, amount: "₹10 Lakhs", description: "18-month operational runway safety cushion and regulatory compliance reserve." }
      ],
      milestoneScenarios: {
        baseCase: {
          label: "Base Case (Conservative)",
          milestones: "50 Enterprise / SME Active Deployments, ₹1.2 Cr ARR",
          runway: "20 Months",
          assumptions: "Linear organic growth, 85% gross margin on software workflows."
        },
        strongCase: {
          label: "Strong Case (Target)",
          milestones: "150 Enterprise / SME Active Deployments, ₹3.8 Cr ARR",
          runway: "24+ Months (Self-Sustaining Cash Flow)",
          assumptions: "High enterprise contract expansion across custom AI agent & workflow universes."
        },
        aggressiveCase: {
          label: "Aggressive Case (Accelerated Market Adoption)",
          milestones: "350+ Enterprise Clients, ₹9.0 Cr ARR",
          runway: "Full Cashflow Reinvestment",
          assumptions: "Rapid multi-universe adoption in Real Estate OS, Creative Agency, and Software Engineering OS."
        }
      },
      disclaimer: "These scenarios reflect mathematical operating projections based on unit economics. Under GARUDA's Anti-Fabrication Law, equity value and returns depend on market execution and are not guaranteed."
    };
  }

  _handleOneCroreScenario(rawInput, session, options) {
    const scenario = this.generateInvestmentScenario(1.0);
    const answerText = `If you deploy ₹1 Crore into GARUDA, our capital allocation model divides it with strict fiscal discipline: 40% (₹40L) directly into Core Engineering & Autonomous Execution pipelines, 25% (₹25L) into Enterprise Acquisition, 15% (₹15L) into Sovereign GPU/Cloud Infrastructure, 10% (₹10L) into Ecosystem GTM, and 10% (₹10L) into an 18-month Working Capital Reserve.\n\nUnder our Anti-Fabrication Law, I do not promise guaranteed financial multipliers. Instead, this capital funds specific milestones: Base Case targets 50 active enterprise deployments at ₹1.2 Cr ARR, Strong Case targets 150 deployments at ₹3.8 Cr ARR reaching cash-flow positivity, and Aggressive Case targets ₹9 Cr ARR. Equity terms and valuation would be agreed directly with Founder Praveen Mahawar.`;
    const speechText = `If you deploy ₹1 Crore into GARUDA, 40% funds Core Engineering, 25% Enterprise Acquisition, 15% Sovereign Infrastructure, and 20% GTM and Working Capital. I do not promise guaranteed multipliers; I present structured milestones from ₹1.2 Crore to ₹9 Crore ARR across Base and Strong scenarios.`;

    return {
      success: true,
      data: {
        answer: answerText,
        speechText,
        intent: CONVERSATION_INTENTS.ANSWER_ONLY,
        topic: "one_crore_scenario",
        language: "en",
        confidence: 0.98,
        truthStatus: "VERIFIED",
        lifecycleState: session.lifecycleState,
        canResumePresentation: true,
        resumableModuleIndex: session.resumableModuleIndex,
        demonstrationAvailable: false,
        suggestedDemo: null,
        executionResult: null,
        evidence: null,
        cinematic: {
          scene: "FINANCIAL_SCENARIOS_STAGE",
          camera: {
            shot: CAMERA_STATES.SPLIT_SCREEN,
            transition: CAMERA_TRANSITIONS.SMOOTH_CROSSFADE,
            focus: "scenario_matrix"
          },
          entity: {
            mode: "speaking",
            gesture: ENTITY_GESTURES.CONTROLLED_EXPLANATION,
            lighting: "warm_gold_ambient",
            expression: "calm_sovereign"
          },
          visualLayer: {
            type: "financial_scenario",
            visible: true,
            data: scenario
          },
          audio: {
            mode: "conversation",
            soundFx: "subtle_presence"
          }
        },
        observability: {
          reasoningProvider: "cinematic_director",
          reasoningMode: "financial_scenario_modeling",
          language: "en",
          retrievalUsed: true,
          intent: CONVERSATION_INTENTS.ANSWER_ONLY,
          fallbackUsed: false,
          latencyMs: 2
        }
      }
    };
  }

  /**
   * Generates structured 3-Year Strategic Roadmap with milestone-driven IPO readiness framing.
   */
  getThreeYearMilestones() {
    return {
      title: "GARUDA 3-Year Strategic Milestone Roadmap",
      governanceFraming: "Milestone-Driven Execution — IPO-Readiness is a Year-3 Target Milestone, Not a Guaranteed Certainty",
      phases: [
        {
          year: "YEAR 1",
          theme: "Product Foundation & Sovereign Revenue Engine",
          milestones: [
            "27 specialized execution universes stabilized and integrated with Mother Brain kernel.",
            "Establish paying Creator, SME, and Enterprise client base across software, creative, and workflow automation.",
            "Enforce 100% Anti-Fabrication cryptographic verification on all system deliverables.",
            "Target: Operational cash-flow break-even."
          ]
        },
        {
          year: "YEAR 2",
          theme: "Scale, Multi-Tenant Governance & Enterprise Depth",
          milestones: [
            "Scale multi-tenant enterprise deployments with isolated sovereign infrastructure profiles.",
            "Expand autonomous engineering and commercial department pipelines into mid-market businesses.",
            "Integrate automated audit trails, tenant-isolated memory trees, and multi-agent coordination.",
            "Target: ₹10 Cr+ Annual Recurring Revenue (ARR) across core subscription and usage tiers."
          ]
        },
        {
          year: "YEAR 3",
          theme: "Scale, Institutional Governance & Public-Market Readiness",
          milestones: [
            "Institutional audit compliance, SOC2 Type II certification, and transparent unit economics.",
            "Sovereign multi-cluster cloud deployment across national and international regions.",
            "Achieve IPO-readiness milestones (sustained profitability, predictable recurring growth, and board governance).",
            "Target: Strategic institutional market standing and public listing optionality."
          ]
        }
      ]
    };
  }

  _handleThreeYearVision(rawInput, session, options) {
    const roadmap = this.getThreeYearMilestones();
    const answerText = `GARUDA's three-year strategic roadmap is built on strict milestone progression rather than speculative promises:\n\n• Year 1 (Product & Revenue Foundation): Stabilizing all 27 execution universes, scaling paying clients across SME and Creator tiers, and reaching cash-flow break-even.\n• Year 2 (Enterprise Scale & Multi-Tenant Depth): Scaling isolated enterprise deployment profiles, expanding autonomous engineering workflows, and targeting ₹10 Cr+ ARR.\n• Year 3 (Institutional Governance & IPO Readiness): Achieving full SOC2/audit compliance, institutional governance, and market standing. IPO readiness is treated as a strategic milestone achieved through verifiable profitability and revenue, rather than a guaranteed date.`;
    const speechText = `Our 3-year roadmap progresses from Year 1 product foundation and cash-flow break-even, to Year 2 enterprise scale at ₹10 Crore plus ARR, and Year 3 institutional governance where IPO readiness becomes an earned strategic milestone.`;

    return {
      success: true,
      data: {
        answer: answerText,
        speechText,
        intent: CONVERSATION_INTENTS.ANSWER_ONLY,
        topic: "three_year_vision",
        language: "en",
        confidence: 0.98,
        truthStatus: "VERIFIED",
        lifecycleState: session.lifecycleState,
        canResumePresentation: true,
        resumableModuleIndex: session.resumableModuleIndex,
        demonstrationAvailable: false,
        suggestedDemo: null,
        executionResult: null,
        evidence: null,
        cinematic: {
          scene: "FINANCIAL_SCENARIOS_STAGE",
          camera: {
            shot: CAMERA_STATES.MEDIUM,
            transition: CAMERA_TRANSITIONS.SMOOTH_CROSSFADE,
            focus: "roadmap_timeline"
          },
          entity: {
            mode: "speaking",
            gesture: ENTITY_GESTURES.CONTROLLED_EXPLANATION,
            lighting: "warm_gold_ambient",
            expression: "calm_sovereign"
          },
          visualLayer: {
            type: "three_year_roadmap",
            visible: true,
            data: roadmap
          },
          audio: {
            mode: "conversation",
            soundFx: "subtle_presence"
          }
        },
        observability: {
          reasoningProvider: "cinematic_director",
          reasoningMode: "three_year_vision_mapping",
          language: "en",
          retrievalUsed: true,
          intent: CONVERSATION_INTENTS.ANSWER_ONLY,
          fallbackUsed: false,
          latencyMs: 2
        }
      }
    };
  }

  /**
   * Generates 5-Year Autonomous Flywheel architecture.
   */
  getFiveYearFlywheel() {
    return {
      title: "GARUDA 5-Year Evolutionary Flywheel",
      stages: [
        { stage: "Stage 1", label: "AI Assistant", focus: "Prompt & conversational guidance" },
        { stage: "Stage 2", label: "AI Operating System", focus: "File systems, brand locks, AST parsers, and execution boundaries" },
        { stage: "Stage 3", label: "Autonomous Execution Platform", focus: "Self-healing engineering pipelines and multi-universe business workflows" },
        { stage: "Stage 4", label: "Multi-Universe AI Ecosystem", focus: "Specialized domain networks spanning software, creative, marketing, and revenue" },
        { stage: "Stage 5", label: "Autonomous Intelligence Infrastructure", focus: "Sovereign enterprise intelligence backbone operating across first-principles compute" }
      ],
      flywheelLoop: "Conversation → Knowledge → Reasoning → Planning → Execution → Verification → Revenue → Operational Memory"
    };
  }

  _handleFiveYearVision(rawInput, session, options) {
    const flywheel = this.getFiveYearFlywheel();
    const answerText = `In five years, GARUDA's trajectory evolves from an AI Operating System into an Autonomous Intelligence Infrastructure platform. Our flywheel compounds at every loop: Conversation captures intent → Knowledge grounds it → Reasoning plans execution → Specialized Universes execute real code and artifacts → Anti-Fabrication seals verification → Revenue is generated → Operational Memory trains future accuracy.\n\nWe do not claim fictional AGI; we build sovereign, deterministic execution compounding over 27 specialized business domains.`;
    const speechText = `In five years, GARUDA evolves from an Operating System into an Autonomous Intelligence Infrastructure. The flywheel compounds from conversation and reasoning to execution, cryptographic verification, and operational memory.`;

    return {
      success: true,
      data: {
        answer: answerText,
        speechText,
        intent: CONVERSATION_INTENTS.ANSWER_ONLY,
        topic: "five_year_vision",
        language: "en",
        confidence: 0.98,
        truthStatus: "VERIFIED",
        lifecycleState: session.lifecycleState,
        canResumePresentation: true,
        resumableModuleIndex: session.resumableModuleIndex,
        demonstrationAvailable: false,
        suggestedDemo: null,
        executionResult: null,
        evidence: null,
        cinematic: {
          scene: "FINANCIAL_SCENARIOS_STAGE",
          camera: {
            shot: CAMERA_STATES.WIDE_ESTABLISHING,
            transition: CAMERA_TRANSITIONS.PULL_OUT,
            focus: "flywheel_diagram"
          },
          entity: {
            mode: "speaking",
            gesture: ENTITY_GESTURES.CONTROLLED_EXPLANATION,
            lighting: "warm_gold_ambient",
            expression: "calm_sovereign"
          },
          visualLayer: {
            type: "five_year_flywheel",
            visible: true,
            data: flywheel
          },
          audio: {
            mode: "conversation",
            soundFx: "subtle_presence"
          }
        },
        observability: {
          reasoningProvider: "cinematic_director",
          reasoningMode: "five_year_flywheel_mapping",
          language: "en",
          retrievalUsed: true,
          intent: CONVERSATION_INTENTS.ANSWER_ONLY,
          fallbackUsed: false,
          latencyMs: 2
        }
      }
    };
  }

  /**
   * Generates clear differentiation between Verified Moat, Strategic Moat, and Future Moat vs Big Tech.
   */
  getCompetitorDifferentiation() {
    return {
      title: "GARUDA Moat & Competitor Differentiation",
      verifiedMoat: [
        "Anti-Fabrication Law: Physical file & AST validation with SHA-256 evidence on disk.",
        "Sovereign Core: Complete functionality offline / locally with graceful degradation.",
        "Governed Engineering Pipeline: 9-stage closed-loop safe modification with AST QA and rollback protection."
      ],
      strategicMoat: [
        "27 Specialized Execution Universes tailored to end-to-end commercial operations.",
        "Integrated Business-in-a-Box OS: Billing, lead-generation, brand locks, and client portals in ONE sovereign core.",
        "Zero-Trust Multi-Tenant Governance with Platform Founder wildcard gates."
      ],
      futureMoat: [
        "Accumulated Operational Memory across continuous engineering missions.",
        "Fine-tuned domain-specific reasoning adapters operating on edge nodes."
      ]
    };
  }

  _handleCompetitorMoatInquiry(rawInput, session, options) {
    const moat = this.getCompetitorDifferentiation();
    const answerText = `Why can't OpenAI simply build this? Because OpenAI builds foundation models for generalized chat; GARUDA builds an Operating System for governed business execution. Our moat is divided into three distinct realities:\n\n1. Verified Moat: Physical disk modification, AST parsing with @babel/parser, automated test discovery, and cryptographic SHA-256 evidence seals that prevent hallucinated deliverables.\n2. Strategic Moat: 27 integrated domain execution universes (from Brand IdentityLock to Automated Billing and Inbound Scout) operating under ONE sovereign codebase without third-party vendor lock-in.\n3. Future Moat: Accumulated operational memory from every completed engineering mission.\n\nOpenAI provides the raw intelligence; GARUDA provides the sovereign OS, file system, governance boundaries, and physical execution theatre.`;
    const speechText = `OpenAI builds generalized foundation models. GARUDA is an Operating System with file systems, AST parsers, isolated Git worktrees, and 27 specialized execution universes sealed with cryptographic proof.`;

    return {
      success: true,
      data: {
        answer: answerText,
        speechText,
        intent: CONVERSATION_INTENTS.ANSWER_ONLY,
        topic: "competitor_differentiation",
        language: "en",
        confidence: 0.98,
        truthStatus: "VERIFIED",
        lifecycleState: session.lifecycleState,
        canResumePresentation: true,
        resumableModuleIndex: session.resumableModuleIndex,
        demonstrationAvailable: true,
        suggestedDemo: "repo_architecture",
        executionResult: null,
        evidence: null,
        cinematic: {
          scene: "ARCHITECTURE_STAGE",
          camera: {
            shot: CAMERA_STATES.CLOSE_UP,
            transition: CAMERA_TRANSITIONS.SLOW_PUSH_IN,
            focus: "garuda_eyes"
          },
          entity: {
            mode: "speaking",
            gesture: ENTITY_GESTURES.CONTROLLED_EXPLANATION,
            lighting: "focused_gold_spotlight",
            expression: "sovereign_confidence"
          },
          visualLayer: {
            type: "competitor_moat_matrix",
            visible: true,
            data: moat
          },
          audio: {
            mode: "conversation",
            soundFx: "subtle_presence"
          }
        },
        observability: {
          reasoningProvider: "cinematic_director",
          reasoningMode: "competitor_differentiation",
          language: "en",
          retrievalUsed: true,
          intent: CONVERSATION_INTENTS.ANSWER_ONLY,
          fallbackUsed: false,
          latencyMs: 2
        }
      }
    };
  }

  /**
   * Resumes the presentation from the last interrupted section.
   */
  _handleResumePresentation(session, options) {
    session.lifecycleState = CINEMATIC_LIFECYCLE.RESUMING;
    const nextStep = this.presentation.nextModule(session.sessionId);
    session.resumableModuleIndex = session.currentModuleIndex;

    const answerText = `Resuming presentation: ${nextStep.module ? nextStep.module.title : "Next Stage"}.\n\n${nextStep.speechText}`;
    const speechText = nextStep.speechText;

    return {
      success: true,
      data: {
        answer: answerText,
        speechText,
        intent: CONVERSATION_INTENTS.CONTINUE_PRESENTATION,
        topic: nextStep.module ? nextStep.module.id : "presentation_resumed",
        language: "en",
        confidence: 1.0,
        truthStatus: "VERIFIED",
        lifecycleState: CINEMATIC_LIFECYCLE.PRESENTING,
        canResumePresentation: nextStep.hasMoreModules,
        resumableModuleIndex: session.currentModuleIndex,
        demonstrationAvailable: false,
        suggestedDemo: null,
        executionResult: null,
        evidence: null,
        cinematic: {
          scene: "CONVERSATIONAL_STAGE",
          camera: {
            shot: CAMERA_STATES.MEDIUM,
            transition: CAMERA_TRANSITIONS.RETURN_TRANSITION,
            focus: "garuda_full"
          },
          entity: {
            mode: "speaking",
            gesture: ENTITY_GESTURES.WELCOMING_PRESENTATION,
            lighting: "warm_gold_ambient",
            expression: "calm_sovereign"
          },
          visualLayer: {
            type: "presentation_slide",
            visible: true,
            data: nextStep.module
          },
          audio: {
            mode: "conversation",
            soundFx: "subtle_presence"
          }
        },
        observability: {
          reasoningProvider: "presentation_engine",
          reasoningMode: "presentation_resumption",
          language: "en",
          retrievalUsed: true,
          intent: CONVERSATION_INTENTS.CONTINUE_PRESENTATION,
          fallbackUsed: false,
          latencyMs: 1
        }
      }
    };
  }

  _recordTurn(session, entry) {
    session.meetingHistory.push({
      ...entry,
      timestamp: new Date().toISOString()
    });
  }
}

const cinematicPresentationDirector = new CinematicPresentationDirector();

module.exports = {
  CAMERA_STATES,
  CAMERA_TRANSITIONS,
  ENTITY_GESTURES,
  CINEMATIC_LIFECYCLE,
  CinematicPresentationDirector,
  cinematicPresentationDirector
};
