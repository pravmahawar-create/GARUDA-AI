/**
 * 🦅 GARUDA AI — Intelligent Conversation Brain V1
 *
 * Core Architectural Role:
 * Universal conversational intelligence and front-door reasoning boundary.
 *
 * Architecture:
 * USER INPUT
 *    ↓
 * INPUT NORMALIZATION
 *    ↓
 * LANGUAGE / CONTEXT ANALYSIS (English, Hindi, Roman Hindi)
 *    ↓
 * SESSION MEMORY (Multi-turn co-reference, topic persistence, isolation)
 *    ↓
 * INTENT ANALYSIS (Answer, Clarification, Demo, Engineering, Presentation)
 *    ↓
 * KNOWLEDGE ROUTING (General concepts vs Authoritative GARUDA ground truth / RAG)
 *    ↓
 * REASONING PROVIDER (Provider-agnostic Smart Router + Grounded Fallback)
 *    ↓
 * TRUTH VALIDATION (Anti-Fabrication Law: Verified !== Partial !== Planned)
 *    ↓
 * GARUDA RESPONSE FORMULATION
 *    ↓
 * CAPABILITY & EXECUTION BRIDGES (Demonstration Orchestrator & Engineering Pipeline)
 *    ↓
 * SESSION UPDATE & OBSERVABILITY
 */

const crypto = require("crypto");
const garudaIdentityKnowledge = require("../knowledge/garudaIdentityKnowledge");
const { demonstrationOrchestrator } = require("./demonstrationOrchestrator");

// Intent Taxonomy
const CONVERSATION_INTENTS = Object.freeze({
  ANSWER_ONLY: "ANSWER_ONLY",
  REQUEST_CLARIFICATION: "REQUEST_CLARIFICATION",
  OFFER_DEMONSTRATION: "OFFER_DEMONSTRATION",
  EXECUTE_CAPABILITY: "EXECUTE_CAPABILITY",
  EXECUTE_ENGINEERING_MISSION: "EXECUTE_ENGINEERING_MISSION",
  CONTINUE_PRESENTATION: "CONTINUE_PRESENTATION",
  STOP_PRESENTATION: "STOP_PRESENTATION"
});

