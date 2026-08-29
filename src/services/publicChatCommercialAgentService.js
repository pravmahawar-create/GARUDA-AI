/**
 * GARUDA Public Chat Commercial Intake Agent
 * Transforms generic chat into a senior solution architect & commercial intake engine.
 * Understands arbitrary business/software requests, extracts requirements progressively,
 * classifies qualification, scopes milestones, prices transparently, and generates proposals.
 *
 * Truth Law:
 * NEVER force commercial workflow or unsolicited pricing onto casual greetings,
 * general knowledge, or conversational messages.
 */

const crypto = require("crypto");
const capabilityRegistry = require("./capabilityRegistryService");
const revenueValueModel = require("./revenueValueModelService");
const clientProposalService = require("./clientProposalService");
const telegramBotService = require("./telegramBotService");
const { detectCurrency, convertToINR, inspectOpportunitySafety } = require("./discoveryAdapters/baseAdapter");

const QUALIFICATION_STATUSES = Object.freeze({
  CLEARLY_DELIVERABLE: "CLEARLY_DELIVERABLE",
  NEEDS_CLARIFICATION: "NEEDS_CLARIFICATION",
  NEEDS_HUMAN_REVIEW: "NEEDS_HUMAN_REVIEW",
  OUT_OF_CAPABILITY: "OUT_OF_CAPABILITY",
  HIGH_RISK: "HIGH_RISK",
  PROHIBITED: "PROHIBITED"
});

const GREETING_PATTERNS = [
  /^(?:hi|hello|hey|heya|howdy|hola|namaste|namaskar|good\s*(?:morning|afternoon|evening|day)|greetings)\b/i,
  /^(?:how\s*are\s*you|kya\s*haal|kem\s*cho|whats\s*up|wassup|sup)\b/i,
  /^(?:who\s*are\s*you|what\s*is\s*garuda|what\s*can\s*you\s*do|tell\s*me\s*about\s*yourself|what\s*are\s*your\s*features)\b/i
];

const CASUAL_WORDS = new Set([
  "hi", "hello", "hey", "heya", "howdy", "hola", "namaste", "namaskar",
  "thanks", "thank you", "dhanyawad", "shukriya", "ok", "okay", "cool",
  "good", "nice", "great", "bye", "goodbye", "help", "help me"
]);

function isCasualGreeting(text = "") {
  const clean = String(text || "").trim().toLowerCase();
  if (!clean) return true;
  if (CASUAL_WORDS.has(clean)) return true;
  if (GREETING_PATTERNS.some((p) => p.test(clean)) && clean.length < 60) {
    if (!/\b(build|develop|create|make\s*(?:me|a)|hire|quote|proposal|cost|price|budget|estimate|project|app|website|saas|software|bot|automation|crm)\b/i.test(clean)) {
      return true;
    }
  }
  return false;
}

function isGeneralKnowledgeOrCodeQuestion(text = "") {
  const clean = String(text || "").trim().toLowerCase();
  if (/^(?:what\s+is|explain|how\s+does|how\s+do\s+i|how\s+to|write\s+(?:a\s+)?(?:python|javascript|typescript|code|function|script|sql|query)|difference\s+between|can\s+you\s+(?:explain|tell\s+me|help\s+with|write)|tell\s+me\s+a\s+joke)\b/i.test(clean)) {
    if (!/\b(hire|quote|proposal|contract|agency|services|cost|pricing|commercial|estimate|for\s+my\s+business|build\s+us|deliver\s+a\s+project)\b/i.test(clean)) {
      return true;
    }
  }
  return false;
}

const EXPLICIT_COMMERCIAL_REGEX = /\b((?:i\s*)?(?:want|need|looking)\s*(?:to\s*build|an?\s*app|a\s*(?:custom\s*)?website|a\s*(?:custom\s*)?saas|an?\s*ai\s*agent|a\s*bot|a\s*crm|software)|build\s*me|develop\s*a|create\s*an?\s*(?:app|website|saas|bot|platform|system|portal|dashboard)|custom\s*(?:software|website|app|crm|saas|agent|bot|dashboard|portal)|software\s*development|web\s*development|mobile\s*app\s*development|ai\s*agent\s*development|saas\s*mvp|automation\s*workflow|whatsapp\s*bot|telegram\s*bot|rag\s*pipeline|crm\s*system|lead\s*generation\s*system|hire\s*developers?|looking\s*for\s*(?:a\s*)?(?:developer|engineer|agency|freelancer)|project\s*quote|cost\s*of\s*development|pricing\s*for|proposal\s*for|send\s*(?:a\s*|me\s*a\s*)?proposal|give\s*me\s*a\s*quote|what\s*is\s*(?:the|your)?\s*quote|quote\s*(?:and|&)\s*timeline|quote\s*for|how\s*much\s*(?:would\s*it\s*cost|for\s*(?:a|an)|to\s*build)|what\s*are\s*your\s*charges|what\s*is\s*the\s*cost|can\s*garuda\s*build)\b/i;

