/**
 * 🦅 GARUDA OS — FINTECH QUALIFICATION & REVENUE PIPELINE ENGINE
 * Spec: GARUDA-FINTECH-SPEC-V2.0 & Commercial Architecture Pipeline Mandate
 * 
 * Invariants:
 * 1. 100% Anti-Fabrication Law: Truthful claims only. MockBank is OPERATIONAL; Wio/ICICI/Modulr require credentials/onboarding.
 * 2. Strict Zero-Custody Invariant: GARUDA provides gateway software and orchestration logic; customer funds clear direct to merchant bank.
 * 3. Zero Credential Ingestion: Rejects and strips all sensitive financial secrets (passwords, cards, CVV, private keys, seeds).
 * 4. Deterministic Qualification: Explainable rules mapping client requirements into 4 commercial architectures.
 * 5. Founder Approval Gatekeeping: All proposals are drafts awaiting Founder Praveen Mahawar's explicit review and sign-off.
 * 6. Statutory Commercial Fee Segregation: GARUDA software fee vs Regulated bank clearing fees vs FX/Taxes.
 */

const crypto = require("crypto");

const FORBIDDEN_FINANCIAL_FIELDS = [
  "password",
  "card",
  "cardNumber",
  "card_number",
  "cvv",
  "cvc",
  "expiry",
  "pin",
  "privateKey",
  "private_key",
  "secretKey",
  "secret_key",
  "apiSecret",
  "api_secret",
  "seed",
  "seedPhrase",
  "mnemonic",
  "bankPassword",
  "bank_password",
  "otp",
  "authCode"
];

const PIPELINE_STAGES = {
  NEW: "NEW",
  QUALIFIED: "QUALIFIED",
  PROPOSAL_DRAFT: "PROPOSAL_DRAFT",
  FOUNDER_REVIEW: "FOUNDER_REVIEW",
  APPROVED: "APPROVED",
  SENT: "SENT",
  COMMERCIAL_AGREEMENT: "COMMERCIAL_AGREEMENT",
  PILOT: "PILOT",
  PRODUCTION: "PRODUCTION"
};

const COMMERCIAL_TIERS = {
  CLOUD_STARTER: {
    key: "CLOUD_STARTER",
    slug: "cloud-starter",
    title: "Cloud Starter",
    indicativePricing: "From ₹4,999 / month",
    setupFeeINR: 0,
    monthlyFeeINR: 4999,
    deploymentModel: "Hosted Gateway Infrastructure",
    targetAudience: "D2C Brands, SMEs, Early-stage digital commerce",
    summary: "Single-tenant managed gateway container with multi-rail orchestration, direct regulated-provider connectivity, and deterministic reconciliation."
  },
  CROSS_BORDER_GROWTH: {
    key: "CROSS_BORDER_GROWTH",
    slug: "cross-border-growth",
    title: "Cross-Border Growth",
    indicativePricing: "From ₹49,000 setup + ₹9,999 / month",
    setupFeeINR: 49000,
    monthlyFeeINR: 9999,
    deploymentModel: "Multi-Rail Treasury Orchestration",
    targetAudience: "Exporters, IT agencies, International SaaS, Multi-currency merchants",
    summary: "Multi-currency treasury orchestration across USD, AED, INR, GBP, EUR corridors with automated invoice-matching, VAN generation, and FX reconciliation visibility."
  },
  SOVEREIGN_ENTERPRISE: {
    key: "SOVEREIGN_ENTERPRISE",
    slug: "sovereign-enterprise",
    title: "Sovereign Enterprise",
    indicativePricing: "Custom Sovereign Architecture",
    setupFeeINR: null,
    monthlyFeeINR: null,
    deploymentModel: "Private VPC / Dedicated Self-Hosted Infrastructure",
    targetAudience: "Large Enterprises, Fintech Infrastructure Teams, NBFCs, High-Volume Platforms",
    summary: "Private single-tenant VPC or on-premise sovereign gateway deployment with custom provider routing adapters, cryptographic audit streaming, dedicated SLA, and optional source-level governance."
  },
  CUSTOM_REVIEW: {
    key: "CUSTOM_REVIEW",
    slug: "custom-review",
    title: "Custom Review Architecture",
    indicativePricing: "Subject to Custom Scoping",
    setupFeeINR: null,
    monthlyFeeINR: null,
    deploymentModel: "Specialized Enterprise Scoping",
    targetAudience: "Regulated Entities, High-Complexity Cross-Border Networks, Specialized Workflows",
    summary: "Bespoke engineering architecture evaluated directly by Founder Praveen Mahawar for institutional compliance, complex clearing rails, and non-standard settlement workflows."
  }
};

