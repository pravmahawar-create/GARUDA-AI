/**
 * GARUDA Public Chat Commercial Intake Agent
 * Transforms generic chat into a senior solution architect & commercial intake engine.
 * Understands arbitrary business/software requests, extracts requirements progressively,
 * classifies qualification, scopes milestones, prices transparently, and generates proposals.
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

const COMMERCIAL_SIGNALS = [
  "build", "create", "develop", "make", "app", "website", "saas", "software", "ai",
  "automation", "bot", "crm", "dashboard", "portal", "lead", "seo", "marketing",
  "pipeline", "integration", "api", "database", "fix", "custom", "system", "quote",
  "cost", "price", "hire", "deliver", "project", "mvp", "paid", "payment"
];

function isCommercialQuery(text = "") {
  const clean = String(text || "").toLowerCase();
  return COMMERCIAL_SIGNALS.some((sig) => clean.includes(sig));
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

  const platform = platforms[0] || "Custom Digital Software";

  // 2. Detect Key Capabilities & Features
  const features = [];
  if (clean.includes("auth") || clean.includes("login") || clean.includes("user")) features.push("User Authentication & Role Management");
  if (clean.includes("pay") || clean.includes("stripe") || clean.includes("razorpay") || clean.includes("subscription")) features.push("Secure Payment & Billing Integration");
  if (clean.includes("ai") || clean.includes("llm") || clean.includes("rag") || clean.includes("model") || clean.includes("gpt")) features.push("AI / LLM Pipeline & Knowledge Grounding");
  if (clean.includes("database") || clean.includes("mongo") || clean.includes("sql") || clean.includes("postgres")) features.push("Structured Scalable Database");
  if (clean.includes("notification") || clean.includes("email") || clean.includes("sms") || clean.includes("whatsapp")) features.push("Automated Notifications (Email/SMS/WhatsApp)");
  if (clean.includes("seo") || clean.includes("google") || clean.includes("meta")) features.push("Technical SEO & OpenGraph Microdata");

  // 3. Extract Budget & Currency
  const budgetInfo = parseBudgetFromConversation(combined);

  // 4. Missing Information Analysis
  const missing = [];
  if (!features.length && !clean.includes("simple")) missing.push("Key functional workflows or features");
  if (clean.includes("app") && !clean.includes("ios") && !clean.includes("android") && !clean.includes("web")) missing.push("Target platforms (Web, iOS, Android)");
  if (!budgetInfo.amount && !clean.includes("quote") && !clean.includes("cost") && !clean.includes("price")) missing.push("Target budget expectation");

  return {
    combinedText: combined,
    platform,
    features,
    budget: budgetInfo.amount,
    currency: budgetInfo.currency,
    missing,
    hasSufficientScope: allMessages.length >= 2 || features.length >= 2 || (platform && budgetInfo.amount)
  };
}

class PublicChatCommercialAgentService {
  /**
   * Main entry point for commercial chat turns.
   */
  async processCommercialTurn({ message = "", history = [], conversationId = null, origin = "public_web", isTest = false }) {
    const rawMessage = String(message || "").trim();
    const isTestCall = isTest === true || rawMessage.toLowerCase().includes("[test") || rawMessage.toLowerCase().includes("live test");

    // 1. Detect Payment Claim / Screenshot Intent (Payment Truth Gate)
    if (/\b(paid|i paid|payment done|screenshot|receipt|upi ref|transaction id)\b/i.test(rawMessage)) {
      return {
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
    if (req.missing.length >= 2 && !req.hasSufficientScope) {
      qualification = QUALIFICATION_STATUSES.NEEDS_CLARIFICATION;
    } else if (assessment.capabilityMatchScore < 40) {
      qualification = QUALIFICATION_STATUSES.NEEDS_HUMAN_REVIEW;
    }

    // 4. Progressive Clarification (Senior Solution Architect Mode)
    if (qualification === QUALIFICATION_STATUSES.NEEDS_CLARIFICATION) {
      const questions = [];
      if (!req.features.length) {
        questions.push("1. What are the top 2-3 most important features or user actions?");
      }
      if (req.platform.includes("Custom") || req.platform.includes("Application")) {
        questions.push("2. Will this be primarily Web, Mobile, or an automated backend service?");
      }
      questions.push("3. Do you have a preferred target delivery timeline or budget range?");

      const reply = [
        `Yes, GARUDA can design, build, and deliver this custom **${req.platform}**.`,
        "",
        "To provide you with an exact scope and transparent milestone quote, I just need clarity on a few points:",
        ...questions.slice(0, 3),
        "",
        "Feel free to share as much or as little detail as you like, and I will tailor the architectural plan accordingly."
      ].join("\n");

      return {
        reply,
        qualification,
        isCommercial: true,
        extractedContext: req
      };
    }

    // 5. Qualified Project Scoping & Pricing
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
    if (rawMessage.toLowerCase().includes("proposal") || rawMessage.toLowerCase().includes("quote") || req.hasSufficientScope) {
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