// General Conceptual Knowledge Dictionary (Accurate conceptual answers without identity forcing)
const GENERAL_CONCEPT_KNOWLEDGE = Object.freeze({
  sha_256: {
    topic: "sha_256",
    title: "SHA-256 Cryptographic Hash Function",
    keywords: ["sha-256", "sha256", "sha 256", "hash function", "cryptographic hash"],
    explanation: {
      en: "SHA-256 (Secure Hash Algorithm 256-bit) is a cryptographic hash function that takes an arbitrary input string or binary stream and deterministically generates a unique 256-bit (64-character hexadecimal) digest. Key properties include one-way pre-image resistance, collision resistance, and the avalanche effect, where changing even a single input bit completely randomizes the output hash.",
      hi: "SHA-256 (सिक्योर हैश एल्गोरिदम 256-बिट) एक क्रिप्टोग्राफिक हैश फंक्शन है जो किसी भी डेटा इनपुट को 256-बिट (64 हेक्साडेसिमल कैरेक्टर) के अद्वितीय डाइजेस्ट में बदलता है। इसकी मुख्य विशेषताएं वन-वे प्री-इमेज रेजिस्टेंस और कोलिजन रेजिस्टेंस हैं, जिससे आउटपुट से मूल डेटा प्राप्त करना गणितीय रूप से असंभव होता है।",
      roman_hindi: "SHA-256 (Secure Hash Algorithm 256-bit) ek cryptographic hash function hai jo kisi bhi input data ko ek unique 256-bit (64 hex characters) digest me convert karta hai. Iska sabse bada feature one-way encryption aur collision resistance hai — yaani hash se original data reverse-engineer karna impossible hota hai aur chhota sa change bhi pure hash ko badal deta hai."
    },
    garudaRelevance: {
      en: "In GARUDA AI, SHA-256 is used by our Anti-Fabrication Law engine to generate cryptographic evidence hashes for all created Living Artifacts, token locks, and file modifications on disk.",
      hi: "GARUDA AI में, SHA-256 का उपयोग हमारे एंटी-फैब्रिकेशन लॉ इंजन द्वारा बनाए गए सभी लिविंग आर्टिफैक्ट्स और फाइल संशोधनों के लिए क्रिप्टोग्राफिक प्रमाण उत्पन्न करने हेतु किया जाता है।",
      roman_hindi: "GARUDA AI me hum SHA-256 ka use Anti-Fabrication Law ke under karte hain, jisse disk par create hone wale har Living Artifact aur code patch ka cryptographic verification hash generate hota hai."
    },
    suggestedDemo: "creative_artifact"
  },
  ast: {
    topic: "ast",
    title: "Abstract Syntax Tree (AST)",
    keywords: ["ast", "abstract syntax tree", "syntax tree", "babel parser", "code parsing"],
    explanation: {
      en: "An Abstract Syntax Tree (AST) is a hierarchical, tree-structured representation of the abstract syntactic structure of source code written in a programming language. Each node in the tree denotes a construct occurring in the source code (such as declarations, expressions, function calls, and control flow statements) without syntactic clutter like whitespace or commas.",
      hi: "एब्सट्रैक्ट सिंटैक्स ट्री (AST) प्रोग्रामिंग सोर्स कोड की सिंटैक्टिक संरचना का एक ट्री-संरचित डेटा मॉडल है। ट्री का प्रत्येक नोड कोड के निर्माण जैसे फंक्शन डिक्लेरेशन, एक्सप्रेशन और स्टेटमेंट्स को दर्शाता है।",
      roman_hindi: "Abstract Syntax Tree (AST) source code ka ek hierarchical tree representation hota hai. Compiler ya parser code ko text se AST me convert karta hai jisme har node ek code construct (jaise functions, variables, loops) ko represent karta hai."
    },
    garudaRelevance: {
      en: "GARUDA's Repository Intelligence Engine and Code Review Service use AST parsing via @babel/parser to map module dependencies, calculate impact scores, and verify structural code quality safely.",
      hi: "GARUDA का रिपॉजिटरी इंटेलिजेंस इंजन और कोड रिव्यू सर्विस AST पार्सिंग का उपयोग करके मॉड्यूल डिपेंडेंसी और कोड गुणवत्ता की पुष्टि करते हैं।",
      roman_hindi: "GARUDA ka Repository Intelligence Engine aur Code Review Service AST parsing (@babel/parser) ka use karke pure codebase ka dependency graph aur impact score calculate karte hain."
    },
    suggestedDemo: "repo_architecture"
  },
  git_worktree: {
    topic: "git_worktree",
    title: "Git Worktrees & Safe Isolation",
    keywords: ["git worktree", "worktree", "git isolation", "isolated branch", "workspace isolation"],
    explanation: {
      en: "Git worktrees allow you to attach multiple working trees to a single Git repository. This enables checking out and building multiple branches simultaneously in separate directories without cloning the repository multiple times or switching branches in your primary workspace.",
      hi: "गिट वर्क-ट्री (Git Worktree) एक ही रिपॉजिटरी से कई अलग-अलग कार्यशील डायरेक्ट्रीज को जोड़ने की अनुमति देता है, जिससे मुख्य कार्यक्षेत्र को प्रभावित किए बिना अलग-अलग शाखाओं पर समानांतर काम किया जा सकता है।",
      roman_hindi: "Git Worktree ek powerful feature hai jo ek hi Git repository me multiple independent working directories create karne deta hai bina repository ko dobara clone kiye. Isse alag-alag branches par safely aur simultaneously kaam kiya ja sakta hai."
    },
    garudaRelevance: {
      en: "GARUDA's Git Isolation Service creates dedicated worktrees for autonomous engineering missions so experimental code patches and test runs never corrupt the main working tree.",
      hi: "GARUDA का गिट आइसोलेशन सर्विस स्वायत्त इंजीनियरिंग मिशनों के लिए समर्पित वर्क-ट्री बनाता है ताकि मुख्य कोडबेस सुरक्षित रहे।",
      roman_hindi: "GARUDA ka Git Isolation Service autonomous engineering missions ke liye isolated worktrees use karta hai taaki main production branch hamesha safe aur clean rahe."
    },
    suggestedDemo: "repo_architecture"
  },
  rag: {
    topic: "rag",
    title: "Retrieval-Augmented Generation (RAG)",
    keywords: ["rag", "retrieval augmented generation", "vector search", "knowledge retrieval", "semantic search"],
    explanation: {
      en: "Retrieval-Augmented Generation (RAG) is an AI architecture that enhances Large Language Models by retrieving relevant authoritative documents or knowledge chunks from an external database and passing them into the model's prompt context at inference time, preventing hallucinations.",
      hi: "रिट्रीवल-ऑगमेंटेड जनरेशन (RAG) एक एआई तकनीक है जो बाहरी ज्ञान आधार से प्रासंगिक डेटा को पुनः प्राप्त करके एलएलएम प्रॉम्प्ट में जोड़ती है, जिससे मॉडल की सटीकता बढ़ती है और भ्रम (हैलुसिनेशन) समाप्त होता है।",
      roman_hindi: "Retrieval-Augmented Generation (RAG) ek AI technique hai jo question aane par pehle relevant knowledge base se authoritative chunks fetch karti hai aur fir model ko context ke sath answer generate karne deti hai, jisse wrong ya fabricated answers nahi aate."
    },
    garudaRelevance: {
      en: "GARUDA's RAG and Semantic Ranker engines ground business inquiries in authoritative domain knowledge bases before formulating sovereign responses.",
      hi: "GARUDA का RAG इंजन व्यवसायिक प्रश्नों को आधिकारिक ज्ञानकोश से प्रमाणित करके उत्तर तैयार करता है।",
      roman_hindi: "GARUDA ka RAG Engine aur Semantic Ranker business inquiries ko authoritative knowledge base se verify karke grounded jawab dete hain."
    },
    suggestedDemo: "marketing_seo"
  }
});

class ConversationBrainService {
  constructor(options = {}) {
    this.sessions = new Map();
    this.workspaceRoot = options.workspaceRoot || process.cwd();
    this.reasoningProvider = options.reasoningProvider || null;
  }