const PROVIDER_STATUS_REGISTRY = {
  "mock-bank": {
    providerId: "mock-bank",
    providerName: "GARUDA Mock Sandbox Bank",
    readiness: "OPERATIONAL",
    coverage: "Sandbox & Functional Lifecycle Testing",
    corridors: ["DOMESTIC", "CROSS_BORDER_SIMULATED"],
    currencies: ["INR", "USD", "AED", "GBP", "EUR"],
    notes: "Production-grade sandbox protocol adapter available immediately for sandbox testing."
  },
  "wio-bank-uae": {
    providerId: "wio-bank-uae",
    providerName: "Wio Bank PJSC (UAE)",
    readiness: "SANDBOX_READY / CREDENTIALS_REQUIRED",
    coverage: "UAE Domestic & GCC Regional Clearing",
    corridors: ["UAE-DOMESTIC", "INDIA-UAE", "GCC"],
    currencies: ["AED", "USD"],
    notes: "Adapter ready; requires client-provided corporate Wio API credentials and UAE business onboarding."
  },
  "icici-corp-in": {
    providerId: "icici-corp-in",
    providerName: "ICICI Bank Corporate (India)",
    readiness: "ADAPTER_READY / CREDENTIALS_REQUIRED",
    coverage: "India Domestic Multi-Rail (UPI / IMPS / NEFT / RTGS)",
    corridors: ["INDIA-DOMESTIC"],
    currencies: ["INR"],
    notes: "Adapter ready; requires ICICI Corporate Banking commercial onboarding & digital certificate."
  },
  "modulr-uk": {
    providerId: "modulr-uk",
    providerName: "Modulr Finance (UK/EU)",
    readiness: "ADAPTER_READY / CREDENTIALS_REQUIRED",
    coverage: "UK Faster Payments, BACS, CHAPS & EU SEPA",
    corridors: ["UK-DOMESTIC", "EU-SEPA", "INDIA-UK", "INDIA-EU"],
    currencies: ["GBP", "EUR"],
    notes: "Adapter ready; requires Modulr commercial account approval and API authorization."
  }
};

/**
 * Strips HTML, scripts, control chars.
 */
function sanitizeString(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/\0/g, "")
    .trim();
}

/**
 * Validates and sanitizes a fintech lead intake payload.
 * Rejects any sensitive card data, bank passwords, or private keys.
 */
