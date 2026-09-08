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
 * Classify client budget tier for feasibility matching (NOT for pricing gaming)
 */
function classifyBudget(budgetStr) {
  if (!budgetStr) return { tier: "standard", value: 65000, currency: "INR" };

  const clean = String(budgetStr).toLowerCase().replace(/,/g, "");
  
  // Extract numbers
  const nums = clean.match(/\d+/g);
  let val = nums ? parseInt(nums[0], 10) : 65000;

  // Currency normalizations to INR
  if (clean.includes("$") || clean.includes("usd")) {
    val = val * 85;
  } else if (clean.includes("£") || clean.includes("gbp")) {
    val = val * 110;
  } else if (clean.includes("aed")) {
    val = val * 23;
  }

  if (val < 25000) {
    return {
      tier: "micro",
      value: val,
      currency: "INR",
      reason: "Micro-Budget: Baseline infrastructure allocation only. Subject to strict Core MVP scope gating."
    };
  } else if (val < 90000) {
    return {
      tier: "standard",
      value: val,
      currency: "INR",
      reason: "Standard Commercial Scope: Eligible for 30% GARUDA efficiency discount + 5% upfront bonus."
    };
  } else if (val < 220000) {
    return {
      tier: "premium",
      value: val,
      currency: "INR",
      reason: "Premium Enterprise Tier: Full PWA/APK, 24/7 AI Concierge, and governed 50/50 milestones."
    };
  } else {
    return {
      tier: "enterprise",
      value: val,
      currency: "INR",
      reason: "Titan Enterprise Tier: Custom SLA, multi-region failover, and sovereign dedicated architecture."
    };
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
 * ANCHORED ON TECHNICAL SCOPE, IMMUNE TO ARBITRAGE / BUDGET-GAMING
 */
function generateMarketQuote({ clientName, prompt, budget, appName }) {
  const formalGreeting = clientName ? `Mr./Ms. ${clientName}` : "Respected Client";
  const budgetInfo = classifyBudget(budget);
  const safeApp = (appName || "Sovereign Digital Application").replace(/[-_]/g, " ");

  // 1. Determine Scope Baseline based on Technical Requirements (NOT client claimed budget)
  const lowerPrompt = (prompt || "").toLowerCase();
  const wordCount = (prompt || "").split(/\s+/).length;

  let baseMarketPrice = 95000;
  let scopeHardFloor = 48000;
  let scopeTier = "Standard Commercial Application";

  const isComplex = wordCount > 40 ||
    lowerPrompt.includes("database") ||
    lowerPrompt.includes("auth") ||
    lowerPrompt.includes("multi-device") ||
    lowerPrompt.includes("commission") ||
    lowerPrompt.includes("payment") ||
    lowerPrompt.includes("backend");

  const isMicro = !isComplex && wordCount < 18 &&
    (lowerPrompt.includes("calculator") || lowerPrompt.includes("landing") || lowerPrompt.includes("simple tool"));

  if (isMicro) {
    baseMarketPrice = 45000;
    scopeHardFloor = 25000;
    scopeTier = "Core Utility / Single-Purpose Tool";
  } else if (isComplex) {
    baseMarketPrice = 160000;
    scopeHardFloor = 85000;
    scopeTier = "Complex Multi-Module Platform";
  } else if (budgetInfo.tier === "enterprise") {
    baseMarketPrice = Math.max(280000, budgetInfo.value || 280000);
    scopeHardFloor = Math.round(baseMarketPrice * 0.60);
    scopeTier = "Titan Enterprise Sovereign Platform";
  }

  // 2. Compute GARUDA Sovereign Calibrated Price (30% off Market Standard Benchmark)
  const discountPercentage = 30;
  const garudaPrice = Math.max(Math.round(baseMarketPrice * 0.70), scopeHardFloor);

  // 100% Upfront Sovereign VIP Plan gives an extra 5% off the principal
  const upfrontBonusPercentage = 5;
  const upfrontPrice = Math.round(garudaPrice * 0.95);

  // 3. Evaluate Client Budget Feasibility (Anti-Arbitrage Protection)
  const clientDeclaredBudget = budgetInfo.value;
  const isBudgetSufficient = clientDeclaredBudget >= garudaPrice;
  let budgetDiagnosis = "Client budget matches technical scope requirements.";

  if (!isBudgetSufficient) {
    budgetDiagnosis = `Declared budget (₹${clientDeclaredBudget.toLocaleString("en-IN")}) is below the baseline engineering floor (₹${garudaPrice.toLocaleString("en-IN")}) for this scope. GARUDA strictly upholds the 100% Anti-Fabrication Law — no artificial cuts that compromise code security or uptime. Recommended: Proceed via 50/50 Governed Milestone Plan (Kickoff: ₹${Math.round(garudaPrice * 0.5).toLocaleString("en-IN")}) or restrict scope to Core MVP.`;
  }

  const comparison = generateTechnicalComparison(safeApp);

  const allowDiscount = budgetInfo.tier !== "micro" && garudaPrice < baseMarketPrice;

  const reportPayload = {
    formalGreeting,
    clientName: clientName || "Executive Partner",
    proposedApp: safeApp,
    scopeSummary: `Custom architecture and autonomous software synthesis for: "${prompt?.slice(0, 120)}..."`,
    scopeTier,
    scopeHardFloor,
    budgetTier: budgetInfo.tier,
    clientDeclaredBudget,
    isBudgetSufficient,
    budgetDiagnosis,
    allowDiscount,
    pricing: {
      marketStandardPrice: baseMarketPrice,
      garudaStandardPrice: garudaPrice,
      discountPercentage,
      hardFloorPrice: scopeHardFloor,
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
        description: "Additional 5% discount deducted directly from principal amount (Total 35% savings from market standard)."
      },
      isNegotiable: true,
      negotiationGuide: `Counter-offers evaluated down to hard engineering floor of ₹${scopeHardFloor.toLocaleString("en-IN")}. Propose a counter-offer below.`
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
 * STRICT ANTI-ARBITRAGE: Cannot breach hard engineering floor
 */
function negotiateQuote({ currentQuote, clientCounterOffer, clientNotes }) {
  const counterVal = parseInt(String(clientCounterOffer).replace(/[^0-9]/g, ""), 10);
  const originalMarket = currentQuote?.pricing?.marketStandardPrice || 95000;
  const currentGaruda = currentQuote?.pricing?.garudaStandardPrice || 66500;
  const scopeHardFloor = currentQuote?.pricing?.hardFloorPrice || currentQuote?.scopeHardFloor || Math.round(originalMarket * 0.50);

  if (!counterVal || isNaN(counterVal)) {
    return {
      accepted: false,
      counterOffer: counterVal,
      message: "Please enter a valid numeric counter-offer amount.",
      adjustedQuote: currentQuote
    };
  }

  // Hard Floor threshold is strictly protected: client cannot gamble or underprice baseline costs
  const floorThreshold = Math.max(scopeHardFloor, Math.round(currentGaruda * 0.80), 22000);

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
      message: `Counter-offer of ₹${counterVal.toLocaleString("en-IN")} is below the absolute engineering floor (₹${floorThreshold.toLocaleString("en-IN")}) required for this scope. Code quality and infrastructure security cannot be compromised.`,
      counterProposal: {
        recommendedFloor: floorThreshold,
        optionA: `Proceed with full scope at sovereign floor of ₹${floorThreshold.toLocaleString("en-IN")} (50% kickoff: ₹${Math.round(floorThreshold * 0.5).toLocaleString("en-IN")})`,
        optionB: "Adopt Core MVP Tier matching your exact budget with targeted single-purpose feature set."
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