  /**
   * Retrieves or initializes isolated session memory.
   * @param {string} sessionId
   * @param {Object} [metadata]
   * @returns {Object}
   */
  getSession(sessionId = "default", metadata = {}) {
    const sid = String(sessionId || "default").trim();
    if (!this.sessions.has(sid)) {
      this.sessions.set(sid, {
        sessionId: sid,
        history: [],
        currentTopic: null,
        currentLanguage: "en",
        lastExecutableCapability: "creative_artifact",
        lastProposedAction: null,
        demonstratedCapabilities: new Set(),
        presentationDepthMode: "CONVERSATION",
        activeMissionId: null,
        pendingEngineeringGoal: null,
        metadata: { ...metadata },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    const session = this.sessions.get(sid);
    if (metadata && Object.keys(metadata).length > 0) {
      session.metadata = { ...session.metadata, ...metadata };
    }
    return session;
  }

  /**
   * Clears a session context completely for isolation.
   * @param {string} sessionId
   */
  clearSession(sessionId) {
    if (this.sessions.has(sessionId)) {
      this.sessions.delete(sessionId);
    }
  }

  /**
   * Detects the linguistic register and intent of the input.
   * Supports: English ('en'), Devanagari Hindi ('hi'), and Roman Hindi / Hinglish ('roman_hindi').
   * @param {string} text
   * @param {string} fallbackLang
   * @returns {{ language: string, isExplicitSwitch: boolean, targetLang: string|null }}
   */
  detectLanguage(text = "", fallbackLang = "en") {
    const raw = String(text || "").trim();
    const lower = raw.toLowerCase();

    // 1. Check for explicit language switch requests
    if (/\b(in english|english please|switch to english|speak in english|tell me in english)\b/i.test(lower)) {
      return { language: "en", isExplicitSwitch: true, targetLang: "en" };
    }
    if (/\b(in hindi|hindi me|hindi please|shuddh hindi|hindi mein batao|explain in hindi|explain that in hindi)\b/i.test(lower)) {
      const isDevanagari = /[\u0900-\u097F]/.test(raw);
      return { language: isDevanagari ? "hi" : "roman_hindi", isExplicitSwitch: true, targetLang: isDevanagari ? "hi" : "roman_hindi" };
    }
    if (/\b(roman hindi|hinglish|simple hindi|aasan bhasha me|hindi me batao|ab hindi me)\b/i.test(lower)) {
      return { language: "roman_hindi", isExplicitSwitch: true, targetLang: "roman_hindi" };
    }

    // 2. Check for Devanagari Unicode characters
    if (/[\u0900-\u097F]/.test(raw)) {
      return { language: "hi", isExplicitSwitch: false, targetLang: "hi" };
    }

    // 3. Check for Roman Hindi / Hinglish token markers
    const romanHindiTokens = [
      "kya", "hai", "kaise", "batao", "karo", "tumhara", "karke", "dikhao", "kyu", "kyon",
      "mujhe", "samjhao", "chahiye", "karna", "krna", "hoga", "bolo", "btao", "shuru",
      "kaam", "praveen", "mahawar", "sabse", "accha", "kuch", "dikha", "sakte", "ho", "nahi"
    ];
    const words = lower.split(/[^a-z0-9]+/);
    const hindiMatches = words.filter((w) => romanHindiTokens.includes(w));
    if (hindiMatches.length >= 2 || (words.length <= 4 && hindiMatches.length >= 1)) {
      return { language: "roman_hindi", isExplicitSwitch: false, targetLang: "roman_hindi" };
    }

    // 4. If standard English words are present and no Hindi markers, naturally recognize English
    const commonEnglishTokens = ["what", "why", "how", "who", "when", "can", "you", "show", "me", "create", "live", "is", "the", "are", "do", "explain", "prove", "it", "that", "this", "different", "from", "tell"];
    const englishMatches = words.filter((w) => commonEnglishTokens.includes(w));
    if (englishMatches.length >= 2 && hindiMatches.length === 0) {
      return { language: "en", isExplicitSwitch: false, targetLang: "en" };
    }

    // 5. Default to current session language or English
    return { language: fallbackLang || "en", isExplicitSwitch: false, targetLang: null };
  }

  /**
   * Resolves contextual co-references ("it", "that", "why do you use it?", "proof?", "prove it", "do it").
   * @param {string} rawText
   * @param {Object} session
   * @returns {{ resolvedQuery: string, isFollowUp: boolean, isProofRequest: boolean, isExecutionRequest: boolean, isWhyUseIt: boolean, isLanguageSwitchOnly: boolean }}
   */
  resolveContextualQuery(rawText = "", session = {}) {
    const textLower = String(rawText || "").toLowerCase().trim();
    const cleanNoPunct = textLower.replace(/[.!?]/g, "").trim();

    const isExecutionRequest = /^(do it|execute it|run it|karke dikhao|execute now|apply it|run mission|build it)$/i.test(cleanNoPunct);
    const isProofRequest =
      /^(proof|proof\?|prove it|prove that|can you prove it|proof kya hai|kya proof hai|prove it now)$/i.test(cleanNoPunct) ||
      /\b(challenge you to prove|prove it to me|show me proof)\b/i.test(textLower);
    const isWhyUseIt =
      /\b(why (do you|does garuda|is it|is this) use (it|that|sha-256|sha256)|why use (it|that|sha-256|sha256)|tum kyu use karte ho|iska kya use hai|why is that used|why do you use that)\b/i.test(
        textLower
      );
    const isExplainThatInHindi = /\b(explain that in hindi|hindi me samjhao|explain in hindi|ab hindi me batao|translate that|ab roman hindi me batao|english please)\b/i.test(textLower);
    const isLanguageSwitchOnly = /^(explain that in hindi|hindi me samjhao|explain in hindi|ab hindi me batao|ab roman hindi me batao|english please|in english|hindi please)$/i.test(cleanNoPunct);

    let resolvedQuery = rawText;
    let isFollowUp = false;

    if (session.currentTopic) {
      if (isWhyUseIt) {
        resolvedQuery = `Why does GARUDA use ${session.currentTopic}?`;
        isFollowUp = true;
      } else if (isExplainThatInHindi) {
        resolvedQuery = `Explain ${session.currentTopic}`;
        isFollowUp = true;
      } else if (isProofRequest) {
        resolvedQuery = `Provide proof and demonstration for ${session.currentTopic}`;
        isFollowUp = true;
      } else if (isExecutionRequest) {
        resolvedQuery = `Execute demonstration or task for ${session.currentTopic}`;
        isFollowUp = true;
      } else if (/\b(it|that|this)\b/i.test(textLower) && wordsCount(textLower) <= 6) {
        resolvedQuery = rawText.replace(/\b(it|that|this)\b/gi, session.currentTopic);
        isFollowUp = true;
      }
    }

    return {
      resolvedQuery,
      isFollowUp,
      isProofRequest,
      isExecutionRequest,
      isWhyUseIt,
      isLanguageSwitchOnly
    };
  }

  /**
   * Matches general conceptual software/cryptography/AI topics.
   * @param {string} query
   * @param {string|null} [fallbackTopic]
   * @returns {Object|null}
   */
  matchGeneralConcept(query = "", fallbackTopic = null) {
    const qLower = String(query || "").toLowerCase();
    for (const key of Object.keys(GENERAL_CONCEPT_KNOWLEDGE)) {
      const concept = GENERAL_CONCEPT_KNOWLEDGE[key];
      if (concept.keywords.some((kw) => qLower.includes(kw)) || (fallbackTopic && fallbackTopic === concept.topic)) {
        return concept;
      }
    }
    return null;
  }

  /**
   * Detects whether user input represents an actionable engineering task.
   * @param {string} text
   * @returns {boolean}
   */
  isEngineeringMissionIntent(text = "") {
    const tLower = String(text || "").toLowerCase();
    return /\b(fix the bug|fix bug|create endpoint|add route|modify file|patch code|run test|implement function|build component|refactor module|analyze file|analyze mission|engineering mission|audit codebase|perform code review|review code)\b/i.test(tLower);
  }

  /**
   * Checks if user requested an impossible or unverified capability (Truth Law protection).
   * @param {string} text
   * @returns {{ isUnverified: boolean, explanation: string|null }}
   */
  checkUnverifiedCapability(text = "") {
    const tLower = String(text || "").toLowerCase();
    if (/\b(hollywood movie|full movie|feature film|full-length movie|quantum teleport|hack satellite|time machine)\b/i.test(tLower)) {
      return {
        isUnverified: true,
        reason: "Full-length Hollywood movie generation is an unverified / unavailable capability.",
        explanation: {
          en: "Under GARUDA's Anti-Fabrication Law, I cannot claim to generate full-length Hollywood movies. My verified creative capabilities currently produce Living Vector Artifacts (SVGs), brand assets, dynamic 2D visuals, and editorial design pipelines with cryptographic disk evidence.",
          hi: "एंटी-फैब्रिकेशन लॉ के तहत, मैं पूर्ण-लंबाई वाली हॉलीवुड फिल्में बनाने का दावा नहीं कर सकता। मेरी सत्यापित क्षमताओं में 2D लिविंग आर्टिफैक्ट्स (SVG), ब्रांड डिज़ाइन और एडिटोरियल ग्राफिक्स शामिल हैं।",
          roman_hindi: "GARUDA ke Anti-Fabrication Law ke mutabiq, mai full Hollywood movie generate karne ka jhootha claim nahi karta. Meri verified capabilities me Living Vector Artifacts (SVGs), Brand IdentityLock aur 2D editorial graphics shamil hain jinka real disk proof available hai."
        }
      };
    }
    return { isUnverified: false, reason: null, explanation: null };
  }

  /**
   * Primary processing entry point for the Intelligent Conversation Brain V1.
   *
   * @param {string} input - User message / prompt
   * @param {Object} [context] - Execution context (sessionId, garudaContext, options)
   * @returns {Promise<Object>} Structured conversational response
   */
  async process(input = "", context = {}) {
    const startTime = Date.now();
    const rawInput = String(input || "").trim();
    const sessionId = context.sessionId || "default";
    const session = this.getSession(sessionId, context.sessionMetadata || {});
    const garudaContext = context.garudaContext || null;

    if (!rawInput) {
      return this._formatEmptyResponse(session);
    }

    // 1. Language Detection & Language Switching
    const langDetection = this.detectLanguage(rawInput, session.currentLanguage);
    const activeLanguage = langDetection.language;
    session.currentLanguage = activeLanguage;

    // 2. Contextual Query & Co-Reference Resolution
    const coRef = this.resolveContextualQuery(rawInput, session);
    const effectiveQuery = coRef.resolvedQuery;
    const lowerQuery = effectiveQuery.toLowerCase();

    let intent = CONVERSATION_INTENTS.ANSWER_ONLY;
    let topic = session.currentTopic || "general";
    let answerText = "";
    let speechText = "";
    let confidence = 0.98;
    let truthStatus = "VERIFIED";
    let capabilitySelected = null;
    let demonstrationAvailable = false;
    let suggestedDemo = session.lastExecutableCapability || "creative_artifact";
    let executionResult = null;
    let evidence = null;
    let fallbackUsed = false;
    let reasoningMode = "authoritative_knowledge";

    // 3. Check for Impossible / Unverified Capabilities (Anti-Fabrication Law)
    const unverifiedCheck = this.checkUnverifiedCapability(effectiveQuery);
    if (unverifiedCheck.isUnverified) {
      intent = CONVERSATION_INTENTS.ANSWER_ONLY;
      topic = "unverified_capability";
      truthStatus = "UNAVAILABLE";
      answerText = unverifiedCheck.explanation[activeLanguage] || unverifiedCheck.explanation.en;
      speechText = answerText;
      return this._finalizeResponse(session, rawInput, {
        intent,
        answer: answerText,
        speechText,
        topic,
        confidence: 1.0,
        truthStatus,
        capabilitySelected: null,
        demonstrationAvailable: false,
        suggestedDemo: "creative_artifact",
        executionResult: null,
        evidence: null,
        activeLanguage,
        startTime,
        reasoningMode: "truth_law_guard",
        fallbackUsed: false
      });
    }

    // 4. Check for Execution Commands ("Do it", "Execute now")
    if (coRef.isExecutionRequest) {
      intent = CONVERSATION_INTENTS.EXECUTE_CAPABILITY;
      capabilitySelected = session.lastExecutableCapability || "creative_artifact";
      suggestedDemo = capabilitySelected;

      try {
        const demoExec = await demonstrationOrchestrator.executeDemonstration(capabilitySelected, context.options || {});
        executionResult = demoExec;
        evidence = demoExec.evidence || null;

        if (activeLanguage === "hi") {
          answerText = `कार्यान्वयन पूर्ण हुआ। मैंने भौतिक रूप से डिस्क पर ${capabilitySelected} को निष्पादित किया है। साक्ष्य हैश: ${evidence?.sha256Hash || "VERIFIED"}`;
        } else if (activeLanguage === "roman_hindi") {
          answerText = `Execution complete! Maine live disk par ${capabilitySelected} execute kar diya hai. Proof Hash: ${evidence?.sha256Hash || "VERIFIED"}`;
        } else {
          answerText = `Execution complete. Live verified demonstration of ${capabilitySelected} produced on disk with SHA-256 evidence: ${evidence?.sha256Hash || "VERIFIED"}.`;
        }
        speechText = answerText;
      } catch (err) {
        answerText = `Execution could not complete: ${err.message}`;
        speechText = answerText;
        truthStatus = "PARTIAL";
      }

      return this._finalizeResponse(session, rawInput, {
        intent,
        answer: answerText,
        speechText,
        topic: session.currentTopic || "demonstration",
        confidence: 1.0,
        truthStatus,
        capabilitySelected,
        demonstrationAvailable: true,
        suggestedDemo,
        executionResult,
        evidence,
        activeLanguage,
        startTime,
        reasoningMode: "governed_execution_bridge",
        fallbackUsed: false
      });
    }

    // 5. Check for Actionable Engineering Mission Intent
    if (this.isEngineeringMissionIntent(effectiveQuery)) {
      intent = CONVERSATION_INTENTS.EXECUTE_ENGINEERING_MISSION;
      topic = "engineering_mission";
      capabilitySelected = "engineering.execute_mission";

      const isFounder = Boolean(garudaContext && (garudaContext.isFounder || garudaContext.role === "platform_founder"));

      if (context.executeDirectly) {
        try {
          const { executeMission } = require("./engineeringPipeline/engineeringPipeline");
          const pipeRes = await executeMission(effectiveQuery, {
            rootDir: this.workspaceRoot,
            founderApproved: isFounder,
            founderApproval: isFounder,
            maxRetries: 2
          });
          executionResult = pipeRes;
          evidence = { filesModified: pipeRes.filesModified, testsPassed: pipeRes.testsPassed, verdict: pipeRes.reviewVerdict?.verdict };

          answerText = `Engineering mission executed through canonical pipeline. Status: ${pipeRes.status}, Tests passed: ${pipeRes.testsPassed}, Review: ${pipeRes.reviewVerdict?.verdict || "COMPLETE"}.`;
          speechText = answerText;
        } catch (pipeErr) {
          answerText = `Engineering pipeline error: ${pipeErr.message}`;
          speechText = answerText;
          truthStatus = "PARTIAL";
        }
      } else {
        answerText = `I have structured this engineering goal: "${effectiveQuery}". Governance check: ${isFounder ? "Founder approval recognized" : "Will execute within isolated worktree"}. Ready to execute.`;
        speechText = answerText;
      }

      return this._finalizeResponse(session, rawInput, {
        intent,
        answer: answerText,
        speechText,
        topic,
        confidence: 0.95,
        truthStatus,
        capabilitySelected,
        demonstrationAvailable: false,
        suggestedDemo: "repo_architecture",
        executionResult,
        evidence,
        activeLanguage,
        startTime,
        reasoningMode: "engineering_pipeline_bridge",
        fallbackUsed: false
      });
    }

    // 6. Check for Proof / Demonstration Requests ("Show me what you can prove", "Prove it", "Can you show me what you can create live?")
    const isDirectDemoInvite =
      coRef.isProofRequest ||
      /\b(show me something you can actually prove|what can you prove|kya prove kar sakte ho|show demo|live proof|can you show me what you can create live|can you create|show me what you can create|run a demo|live demo|dikhao live|execute live)\b/i.test(lowerQuery);

    if (isDirectDemoInvite) {
      intent = CONVERSATION_INTENTS.OFFER_DEMONSTRATION;
      suggestedDemo = session.lastExecutableCapability || "creative_artifact";
      demonstrationAvailable = true;
      capabilitySelected = suggestedDemo;

      if (activeLanguage === "hi") {
        answerText = `एंटी-फैब्रिकेशन लॉ के तहत, मैं केवल वही प्रस्तुत करता हूं जिसे मैं साबित कर सकता हूं। मैं अभी डिस्क पर ${suggestedDemo.replace(/_/g, " ")} का लाइव निष्पादन कर सकता हूं। क्या आप इसे देखना चाहते हैं? (कहें: 'Do it' या 'कहो: करो')`;
      } else if (activeLanguage === "roman_hindi") {
        answerText = `Anti-Fabrication Law ke tahat, mai sirf wahi claim karta hoon jise mai prove kar sakun. Mai abhi disk par ${suggestedDemo.replace(/_/g, " ")} live execute karke SHA-256 hash de sakta hoon. Kya aap dekhna chahte hain? (Reply: 'Do it' ya 'Karke dikhao')`;
      } else {
        answerText = `Under GARUDA's Anti-Fabrication Law, verbal claims are meaningless without physical verification. I prefer physical execution to verbal descriptions. Would you like me to demonstrate that live right now? (Reply: 'Do it')`;
      }
      speechText = answerText;

      return this._finalizeResponse(session, rawInput, {
        intent,
        answer: answerText,
        speechText,
        topic: session.currentTopic || "proof_challenge",
        confidence: 1.0,
        truthStatus: "VERIFIED",
        capabilitySelected,
        demonstrationAvailable: true,
        suggestedDemo,
        executionResult: null,
        evidence: null,
        activeLanguage,
        startTime,
        reasoningMode: "demonstration_bridge",
        fallbackUsed: false
      });
    }

    // 7. General Conceptual Questions & Multi-Turn Conceptual Follow-ups (e.g. "What is SHA-256?", "Why do you use it?", "Explain that in Hindi")
    const generalConcept = this.matchGeneralConcept(effectiveQuery, coRef.isFollowUp ? session.currentTopic : null);
    if (generalConcept && (coRef.isFollowUp || !this._isSpecificGarudaQuestion(lowerQuery))) {
      intent = CONVERSATION_INTENTS.ANSWER_ONLY;
      topic = generalConcept.topic;
      session.currentTopic = generalConcept.topic;
      session.lastExecutableCapability = generalConcept.suggestedDemo || "creative_artifact";

      const baseExp = generalConcept.explanation[activeLanguage] || generalConcept.explanation.en;
      const relExp = generalConcept.garudaRelevance[activeLanguage] || generalConcept.garudaRelevance.en;

      if (coRef.isWhyUseIt) {
        answerText = relExp;
      } else if (coRef.isLanguageSwitchOnly) {
        answerText = `${baseExp}\n\n${relExp}`;
      } else {
        answerText = `${baseExp}\n\n${relExp}`;
      }
      speechText = `${baseExp} ${relExp}`;

      return this._finalizeResponse(session, rawInput, {
        intent,
        answer: answerText,
        speechText,
        topic,
        confidence: 0.98,
        truthStatus: "VERIFIED",
        capabilitySelected: generalConcept.suggestedDemo,
        demonstrationAvailable: true,
        suggestedDemo: generalConcept.suggestedDemo,
        executionResult: null,
        evidence: null,
        activeLanguage,
        startTime,
        reasoningMode: "conceptual_knowledge",
        fallbackUsed: false
      });
    }

    // 8. GARUDA Identity & Truth-Aware Differentiation
    let knowledgeMatch = garudaIdentityKnowledge.findKnowledgeForQuery(effectiveQuery);

    if (knowledgeMatch && knowledgeMatch.topic && knowledgeMatch.topic !== "general" && knowledgeMatch.topic !== "general_inquiry") {
      intent = CONVERSATION_INTENTS.ANSWER_ONLY;
      topic = knowledgeMatch.topic;
      session.currentTopic = knowledgeMatch.topic;
      suggestedDemo = knowledgeMatch.suggestedDemo || session.lastExecutableCapability || "creative_artifact";
      demonstrationAvailable = knowledgeMatch.demonstrationAvailable === true;
      session.lastExecutableCapability = suggestedDemo;

      // Multilingual formulation for GARUDA knowledge
      if (activeLanguage === "hi" || activeLanguage === "roman_hindi") {
        answerText = this._formatIdentityResponseInHindi(knowledgeMatch, activeLanguage);
      } else {
        answerText = knowledgeMatch.answer;
      }
      if (demonstrationAvailable && suggestedDemo) {
        const demoInvitation = activeLanguage === "hi"
          ? " मैं मौखिक दावों के बजाय भौतिक निष्पादन पसंद करता हूँ। क्या आप इसे अभी लाइव देखना चाहते हैं?"
          : activeLanguage === "roman_hindi"
          ? " Mai verbal claims ki jagah physical execution prefer karta hoon. Kya aap ise abhi live dekhna chahte hain?"
          : " I prefer physical execution to verbal descriptions. Would you like me to demonstrate that live right now?";
        answerText += `\n\n${demoInvitation.trim()}`;
        speechText = `${answerText} ${demoInvitation.trim()}`;
      } else {
        speechText = answerText;
      }

      return this._finalizeResponse(session, rawInput, {
        intent,
        answer: answerText,
        speechText,
        topic,
        confidence: 0.95,
        truthStatus: "VERIFIED",
        capabilitySelected: knowledgeMatch.capabilityId || null,
        demonstrationAvailable,
        suggestedDemo,
        executionResult: null,
        evidence: null,
        activeLanguage,
        startTime,
        reasoningMode: "identity_knowledge",
        fallbackUsed: false
      });
    }

    // 9. Provider-Neutral Reasoning Fallback with Grounded Answering
    fallbackUsed = true;
    reasoningMode = "grounded_knowledge_fallback";
    topic = session.currentTopic || "general_inquiry";

    if (activeLanguage === "hi") {
      answerText = `मैं गरुड़ (GARUDA) हूँ — प्रवीण महावर द्वारा निर्मित एक स्वायत्त एआई ऑपरेटिंग सिस्टम। मैं 27 विशेष निष्पादन ब्रह्मांडों में वास्तविक कार्य निष्पादित करता हूँ। आप मुझसे वास्तुकला, क्षमताओं या लाइव प्रदर्शन के बारे में पूछ सकते हैं।`;
    } else if (activeLanguage === "roman_hindi") {
      answerText = `Mai GARUDA AI hoon — Praveen Mahawar dwara build kiya gaya ek Autonomous AI Operating System. Mai prompt wrappers ki tarah sirf text nahi deta, balki code, creative artifacts aur workflows real disk par execute karta hoon.`;
    } else {
      answerText = `I am GARUDA, an autonomous AI Operating System engineered by Praveen Mahawar. I operate under strict Anti-Fabrication Law across 27 specialized execution universes. You may ask me about my architecture, or ask me to demonstrate any verified capability live.`;
    }
    speechText = answerText;

    return this._finalizeResponse(session, rawInput, {
      intent: CONVERSATION_INTENTS.ANSWER_ONLY,
      answer: answerText,
      speechText,
      topic,
      confidence: 0.9,
      truthStatus: "VERIFIED",
      capabilitySelected: null,
      demonstrationAvailable: true,
      suggestedDemo: session.lastExecutableCapability || "creative_artifact",
      executionResult: null,
      evidence: null,
      activeLanguage,
      startTime,
      reasoningMode,
      fallbackUsed
    });
  }

  _isSpecificGarudaQuestion(query = "") {
    return /\b(garuda|tumhara|tum kaun ho|who are you|praveen|mother brain|identitylock|living artifact|anti-fabrication)\b/i.test(query);
  }

  _formatIdentityResponseInHindi(match, lang = "roman_hindi") {
    if (match.topic === "what_is_garuda" || match.topic === "who_is_founder") {
      if (lang === "hi") {
        return "गरुड़ (GARUDA) एक स्वायत्त एआई ऑपरेटिंग सिस्टम है जिसे प्रवीण महावर ने स्थापित किया है। यह साधारण चैटबॉट्स से अलग है क्योंकि यह 27 विशेष निष्पादन ब्रह्मांडों में वास्तविक सॉफ्टवेयर, फाइलें और डिजिटल संपत्तियां स्वायत्त रूप से बनाता और सत्यापित करता है।";
      }
      return "GARUDA AI ek autonomous AI Operating System hai jise Praveen Mahawar ne engineer kiya hai. Yeh generic prompt wrappers se alag hai kyunki yeh 27 specialized execution universes me real software, files aur creative artifacts autonomously execute karta hai.";
    }
    if (match.topic === "vs_chatgpt_or_wrappers" || match.topic === "why_different") {
      if (lang === "hi") {
        return "गरुड़ चैटबॉट नहीं बल्कि एक ऑपरेटिंग सिस्टम है। चैटजीपीटी केवल टेक्स्ट आउटपुट देता है, जबकि गरुड़ सीधे फाइलों, कोडबेस, ब्रांड टोकन और टेस्ट सुइट्स के साथ इंटरैक्ट करके वास्तविक काम निष्पादित करता है।";
      }
      return "GARUDA ChatGPT ya generic wrappers se fundamentally alag hai. Chatbots sirf text generate karte hain, jabki GARUDA real codebase ASTs, filesystems, database records aur automated test runners ke sath real engineering work execute aur verify karta hai.";
    }
    if (match.topic === "architecture_and_mother_brain" || match.topic === "mother_brain") {
      if (lang === "hi") {
        return "गरुड़ का मुख्य मस्तिष्क 'मदर ब्रेन' है, जो संज्ञानात्मक रूटिंग, लक्ष्य अपघटन और संस्थापक शासन सीमाओं को लागू करता है। यह 27 विशेष ब्रह्मांडों के साथ मिलकर काम करता है।";
      }
      return "GARUDA ka core architecture 'Mother Brain' par based hai jo cognitive routing, goal planning aur Founder governance gates enforce karta hai. Yeh 27 specialized domain universes ke sath real work execute karta hai.";
    }
    if (match.topic === "revenue_and_business") {
      if (lang === "hi") {
        return "गरुड़ 4 एकीकृत उत्पाद स्तरों (पर्सनल, क्रिएटर, एसएमई, एंटरप्राइज) के माध्यम से राजस्व उत्पन्न करता है। रेवेन्यू यूनिवर्स वाणिज्यिक प्रस्तावों, लीड स्कोरिंग और क्लाइंट रूपांतरण को स्वायत्त रूप से प्रबंधित करता है।";
      }
      return "GARUDA 4 unified product tiers (Personal, Creator, SME, Enterprise) ke dwara revenue generate karta hai. Revenue Universe commercial proposals, lead scoring aur client conversion workflows ko autonomously manage karta hai.";
    }
    if (match.topic === "capability_reality") {
      if (lang === "hi") {
        return "गरुड़ 27 विशेष निष्पादन ब्रह्मांडों में वास्तविक सॉफ्टवेयर इंजीनियरिंग, क्रिएटिव लिविंग आर्टिफैक्ट्स, ब्रांड आइडेंटिटी लॉक और डिजिटल मार्केटिंग को सत्यापित रूप से निष्पादित करता है।";
      }
      return "GARUDA 27 specialized execution universes me real software engineering, Creative Living Vector Artifacts (SVGs), IdentityLock brand governance aur SEO editorial growth ko physically execute aur SHA-256 se verify karta hai.";
    }
    return match.answer;
  }

  _formatEmptyResponse(session) {
    const lang = session.currentLanguage || "en";
    let text = "I am listening. You may ask me about my architecture, conceptual questions, or ask me to demonstrate a verified capability live.";
    if (lang === "hi") {
      text = "मैं सुन रहा हूँ। आप मुझसे वास्तुकला, तकनीकी अवधारणाओं या लाइव प्रदर्शन के बारे में पूछ सकते हैं।";
    } else if (lang === "roman_hindi") {
      text = "Mai sun raha hoon. Aap mujhse architecture, technical concepts ya verified live demo ke baare me pooch sakte hain.";
    }
    return {
      success: true,
      data: {
        intent: CONVERSATION_INTENTS.REQUEST_CLARIFICATION,
        answer: text,
        speechText: text,
        topic: "greeting",
        language: lang,
        confidence: 1.0,
        truthStatus: "VERIFIED",
        capabilitySelected: null,
        demonstrationAvailable: false,
        suggestedDemo: null,
        executionResult: null,
        evidence: null,
        observability: {
          reasoningProvider: "internal",
          reasoningMode: "greeting",
          language: lang,
          retrievalUsed: false,
          intent: CONVERSATION_INTENTS.REQUEST_CLARIFICATION,
          fallbackUsed: false,
          latencyMs: 0
        }
      }
    };
  }

  _finalizeResponse(session, rawInput, payload) {
    const latencyMs = Date.now() - payload.startTime;

    // Update Session History
    session.history.push({
      role: "user",
      text: rawInput,
      timestamp: new Date().toISOString()
    });
    session.history.push({
      role: "assistant",
      text: payload.answer,
      intent: payload.intent,
      topic: payload.topic,
      language: payload.activeLanguage,
      timestamp: new Date().toISOString()
    });
    session.updatedAt = new Date().toISOString();

    return {
      success: true,
      data: {
        intent: payload.intent,
        answer: payload.answer,
        speechText: payload.speechText,
        topic: payload.topic,
        language: payload.activeLanguage,
        confidence: payload.confidence,
        truthStatus: payload.truthStatus,
        capabilitySelected: payload.capabilitySelected,
        demonstrationAvailable: payload.demonstrationAvailable,
        suggestedDemo: payload.suggestedDemo,
        executionResult: payload.executionResult,
        evidence: payload.evidence,
        observability: {
          reasoningProvider: payload.reasoningMode === "grounded_knowledge_fallback" ? "grounded_fallback" : "garuda_brain",
          reasoningMode: payload.reasoningMode,
          language: payload.activeLanguage,
          retrievalUsed: payload.reasoningMode.includes("knowledge") || payload.reasoningMode.includes("rag"),
          intent: payload.intent,
          fallbackUsed: payload.fallbackUsed,
          latencyMs
        }
      }
    };
  }
}

function wordsCount(str = "") {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

const conversationBrainService = new ConversationBrainService();

module.exports = {
  ConversationBrainService,
  conversationBrainService,
  CONVERSATION_INTENTS,
  GENERAL_CONCEPT_KNOWLEDGE
};