function validateAndSanitizeFintechPayload(rawInput = {}) {
  const payload = typeof rawInput === "object" && rawInput !== null ? rawInput : {};
  const strippedFields = [];

  // Deep check for forbidden financial secrets
  function inspectAndClean(obj) {
    if (!obj || typeof obj !== "object") return;
    for (const key of Object.keys(obj)) {
      const lowerKey = key.toLowerCase();
      const isForbidden = FORBIDDEN_FINANCIAL_FIELDS.some(f => lowerKey.includes(f.toLowerCase()));
      if (isForbidden) {
        strippedFields.push(key);
        delete obj[key];
      } else if (typeof obj[key] === "object") {
        inspectAndClean(obj[key]);
      }
    }
  }

  const cloned = JSON.parse(JSON.stringify(payload));
  inspectAndClean(cloned);

  // Identity
  const identity = cloned.identity || {};
  const cleanName = sanitizeString(identity.name || cloned.name || "Enterprise Prospect");
  const cleanCompany = sanitizeString(identity.company || cloned.company || cleanName);
  const cleanEmail = sanitizeString(identity.email || cloned.email || "").toLowerCase();
  const cleanPhone = sanitizeString(identity.phone || cloned.phone || "");
  const cleanCountry = sanitizeString(identity.country || cloned.country || "India");

  // Business
  const business = cloned.business || {};
  const businessType = sanitizeString(business.businessType || cloned.businessType || "D2C / E-commerce");
  const industry = sanitizeString(business.industry || cloned.industry || "Digital Commerce");
  const website = sanitizeString(business.website || cloned.website || "");
  const operatingCountries = Array.isArray(business.operatingCountries)
    ? business.operatingCountries.map(sanitizeString).filter(Boolean)
    : [cleanCountry];

  // Payment Requirements
  const paymentRequirements = cloned.paymentRequirements || {};
  const selectedTier = sanitizeString(paymentRequirements.selectedTier || cloned.selectedTier || cloned.tier || "cloud-starter").toLowerCase();
  const moneyMovement = sanitizeString(paymentRequirements.moneyMovement || cloned.moneyMovement || "domestic").toLowerCase();
  const expectedMonthlyVolume = sanitizeString(paymentRequirements.expectedMonthlyVolume || cloned.expectedMonthlyVolume || "< ₹10 lakh");
  const expectedMonthlyTransactionCount = sanitizeString(paymentRequirements.expectedMonthlyTransactionCount || cloned.expectedMonthlyTransactionCount || "100 - 1,000");
  const transactionCurrency = sanitizeString(paymentRequirements.transactionCurrency || cloned.transactionCurrency || "INR").toUpperCase();
  
  let requiredCurrencies = Array.isArray(paymentRequirements.requiredCurrencies || cloned.requiredCurrencies)
    ? (paymentRequirements.requiredCurrencies || cloned.requiredCurrencies).map(c => sanitizeString(c).toUpperCase()).filter(Boolean)
    : [transactionCurrency];
  if (!requiredCurrencies.length) requiredCurrencies = ["INR"];

  const sendingCountries = Array.isArray(paymentRequirements.sendingCountries)
    ? paymentRequirements.sendingCountries.map(sanitizeString).filter(Boolean)
    : [cleanCountry];
  const receivingCountries = Array.isArray(paymentRequirements.receivingCountries)
    ? paymentRequirements.receivingCountries.map(sanitizeString).filter(Boolean)
    : [cleanCountry];
  const paymentDirection = sanitizeString(paymentRequirements.paymentDirection || cloned.paymentDirection || "pay-in");
  const settlementPreference = sanitizeString(paymentRequirements.settlementPreference || cloned.settlementPreference || "T+1");

  // Integration
  const integration = cloned.integration || {};
  const existingPaymentProvider = sanitizeString(integration.existingPaymentProvider || cloned.existingPaymentProvider || "None");
  const bankingPartner = sanitizeString(integration.bankingPartner || cloned.bankingPartner || "Standard Commercial Bank");
  const requiredIntegrations = Array.isArray(integration.requiredIntegrations || cloned.requiredIntegrations)
    ? (integration.requiredIntegrations || cloned.requiredIntegrations).map(sanitizeString).filter(Boolean)
    : ["REST API", "Webhooks"];
  const APIRequired = Boolean(integration.APIRequired !== undefined ? integration.APIRequired : requiredIntegrations.includes("REST API"));
  const webhookRequired = Boolean(integration.webhookRequired !== undefined ? integration.webhookRequired : requiredIntegrations.includes("Webhooks"));
  const ERPRequired = Boolean(integration.ERPRequired !== undefined ? integration.ERPRequired : requiredIntegrations.includes("ERP"));
  const invoicingRequired = Boolean(integration.invoicingRequired !== undefined ? integration.invoicingRequired : requiredIntegrations.includes("Invoicing"));

  // Deployment
  const deployment = cloned.deployment || {};
  const deploymentModel = sanitizeString(deployment.deploymentModel || cloned.deploymentModel || cloned.deployment || "hosted").toLowerCase();

  // Commercial
  const commercial = cloned.commercial || {};
  const budgetRange = sanitizeString(commercial.budgetRange || cloned.budgetRange || "Standard Tier Pricing");
  const implementationUrgency = sanitizeString(commercial.implementationUrgency || cloned.implementationUrgency || cloned.urgency || "30–60 days");
  const expectedGoLiveWindow = sanitizeString(commercial.expectedGoLiveWindow || cloned.expectedGoLiveWindow || implementationUrgency);

  // Metadata
  const metadata = cloned.metadata || {};
  const source = sanitizeString(metadata.source || cloned.source || "fintech-gateway-cta");
  const landingPage = sanitizeString(metadata.landingPage || cloned.landingPage || "https://www.garudaos.in/fintech-gateway");

  return {
    identity: {
      name: cleanName,
      company: cleanCompany,
      email: cleanEmail,
      phone: cleanPhone,
      country: cleanCountry
    },
    business: {
      businessType,
      industry,
      website,
      operatingCountries
    },
    paymentRequirements: {
      selectedTier,
      moneyMovement,
      expectedMonthlyVolume,
      expectedMonthlyTransactionCount,
      transactionCurrency,
      requiredCurrencies,
      sendingCountries,
      receivingCountries,
      paymentDirection,
      settlementPreference
    },
    integration: {
      existingPaymentProvider,
      bankingPartner,
      requiredIntegrations,
      APIRequired,
      webhookRequired,
      ERPRequired,
      invoicingRequired
    },
    deployment: {
      deploymentModel
    },
    commercial: {
      budgetRange,
      implementationUrgency,
      expectedGoLiveWindow
    },
    metadata: {
      source,
      landingPage,
      selectedTier,
      createdAt: new Date().toISOString(),
      qualificationStatus: PIPELINE_STAGES.QUALIFIED,
      founderApprovalStatus: "AWAITING_FOUNDER_APPROVAL"
    },
    strippedFields
  };
}