function isCommercialIntent(text = "", history = []) {
  const clean = String(text || "").trim().toLowerCase();
  if (isCasualGreeting(clean)) return false;
  if (isGeneralKnowledgeOrCodeQuestion(clean)) return false;

  // Check for explicit commercial signal
  if (EXPLICIT_COMMERCIAL_REGEX.test(clean)) return true;

  // Check if payment evidence / transaction claim
  if (/\b(paid|i\s*paid|payment\s*done|deposit\s*paid|screenshot|upi\s*ref|transaction\s*id|utr\s*(?:no|number)?)\b/i.test(clean)) {
    return true;
  }

  // Multi-turn: If prior conversation established commercial scoping
  const historyText = (history || []).map((h) => h.text || h.content || "").join(" ").toLowerCase();
  if (EXPLICIT_COMMERCIAL_REGEX.test(historyText)) {
    if (/\b(features?|platform|web|ios|android|mobile|budget|timeline|days|weeks|months|inr|usd|₹|\$|database|auth|payment|users?|yes|no|both|react|node|flutter|nextjs)\b/i.test(clean)) {
      return true;
    }
  }

  return false;
}

function parseBudgetFromConversation(text = "") {
  const clean = String(text || "").toLowerCase();
  const currency = detectCurrency(clean);

  // Parse multipliers (k, lakh, lac, m, crore, cr)
  const multiplierMatch = clean.match(/(\d+(?:\.\d+)?)\s*(k|lakh|lac|m|million|crore|cr|thousand)\b/i);
  if (multiplierMatch) {
    const base = parseFloat(multiplierMatch[1]);
    const unit = multiplierMatch[2].toLowerCase();
    let mult = 1;
    if (unit === "k" || unit === "thousand") mult = 1000;
    else if (unit === "lakh" || unit === "lac") mult = 100000;
    else if (unit === "m" || unit === "million") mult = 1000000;
    else if (unit === "crore" || unit === "cr") mult = 10000000;
    return { amount: Math.round(base * mult), currency };
  }

  // Parse raw symbols e.g. ₹25,000 or $5,000
  const symbolMatch = clean.match(/(?:[₹$€£]|aed|cad|aud|sgd|inr|usd)\s*(\d[\d,]*)/i);
  if (symbolMatch) {
    const val = parseInt(symbolMatch[1].replace(/,/g, ""), 10);
    if (val > 100 && val < 100000000) return { amount: val, currency };
  }

  return { amount: null, currency };
}

function extractRequirements(history = [], latestMessage = "") {
  const allMessages = [...history.map((h) => h.text || h.content || ""), latestMessage];
  const combined = allMessages.join(" \n ");
  const clean = combined.toLowerCase();

  // 1. Detect Platform
  const platforms = [];
  if (clean.includes("ios") || clean.includes("android") || clean.includes("mobile app") || clean.includes("flutter") || clean.includes("react native")) platforms.push("Mobile Application");
  if (clean.includes("website") || clean.includes("landing page") || clean.includes("frontend") || clean.includes("web app") || clean.includes("next.js") || clean.includes("react")) platforms.push("Web Application");
  if (clean.includes("saas") || clean.includes("portal") || clean.includes("dashboard") || clean.includes("admin")) platforms.push("SaaS Platform");
  if (clean.includes("automation") || clean.includes("workflow") || clean.includes("n8n") || clean.includes("zapier") || clean.includes("cron")) platforms.push("Automated Workflow");
  if (clean.includes("bot") || clean.includes("telegram") || clean.includes("whatsapp") || clean.includes("chatbot")) platforms.push("AI Conversational Agent");
  if (clean.includes("lead") || clean.includes("seo") || clean.includes("marketing") || clean.includes("outreach") || clean.includes("scout")) platforms.push("Lead Generation & Growth Engine");
  if (clean.includes("api") || clean.includes("backend") || clean.includes("database") || clean.includes("pipeline")) platforms.push("Backend & Data Architecture");

  const platform = platforms[0] || (clean.includes("app") ? "Custom Application" : clean.includes("site") || clean.includes("web") ? "Web Application" : "Custom AI Solution");

  // 2. Detect Key Capabilities & Features
  const features = [];
  if (clean.includes("auth") || clean.includes("login") || clean.includes("user") || clean.includes("signup")) features.push("User Authentication & Role Management");
  if (clean.includes("pay") || clean.includes("stripe") || clean.includes("razorpay") || clean.includes("subscription") || clean.includes("billing")) features.push("Secure Payment & Billing Integration");
  if (clean.includes("ai") || clean.includes("llm") || clean.includes("rag") || clean.includes("model") || clean.includes("gpt")) features.push("AI / LLM Pipeline & Knowledge Grounding");
  if (clean.includes("database") || clean.includes("mongo") || clean.includes("sql") || clean.includes("postgres")) features.push("Structured Scalable Database");
  if (clean.includes("notification") || clean.includes("email") || clean.includes("sms") || clean.includes("whatsapp")) features.push("Automated Notifications (Email/SMS/WhatsApp)");
  if (clean.includes("seo") || clean.includes("google") || clean.includes("meta")) features.push("Technical SEO & OpenGraph Microdata");

  // 3. Extract Budget & Currency
  const budgetInfo = parseBudgetFromConversation(combined);

  // 4. Missing Information Analysis
  const missing = [];
  if (!features.length) missing.push("Key functional workflows or features");
  if (!platforms.length) missing.push("Target platforms (Web, iOS, Android)");
  if (!budgetInfo.amount && !clean.includes("quote") && !clean.includes("cost") && !clean.includes("price")) missing.push("Target budget expectation");

  const hasExplicitQuoteRequest = /\b(proposal|quote|price|pricing|cost|how\s*much)\b/i.test(latestMessage);
  const hasSufficientScope = (allMessages.length >= 3 && features.length >= 1) || features.length >= 2 || (platforms.length > 0 && budgetInfo.amount) || hasExplicitQuoteRequest;

  return {
    combinedText: combined,
    platform,
    features,
    budget: budgetInfo.amount,
    currency: budgetInfo.currency,
    missing,
    hasSufficientScope,
    hasExplicitQuoteRequest
  };
}

