/**
 * 🦅 GARUDA PAWAN Consultative Market Analysis & Psychological Pricing Engine
 * 
 * Capabilities:
 * 1. Scope & Technology Stack Analysis
 * 2. Market Benchmark Audit (Traditional agencies vs Sasti sites vs GARUDA Sovereign)
 * 3. Budget-Gated Psychological Pricing:
 *    - Micro-budget (< ₹20,000): No discount allowed (baseline resource cost), full milestone protection.
 *    - Standard/Healthy budget: 30% base discount (50/50 governance) + 5% upfront cash discount (total 35%).
 * 4. Interactive Negotiation & Counter-Offer Handler
 * 5. Cryptographic SHA-256 Quote Verification
 */

const crypto = require("crypto");

/**
 * Classify client budget tier
 */
function classifyBudget(budgetStr) {
  if (!budgetStr) return { tier: "standard", min: 35000, max: 80000, currency: "INR" };

  const clean = String(budgetStr).toLowerCase().replace(/,/g, "");
  
  // Extract numbers
  const nums = clean.match(/\d+/g);
  let val = nums ? parseInt(nums[0], 10) : 35000;

  // If in USD/GBP
  if (clean.includes("$") || clean.includes("usd")) {
    val = val * 85;
  } else if (clean.includes("£") || clean.includes("gbp")) {
    val = val * 110;
  } else if (clean.includes("aed")) {
    val = val * 23;
  }

  if (val < 20000) {
    return { tier: "micro", value: val, allowDiscount: false, reason: "Micro-Budget: Baseline infrastructure & compute cost only. Further discounts would compromise code security." };
  } else if (val < 75000) {
    return { tier: "standard", value: val, allowDiscount: true, reason: "Standard Commercial Scope: Eligible for 30% GARUDA efficiency discount + 5% upfront bonus." };
  } else if (val < 200000) {
    return { tier: "premium", value: val, allowDiscount: true, reason: "Premium Enterprise Tier: Full PWA/APK, 24/7 AI Concierge, and 30-35% negotiable discount structure." };
  } else {
    return { tier: "enterprise", value: val, allowDiscount: true, reason: "Titan Enterprise Tier: Custom SLA, high-concurrency architecture, and maximum executive flexibility." };
  }
}

/**
 * Generate deep Sasti vs Premium vs GARUDA comparison
 */
function generateTechnicalComparison(appType = "Web Application") {
  return [
    {
      parameter: "Architecture & Codebase",
      sastiSite: "Bloated generic templates, slow WordPress/PHP plugins, heavy page weight (>5MB)",
      premiumAgency: "Clean React/Next.js setup, but requires 6-8 weeks of manual agency cycles",
      garudaSovereign: "Sub-500ms supersonic pure code, instant pre-rendered PWA, zero technical debt"
    },
    {
      parameter: "Mobile Phone Experience",
      sastiSite: "Basic mobile responsive view only; no standalone app or offline mode",
      premiumAgency: "Responsive website included; native mobile app costs ₹1.5L+ extra",
      garudaSovereign: "1-Tap Direct Android PWA/APK container built-in with home screen installation"
    },
    {
      parameter: "Client Intake & Conversion",
      sastiSite: "Static contact form with delayed manual email response (40-60% lead drop-off)",
      premiumAgency: "Standard third-party chatbot integration (monthly SaaS subscription extra)",
      garudaSovereign: "24/7 Autonomous Intelligent Concierge that qualifies high-value clients instantly"
    },
    {
      parameter: "Security & Governance",
      sastiSite: "Frequent plugin vulnerabilities, zero audit logs, high crash risk",
      premiumAgency: "Standard SSL/HTTPS, monthly maintenance retainer required",
      garudaSovereign: "SHA-256 cryptographic proof for every release, closed-loop self-healing engine"
    }
  ];
}

/**
 * Generate comprehensive market quote
 */