/**
 * Deterministic Qualification Engine:
 * Analyzes the client requirements against explicit, explainable indicators.
 * Classifies into: CLOUD_STARTER, CROSS_BORDER_GROWTH, SOVEREIGN_ENTERPRISE, or CUSTOM_REVIEW.
 */
function evaluateFintechRequirements(cleanPayload) {
  const req = cleanPayload.paymentRequirements || {};
  const dep = cleanPayload.deployment || {};
  const biz = cleanPayload.business || {};
  const int = cleanPayload.integration || {};

  const reasons = [];
  let enterpriseScore = 0;
  let crossBorderScore = 0;
  let starterScore = 0;
  let customReviewFlags = [];

  // 1. Deployment Model Indicators
  const depModel = String(dep.deploymentModel || "").toLowerCase();
  if (depModel.includes("private") || depModel.includes("vpc")) {
    enterpriseScore += 40;
    reasons.push("Private VPC deployment requires Sovereign Enterprise isolated cluster.");
  } else if (depModel.includes("self") || depModel.includes("on-prem") || depModel.includes("hosted-architecture")) {
    enterpriseScore += 45;
    reasons.push("Self-hosted sovereign deployment requires source-level enterprise distribution.");
  } else if (depModel.includes("enterprise") || depModel.includes("custom")) {
    enterpriseScore += 35;
    reasons.push("Enterprise architecture requested.");
  } else {
    starterScore += 20;
    reasons.push("Hosted multi-tenant gateway infrastructure suitable for cloud deployment.");
  }

  // 2. Business Type Indicators
  const bizType = String(biz.businessType || "").toLowerCase();
  if (bizType.includes("nbfc") || bizType.includes("fintech") || bizType.includes("platform") || bizType.includes("bank")) {
    enterpriseScore += 35;
    reasons.push(`Business profile (${biz.businessType}) indicates high-governance institutional requirements.`);
  } else if (bizType.includes("exporter") || bizType.includes("saas") || bizType.includes("agency") || bizType.includes("international")) {
    crossBorderScore += 35;
    reasons.push(`Business profile (${biz.businessType}) aligns with multi-currency exporter / cross-border treasury workflows.`);
  } else {
    starterScore += 15;
    reasons.push(`Business profile (${biz.businessType}) matches digital commerce / SME cloud gateway tier.`);
  }

  // 3. Currency & Corridor Movement Indicators
  const currencies = Array.isArray(req.requiredCurrencies) ? req.requiredCurrencies : [];
  const foreignCurrencies = currencies.filter(c => c !== "INR");
  const moneyMovement = String(req.moneyMovement || "").toLowerCase();

  if (foreignCurrencies.length > 0 || moneyMovement.includes("cross") || moneyMovement.includes("both")) {
    crossBorderScore += 40;
    reasons.push(`Multi-currency corridors (${currencies.join(", ")}) require cross-border treasury routing and FX reconciliation.`);
  } else {
    starterScore += 25;
    reasons.push("Single-currency domestic payment flows match Cloud Starter architecture.");
  }

  // 4. Volume Indicators
  const vol = String(req.expectedMonthlyVolume || "").toLowerCase();
  if (vol.includes("25 crore+") || vol.includes("25cr+") || vol.includes(">25") || vol.includes("100 crore")) {
    enterpriseScore += 40;
    reasons.push(`High transaction volume (${req.expectedMonthlyVolume}) mandates dedicated sovereign capacity and dual-key security.`);
  } else if (vol.includes("5 crore") || vol.includes("50 lakh") || vol.includes("5cr")) {
    crossBorderScore += 20;
    enterpriseScore += 10;
    reasons.push(`Growth-stage volume (${req.expectedMonthlyVolume}) benefits from multi-rail treasury automation.`);
  } else {
    starterScore += 20;
    reasons.push(`Volume tier (${req.expectedMonthlyVolume}) is fully supported by managed Cloud Starter rate limits.`);
  }

  // 5. Integration Complexity
  const integrations = Array.isArray(int.requiredIntegrations) ? int.requiredIntegrations : [];
  if (integrations.some(i => i.toLowerCase().includes("erp") || i.toLowerCase().includes("treasury") || i.toLowerCase().includes("custom"))) {
    enterpriseScore += 15;
    crossBorderScore += 10;
    reasons.push("Advanced ERP / custom multi-rail integrations specified.");
  }

  // 6. Custom Review Checks
  const unsupportedCurrencies = currencies.filter(c => !["INR", "USD", "AED", "GBP", "EUR"].includes(c));
  if (unsupportedCurrencies.length > 0) {
    customReviewFlags.push(`Non-standard clearing currencies requested: ${unsupportedCurrencies.join(", ")}`);
  }
  if (vol.includes("custom") || String(req.settlementPreference || "").toLowerCase().includes("custom")) {
    customReviewFlags.push("Custom settlement window or unconstrained parameters specified.");
  }

  // Deterministic Decisioning
  let recommendedTier = COMMERCIAL_TIERS.CLOUD_STARTER.key;
  let estimatedComplexity = "Standard (3–7 Days)";

  if (customReviewFlags.length > 0 && enterpriseScore < 50 && crossBorderScore < 50) {
    recommendedTier = COMMERCIAL_TIERS.CUSTOM_REVIEW.key;
    estimatedComplexity = "Specialized Technical Review";
  } else if (enterpriseScore >= 50) {
    recommendedTier = COMMERCIAL_TIERS.SOVEREIGN_ENTERPRISE.key;
    estimatedComplexity = "Enterprise Deployment (14–30 Days)";
  } else if (crossBorderScore >= 35) {
    recommendedTier = COMMERCIAL_TIERS.CROSS_BORDER_GROWTH.key;
    estimatedComplexity = "Cross-Border Architecture (7–14 Days)";
  } else {
    recommendedTier = COMMERCIAL_TIERS.CLOUD_STARTER.key;
    estimatedComplexity = "Standard Deployment (3–7 Days)";
  }

  // Normalize selected tier from client CTA
  let selectedTierNormalized = "CLOUD_STARTER";
  const rawSelected = String(req.selectedTier || "").toLowerCase();
  if (rawSelected.includes("sovereign") || rawSelected.includes("enterprise")) {
    selectedTierNormalized = "SOVEREIGN_ENTERPRISE";
  } else if (rawSelected.includes("cross") || rawSelected.includes("growth")) {
    selectedTierNormalized = "CROSS_BORDER_GROWTH";
  } else {
    selectedTierNormalized = "CLOUD_STARTER";
  }

  // Provider Dependencies & Readiness Gap Analysis
  const providerGaps = [];
  if (currencies.includes("INR")) {
    providerGaps.push({
      provider: PROVIDER_STATUS_REGISTRY["icici-corp-in"].providerName,
      status: PROVIDER_STATUS_REGISTRY["icici-corp-in"].readiness,
      requirement: "Merchant must complete ICICI Corporate Banking API commercial onboarding."
    });
  }
  if (currencies.includes("AED") || moneyMovement.includes("uae") || moneyMovement.includes("gcc")) {
    providerGaps.push({
      provider: PROVIDER_STATUS_REGISTRY["wio-bank-uae"].providerName,
      status: PROVIDER_STATUS_REGISTRY["wio-bank-uae"].readiness,
      requirement: "Merchant must provide client corporate Wio API keys & UAE trade license."
    });
  }
  if (currencies.includes("GBP") || currencies.includes("EUR")) {
    providerGaps.push({
      provider: PROVIDER_STATUS_REGISTRY["modulr-uk"].providerName,
      status: PROVIDER_STATUS_REGISTRY["modulr-uk"].readiness,
      requirement: "Merchant must be approved on Modulr UK/EU business payments rail."
    });
  }
  // Sandbox readiness is universal
  providerGaps.unshift({
    provider: PROVIDER_STATUS_REGISTRY["mock-bank"].providerName,
    status: PROVIDER_STATUS_REGISTRY["mock-bank"].readiness,
    requirement: "Available immediately for protocol testing, simulated VAN provisioning, and webhook validation."
  });

  return {
    recommendedTier,
    recommendedTierDetails: COMMERCIAL_TIERS[recommendedTier],
    selectedTier: selectedTierNormalized,
    selectedTierDetails: COMMERCIAL_TIERS[selectedTierNormalized],
    tierMatches: recommendedTier === selectedTierNormalized,
    reasons,
    scores: {
      starterScore,
      crossBorderScore,
      enterpriseScore
    },
    customReviewFlags,
    providerGaps,
    estimatedComplexity,
    status: "Preliminary Architecture Fit — Non-Binding / Subject to Founder Approval"
  };
}