class PublicChatCommercialAgentService {
  /**
   * Main entry point for commercial chat turns.
   * Returns { handled: false } if message is not commercial intent.
   */
  async processCommercialTurn({ message = "", history = [], conversationId = null, origin = "public_web", isTest = false }) {
    const rawMessage = String(message || "").trim();
    if (!rawMessage) return { handled: false, reply: null };

    // 0. Intent Gate: Is this message commercial/business related?
    if (!isCommercialIntent(rawMessage, history)) {
      return { handled: false, reply: null };
    }

    const isTestCall = isTest === true || rawMessage.toLowerCase().includes("[test") || rawMessage.toLowerCase().includes("live test");

    // 1. Detect Payment Claim / Screenshot Intent (Payment Truth Gate)
    if (/\b(paid|i\s*paid|payment\s*done|deposit\s*paid|screenshot|receipt|upi\s*ref|transaction\s*id|utr\s*(?:no|number)?)\b/i.test(rawMessage)) {
      return {
        handled: true,
        reply: "Thank you for sharing your payment reference. Please note that GARUDA records this as unverified payment evidence (PAYMENT_EVIDENCE_UNVERIFIED). Governed project execution begins automatically once the payment provider (Razorpay/Stripe) confirms the transaction authoritatively. You can review your verified status in your Proposal Portal.",
        qualification: "PAYMENT_CLAIM_UNVERIFIED",
        isCommercial: true
      };
    }

    // 2. Extract Context & Cumulative Requirements
    const req = extractRequirements(history, rawMessage);
    const safety = inspectOpportunitySafety({ title: rawMessage, description: req.combinedText });

    if (!safety.accepted) {
      return {
        handled: true,
        reply: "GARUDA cannot accept requests involving prohibited, age-restricted, or high-risk unauthorized operations. If you have a legitimate software, AI, or business automation project, please describe the requirements and we will be glad to assist.",
        qualification: QUALIFICATION_STATUSES.PROHIBITED,
        isCommercial: true
      };
    }

    // 3. Qualification Classification
    const assessment = capabilityRegistry.matchDemandUniversal({
      title: req.platform,
      description: req.combinedText
    });

    let qualification = QUALIFICATION_STATUSES.CLEARLY_DELIVERABLE;
    if (!req.hasSufficientScope && req.missing.length > 0) {
      qualification = QUALIFICATION_STATUSES.NEEDS_CLARIFICATION;
    } else if (assessment.capabilityMatchScore < 40 && !req.hasSufficientScope) {
      qualification = QUALIFICATION_STATUSES.NEEDS_HUMAN_REVIEW;
    }

    // 4. Progressive Clarification (Senior Solution Architect Mode)
    if (qualification === QUALIFICATION_STATUSES.NEEDS_CLARIFICATION) {
      const questions = [];
      if (!req.features.length) {
        questions.push("1. What are the top 2–3 core features or user workflows you need?");
      }
      questions.push("2. What are your target platforms (e.g. Web application, Mobile iOS/Android, automated backend API)?");
      questions.push("3. Do you have a preferred timeline or target budget range for this project?");

      const reply = [
        `Yes! GARUDA can design, architect, and deliver this **${req.platform}**.`,
        "",
        "To provide you with an exact scope, milestone plan, and transparent quote, I just need clarity on a couple of details:",
        ...questions.slice(0, 3),
        "",
        "Feel free to share what you have in mind, and I will tailor the architecture and delivery plan accordingly."
      ].join("\n");

      return {
        handled: true,
        reply,
        qualification,
        isCommercial: true,
        proposalId: null,
        proposalUrl: null,
        extractedContext: req
      };
    }

    // 5. Qualified Project Scoping & Pricing (Sufficient Scope or Explicit Quote Requested)
    const currency = req.currency || "INR";
    const estimate = revenueValueModel.estimateValueFromEvidence(req.combinedText, { valueType: "estimated_project_value" });
    const totalAmount = req.budget || (currency === "INR" ? (estimate.estimatedINR || 25000) : (estimate.estimatedUSD || 300));
    const totalINR = currency === "INR" ? totalAmount : convertToINR(totalAmount, currency);
    const depositAmount = Math.round(totalAmount * 0.5);

    const deliverables = req.features.length
      ? req.features.map((f) => `Full production implementation of ${f}`)
      : [
          `Complete governed build of ${req.platform}`,
          "Automated QA test suite with verified test runner logs",
          "Cryptographic SHA-256 delivery manifest and deployment support"
        ];

    // If user explicitly asked for a proposal or conversation is mature, generate a canonical Proposal
    let proposal = null;
    if (req.hasExplicitQuoteRequest || rawMessage.toLowerCase().includes("proposal") || rawMessage.toLowerCase().includes("quote") || (history.length >= 2 && req.features.length >= 1)) {
      try {
        proposal = await clientProposalService.createProposal({
          title: `${req.platform}: Custom Solution`,
          requirements: req.combinedText.slice(0, 4000),
          amount: totalAmount,
          currency,
          deliverables,
          client: { name: "Commercial Inbound Visitor", organization: "Web Prospect" },
          allowAutonomousAuthorization: totalINR <= 25000
        }, { founderApproved: totalINR <= 25000 });
      } catch (err) {
        console.error("[CommercialAgent] Proposal generation note:", err.message);
      }
    }

    // Telegram Notification (Real Lead vs Test Mode)
    try {
      const alertTitle = isTestCall ? "🧪 [TEST / SIMULATION] INBOUND PUBLIC CHAT LEAD" : "🦅 NEW REAL PUBLIC CHAT LEAD";
      await telegramBotService.sendFounderAlert(
        alertTitle,
        `Platform: ${req.platform}\n` +
        `Quote: ${currency} ${totalAmount.toLocaleString("en-IN")} (Deposit: ${depositAmount})\n` +
        `Scope: ${deliverables.slice(0, 2).join("; ")}\n` +
        `Qualification: ${qualification}\n` +
        (proposal ? `Proposal Link: ${proposal.publicUrl}` : "Status: Scoping in conversation")
      );
    } catch {}

    const replyLines = [
      `### ◈ GARUDA Architectural Scope: ${req.platform}`,
      "",
      `**Estimated Investment:** ${currency} ${totalAmount.toLocaleString("en-IN")} *(50% advance deposit: ${currency} ${depositAmount.toLocaleString("en-IN")})*  `,
      `**Estimated Delivery:** 3–7 business days with governed QA test suite  `,
      "",
      "**Included Deliverables:**",
      ...deliverables.map((d) => `• ${d}`),
      "",
      "**Milestone Schedule:**",
      `1. **Advance Kickoff Deposit (50%):** Immediate architecture reservation and governed build start.`,
      `2. **Final Delivery & Verification (50%):** Deployment, automated test suite verification, and client sign-off.`,
      ""
    ];

    if (proposal && proposal.publicUrl) {
      replyLines.push(`🔗 **[View & Accept Formal Proposal](${proposal.publicUrl})**`);
      replyLines.push("You can review the full terms, sign digital acceptance, and initiate deposit settlement directly.");
    } else {
      replyLines.push("Would you like me to generate your formal commercial proposal link with these milestones now?");
    }

    return {
      handled: true,
      reply: replyLines.join("\n"),
      qualification,
      isCommercial: true,
      proposalId: proposal ? proposal.proposalId : null,
      proposalUrl: proposal ? proposal.publicUrl : null,
      pricing: { totalAmount, depositAmount, currency, totalINR }
    };
  }
}

module.exports = new PublicChatCommercialAgentService();