function generateMarketQuote({ clientName, prompt, budget, appName }) {
  const formalGreeting = clientName ? `Mr./Ms. ${clientName}` : "Respected Client";
  const budgetInfo = classifyBudget(budget);
  const safeApp = (appName || "Sovereign Digital Application").replace(/[-_]/g, " ");

  // Baseline estimates based on prompt complexity
  const wordCount = (prompt || "").split(/\s+/).length;
  let baseMarketPrice = 85000;
  if (wordCount > 50 || prompt?.toLowerCase().includes("database") || prompt?.toLowerCase().includes("auth")) {
    baseMarketPrice = 145000;
  }
  if (budgetInfo.tier === "enterprise") {
    baseMarketPrice = Math.max(baseMarketPrice, budgetInfo.value || 250000);
  }

  let garudaPrice = baseMarketPrice;
  let upfrontPrice = baseMarketPrice;
  let discountPercentage = 0;
  let upfrontBonusPercentage = 0;

  if (budgetInfo.allowDiscount) {
    discountPercentage = 30;
    garudaPrice = Math.round(baseMarketPrice * 0.70);
    upfrontBonusPercentage = 5;
    upfrontPrice = Math.round(garudaPrice * 0.95);
  } else {
    // Micro budget: baseline price matching their budget or minimum sustainable
    garudaPrice = Math.min(baseMarketPrice, Math.max(budgetInfo.value || 12000, 12000));
    upfrontPrice = garudaPrice;
  }

  const comparison = generateTechnicalComparison(safeApp);

  const reportPayload = {
    formalGreeting,
    clientName: clientName || "Executive Partner",
    proposedApp: safeApp,
    scopeSummary: `Custom architecture and autonomous software synthesis for: "${prompt?.slice(0, 120)}..."`,
    budgetTier: budgetInfo.tier,
    allowDiscount: budgetInfo.allowDiscount,
    budgetReason: budgetInfo.reason,
    pricing: {
      marketStandardPrice: baseMarketPrice,
      garudaStandardPrice: garudaPrice,
      discountPercentage,
      milestonePlan: {
        title: "50/50 Governed Milestone Plan",
        kickoff50: Math.round(garudaPrice * 0.5),
        completion50: Math.round(garudaPrice * 0.5),
        description: "50% kickoff to reserve sovereign worktree; 50% only upon verified delivery and regression proof."
      },
      upfrontPlan: {
        title: "100% Upfront Sovereign VIP Plan",
        price: upfrontPrice,
        extraDiscountPercentage: upfrontBonusPercentage,
        totalSavingsPercentage: discountPercentage + upfrontBonusPercentage,
        totalSavingsAmount: baseMarketPrice - upfrontPrice,
        description: budgetInfo.allowDiscount
          ? "Additional 5% discount deducted directly from principal amount (Total 35% savings)."
          : "Full upfront protection with priority queue allocation."
      },
      isNegotiable: true,
      negotiationGuide: "If your budget requires customized milestones or scope adjustments, propose a counter-offer below."
    },
    freeValueAdditions: [
      "1-Tap Android Mobile PWA & APK Packaging (Zero extra charge)",
      "High-Resolution Vector SVG App Icons (192px & 512px)",
      "Offline-First Service Worker (Works without active internet)",
      "Camera QR Code for instant mobile scanning",
      "30-Day Autonomous Self-Healing & Syntax Warranty"
    ],
    technicalComparison: comparison,
    timestamp: new Date().toISOString()
  };

  const sha256 = crypto.createHash("sha256").update(JSON.stringify(reportPayload)).digest("hex");
  reportPayload.sha256 = sha256;

  return reportPayload;
}

/**
 * Evaluate client's counter-offer during negotiation
 */
function negotiateQuote({ currentQuote, clientCounterOffer, clientNotes }) {
  const counterVal = parseInt(String(clientCounterOffer).replace(/[^0-9]/g, ""), 10);
  const originalMarket = currentQuote?.pricing?.marketStandardPrice || 100000;
  const currentGaruda = currentQuote?.pricing?.garudaStandardPrice || 70000;

  if (!counterVal || isNaN(counterVal)) {
    return {
      accepted: false,
      counterOffer: counterVal,
      message: "Please enter a valid numeric counter-offer amount.",
      adjustedQuote: currentQuote
    };
  }

  // Minimum sustainable threshold is 50% of market standard or ₹12,000
  const floorThreshold = Math.max(Math.round(originalMarket * 0.50), 12000);

  if (counterVal >= currentGaruda) {
    return {
      accepted: true,
      counterOffer: counterVal,
      status: "approved",
      message: `Proposal accepted! ₹${counterVal.toLocaleString("en-IN")} locks in your full scope with sovereign priority.`,
      finalPrice: counterVal,
      kickoff50: Math.round(counterVal * 0.5),
      completion50: Math.round(counterVal * 0.5)
    };
  } else if (counterVal >= floorThreshold) {
    return {
      accepted: true,
      counterOffer: counterVal,
      status: "negotiated_win_win",
      message: `🤝 Strategic Alignment Accepted! As Founder of GARUDA, I value long-term partnership over agency margins. We accept your counter-offer of ₹${counterVal.toLocaleString("en-IN")}.`,
      finalPrice: counterVal,
      kickoff50: Math.round(counterVal * 0.5),
      completion50: Math.round(counterVal * 0.5),
      note: "Full scope preserved with 50/50 milestone governance."
    };
  } else {
    // Too low — offer a structured scope modification
    return {
      accepted: false,
      counterOffer: counterVal,
      status: "scope_adjusted",
      message: `Counter-offer of ₹${counterVal.toLocaleString("en-IN")} is below baseline cloud compute & security costs (Floor: ₹${floorThreshold.toLocaleString("en-IN")}).`,
      counterProposal: {
        recommendedFloor: floorThreshold,
        optionA: `Proceed with core foundation at ₹${floorThreshold.toLocaleString("en-IN")} (50% kickoff: ₹${Math.round(floorThreshold * 0.5).toLocaleString("en-IN")})`,
        optionB: "Switch to GARUDA DOST Community Micro-Tier (Split into monthly installments)."
      }
    };
  }
}

module.exports = {
  generateMarketQuote,
  negotiateQuote,
  classifyBudget,
  generateTechnicalComparison
};