/**
 * Builds the complete 19-section Technical Proposal Draft for a qualified fintech lead.
 */
function buildFintechProposalDraft(cleanPayload, qualificationResult, meta = {}) {
  const scopeId = meta.scopeId || `fintech_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
  const recTier = qualificationResult.recommendedTierDetails;
  const selTier = qualificationResult.selectedTierDetails;
  const req = cleanPayload.paymentRequirements;
  const biz = cleanPayload.business;
  const idn = cleanPayload.identity;
  const dep = cleanPayload.deployment;

  const publicUrl = `https://garudaos.in/proposal/${scopeId}`;

  // 19 Formal Sections
  const sections = {
    section01_executiveSummary: {
      title: "1. Executive Summary",
      content: `This proposal defines the preliminary technical and commercial architecture for deploying GARUDA OS Fintech Gateway for ${idn.company}. Based on evaluated parameters, ${idn.company} is classified under the ${recTier.title} deployment model (${recTier.deploymentModel}). GARUDA operates strictly as an autonomous zero-custody gateway orchestration layer; all transaction principals clear directly into ${idn.company}'s designated commercial banking partners.`
    },
    section02_businessProfileAndObjectives: {
      title: "2. Business Profile & Objectives",
      content: `Organization: ${idn.company} (${biz.businessType} in ${biz.industry}). Primary Objective: Implement robust, low-latency payment infrastructure supporting ${req.moneyMovement} transaction flows with expected volume of ${req.expectedMonthlyVolume} across target operating jurisdictions (${biz.operatingCountries.join(", ")}).`
    },
    section03_currentPaymentWorkflow: {
      title: "3. Current Payment Workflow Analysis",
      content: `Current provider: ${cleanPayload.integration.existingPaymentProvider || "None / Manual Clearing"}. Existing banking infrastructure: ${cleanPayload.integration.bankingPartner}. Target settlement model: ${req.settlementPreference}. The proposed architecture modernizes manual reconciliation into deterministic event-driven webhook state machines.`
    },
    section04_recommendedGatewayArchitecture: {
      title: "4. Recommended Gateway Architecture",
      tier: recTier.key,
      tierTitle: recTier.title,
      content: recTier.summary,
      selectedVsRecommended: qualificationResult.tierMatches
        ? `Client selection (${selTier.title}) matches the evaluated architectural recommendation.`
        : `Client initially explored ${selTier.title}; however, evaluated volume and corridor requirements recommend ${recTier.title} for regulatory alignment and operational scalability.`
    },
    section05_providerAndBankingDependencyMatrix: {
      title: "5. Provider & Banking Dependency Matrix",
      content: "Truthful provider readiness status across target corridors:",
      dependencies: qualificationResult.providerGaps
    },
    section06_crossBorderCorridorAnalysis: {
      title: "6. Cross-Border Corridor Analysis",
      content: `Target currencies: ${req.requiredCurrencies.join(", ")}. Flow direction: ${req.paymentDirection}. Sending countries: ${req.sendingCountries.join(", ")}; Receiving countries: ${req.receivingCountries.join(", ")}. Cross-border transactions are orchestrated without intermediary pooling; foreign exchange conversions are executed by regulated banking partners.`
    },
    section07_settlementAndTreasuryArchitecture: {
      title: "7. Settlement & Treasury Architecture",
      content: `Multi-rail virtual account generation (VAN) isolated per customer transaction intent. Deterministic reconciliation engine categorizes incoming webhooks into MATCHED_EXACT, PARTIAL_PAYMENT, OVERPAYMENT, or MANUAL_REVIEW with zero race conditions.`
    },
    section08_securityAndWebhookArchitecture: {
      title: "8. Security & Webhook Architecture",
      content: "HMAC SHA-256 cryptographic webhook signatures with 300-second timestamp drift tolerance, nonces deduplication, and immediate replay attack rejection. Complete secret redaction across all audit logs."
    },
    section09_integrationPlan: {
      title: "9. Integration Plan",
      content: `Selected integrations: ${cleanPayload.integration.requiredIntegrations.join(", ")}. REST API endpoints for payment intent creation; bidirectional secure webhooks for status callbacks; optional ERP/accounting bridge.`
    },
    section10_deploymentModel: {
      title: "10. Deployment Model",
      content: `Model: ${recTier.deploymentModel}. Client preference: ${dep.deploymentModel}. Enforces network segregation, strict environment variable secret storage, and zero persistence of plaintext card or banking secrets.`
    },
    section11_regulatoryAndZeroCustodyDemarcation: {
      title: "11. Regulatory & Zero-Custody Demarcation",
      content: "MANDATORY STATUTORY DECLARATION: GARUDA is an enterprise technology provider, not a bank, NBFC, payment aggregator, or money transmitter. GARUDA software never touches, holds, or pools customer funds at any stage of the payment lifecycle. Funds move exclusively across regulated payment rails under client's direct agreements with licensed clearing providers."
    },
    section12_implementationPhasing: {
      title: "12. Implementation Phasing",
      content: `Target Go-Live: ${cleanPayload.commercial.expectedGoLiveWindow}. Phased rollout ensures zero disruption: Phase 1 Architecture & Sandbox (Days 1–5), Phase 2 Provider Integration & Verification (Days 6–12), Phase 3 Pilot Activation & Handover.`
    },
    section13_pilotPhaseDefinition: {
      title: "13. Pilot Phase Definition",
      stages: [
        {
          stage: "Stage 1: Sandbox Testing",
          description: "Full protocol testing using GARUDA Mock Bank. Validates VAN provisioning, webhook signatures, idempotency, and reconciliation rules with zero capital risk."
        },
        {
          stage: "Stage 2: Controlled Pilot",
          description: "Low-volume live testing on a single corridor with real regulated banking credentials. Dual-operator manual sign-off for reconciliation verification."
        },
        {
          stage: "Stage 3: Production Scale",
          description: "Multi-rail automated routing with dynamic failover, real-time treasury telemetry, and continuous cryptographic audit logging."
        }
      ]
    },
    section14_acceptanceCriteria: {
      title: "14. Acceptance Criteria",
      content: "100% passage on automated webhook security tests (10 mandatory scenarios); zero reconciliation discrepancies across sandbox simulation; validated end-to-end zero-custody audit trace."
    },
    section15_indicativeCommercialStartingPoint: {
      title: "15. Indicative Commercial Starting Point",
      tier: recTier.title,
      pricing: recTier.indicativePricing,
      setupFeeINR: recTier.setupFeeINR,
      monthlyFeeINR: recTier.monthlyFeeINR,
      disclaimer: "Indicative starting point only; not a binding commercial offer. Final pricing depends on transaction volume, supported corridors, regulated-provider availability, and commercial scope."
    },
    section16_thirdPartyProviderCostDemarcation: {
      title: "16. Third-Party Provider Cost Demarcation",
      content: "Statutory segregation of financial responsibilities:",
      breakdown: [
        { item: "GARUDA Platform License / Software Fee", party: "Payable to GARUDA OS (Software orchestration)" },
        { item: "Banking Interchange & Clearing Fees", party: "Billed directly by Acquiring Bank / Partner (Wio, ICICI, Modulr)" },
        { item: "Foreign Exchange (FX) Spreads & Swaps", party: "Applied directly by interbank clearing institutions" },
        { item: "Applicable Taxes (GST / VAT / Corporate Taxes)", party: "Statutory compliance per jurisdiction" }
      ]
    },
    section17_technicalAssumptions: {
      title: "17. Technical Assumptions",
      content: "Client provides lawful corporate identity and maintains active, good-standing corporate accounts with licensed banking/payment providers in all operating jurisdictions."
    },
    section18_clientResponsibilities: {
      title: "18. Client Responsibilities",
      content: "Executing commercial agreements directly with licensed payment providers; safeguarding API secret credentials on client systems; maintaining corporate compliance with applicable AML/KYC regulations."
    },
    section19_founderApprovalNotice: {
      title: "19. Founder Approval Notice",
      content: "DRAFT PROPOSAL — PRELIMINARY ARCHITECTURAL EVALUATION. This document is a non-binding technical scoping draft generated autonomously by GARUDA Solution Architect and is strictly subject to formal review and sign-off by Founder Praveen Mahawar before execution of commercial agreements."
    }
  };

  const estimatedINR = recTier.setupFeeINR ? recTier.setupFeeINR : (recTier.monthlyFeeINR ? recTier.monthlyFeeINR * 3 : 50000);
  const estimatedUSD = Math.round(estimatedINR / 85);

  const proposalDoc = {
    proposalId: scopeId,
    scopeId,
    isFintech: true,
    service: "fintech-gateway",
    project: {
      title: `GARUDA Gateway: ${recTier.title} Architecture for ${idn.company}`,
      requirements: `Deployment model: ${recTier.title}. Corridors: ${req.requiredCurrencies.join(", ")} (${req.moneyMovement}). Volume: ${req.expectedMonthlyVolume}. Integrations: ${cleanPayload.integration.requiredIntegrations.join(", ")}. Direct bank zero-custody clearing.`
    },
    client: {
      name: idn.name,
      company: idn.company,
      organization: idn.company,
      email: idn.email,
      phone: idn.phone,
      country: idn.country
    },
    customer: {
      name: idn.name,
      email: idn.email,
      phone: idn.phone,
      company: idn.company,
      service: "fintech-gateway"
    },
    fintechLeadData: cleanPayload,
    fintechQualification: qualificationResult,
    fintechSections: sections,
    deliverables: [
      `Dedicated ${recTier.title} gateway orchestration container`,
      "Zero-Custody multi-rail settlement state machine",
      "Cryptographic webhook verification & HMAC tamper defense",
      "Deterministic VAN allocation & reconciliation engine",
      "Multi-currency treasury visibility & export suite",
      "3-stage pilot deployment roadmap with sandbox verification"
    ],
    pricing: {
      currency: "INR",
      totalINR: estimatedINR,
      totalUSD: estimatedUSD,
      totalAmount: estimatedINR,
      depositAmount: recTier.setupFeeINR || recTier.monthlyFeeINR || 25000,
      pricingModel: "commercial_software_license",
      indicativeQuote: recTier.indicativePricing,
      indicativeSetupFeeINR: recTier.setupFeeINR,
      indicativeMonthlyFeeINR: recTier.monthlyFeeINR,
      statutoryDemarcation: sections.section16_thirdPartyProviderCostDemarcation.breakdown
    },
    timeline: {
      estimatedDeliveryDays: qualificationResult.estimatedComplexity
    },
    status: "SCOPED",
    governanceStatus: "AWAITING_FOUNDER_APPROVAL",
    pipelineStage: PIPELINE_STAGES.PROPOSAL_DRAFT,
    paymentStatus: "UNPAID",
    paidAmount: 0,
    verifiedRevenue: false,
    founderApproved: false,
    publicUrl,
    createdAt: new Date().toISOString()
  };

  return proposalDoc;
}

/**
 * Formats Telegram alert strictly per Founder Praveen's specification:
 * 🦅 NEW FINTECH LEAD:
 * Company: ...
 * Selected Tier: ...
 * Preliminary Architecture: ...
 * Volume: ...
 * Currencies: ...
 * Deployment: ...
 * Cross-Border: ...
 * Integrations: ...
 * Status: ...
 * View Lead: ...
 */
function formatFintechTelegramAlert(cleanPayload, qualificationResult, proposalUrl) {
  const idn = cleanPayload.identity || {};
  const req = cleanPayload.paymentRequirements || {};
  const dep = cleanPayload.deployment || {};
  const int = cleanPayload.integration || {};

  const depRaw = dep.deploymentModel || "Hosted";
  const depMap = {
    hosted: "Hosted",
    privatevpc: "Private VPC",
    selfhosted: "Self-Hosted Sovereign",
    enterprisecustom: "Enterprise Custom"
  };
  const depFormatted = depMap[depRaw.toLowerCase()] || (depRaw.charAt(0).toUpperCase() + depRaw.slice(1));

  const lines = [
    "🦅 NEW FINTECH LEAD:",
    `Company: ${idn.company || idn.name || "Enterprise Prospect"}`,
    `Selected Tier: ${qualificationResult.selectedTierDetails?.title || req.selectedTier || "Cloud Starter"}`,
    `Preliminary Architecture: ${qualificationResult.recommendedTierDetails?.title || "Cloud Starter"}`,
    `Volume: ${req.expectedMonthlyVolume || "Unspecified"}`,
    `Currencies: ${(req.requiredCurrencies || ["INR"]).join(", ")}`,
    `Deployment: ${depFormatted}`,
    `Cross-Border: ${req.moneyMovement === "cross-border" || req.moneyMovement === "both" ? "Yes (" + (req.requiredCurrencies || []).join(", ") + ")" : "Domestic Only"}`,
    `Integrations: ${(int.requiredIntegrations || ["REST API"]).join(", ")}`,
    `Status: Draft Proposal Created — Awaiting Founder Review`,
    `Contact: ${idn.name} (${idn.email || "No email"} | ${idn.phone || "No phone"})`,
    `View Lead: ${proposalUrl}`
  ];

  return lines.join("\n");
}

module.exports = {
  FORBIDDEN_FINANCIAL_FIELDS,
  PIPELINE_STAGES,
  COMMERCIAL_TIERS,
  PROVIDER_STATUS_REGISTRY,
  sanitizeString,
  validateAndSanitizeFintechPayload,
  evaluateFintechRequirements,
  buildFintechProposalDraft,
  formatFintechTelegramAlert
};
