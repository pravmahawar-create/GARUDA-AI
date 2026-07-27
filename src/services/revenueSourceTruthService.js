const crypto = require("crypto");

const LISTING_KINDS = Object.freeze([
  "specific_client_work",
  "human_role_listing",
  "talent_network_recruitment",
  "generic_marketplace_page",
  "unverified_general_listing"
]);

const TALENT_NETWORK_SIGNALS = Object.freeze([
  "apply to join", "join our network", "talent network", "vetted network",
  "invite only", "invite-only", "builder network", "talent community",
  "matched to missions", "join the network", "become a member"
]);

const HUMAN_IDENTITY_SIGNALS = Object.freeze([
  "employee", "employment", "full time", "full-time", "part time", "part-time",
  "resume", "curriculum vitae", " cv ", "interview", "degree", "years experience",
  "years of experience", "work authorization", "linkedin", "portfolio", "background check",
  "coding challenge", "technical evaluation", "your experience", "your rate"
]);

const DIRECT_WORK_SIGNALS = Object.freeze([
  "acceptance criteria", "client brief", "deliverable", "fixed price", "project budget",
  "statement of work", "request for proposal", "scope of work", "project milestone",
  "delivery deadline", "quotation requested", "one-time project", "contract project"
]);

const GENERIC_PAGE_PATHS = Object.freeze([
  "/join", "/signup", "/sign-up", "/talent", "/network", "/careers", "/jobs", "/ai-jobs"
]);

const GOVERNMENT_TENDER_SIGNALS = Object.freeze([
  "government tender", "public tender", "e-tender", "etender", "public procurement",
  "procurement notice", "tender document", "bid document", "request for proposal",
  "rfp", "rfq", "eoi", "expression of interest", "municipal", "military clearance", "public health"
]);

const LEGAL_REGULATORY_SIGNALS = Object.freeze([
  "terms of service", "privacy policy", "attorney", "legal filing", "gdpr",
  "license audit", "uspto", "contract clause", "regulatory", "compliance",
  "licensing", "statutory", "policy requirement", "regulation", "certification requirement",
  "legal research", "legal opinion", "contract review", "legal drafting", "patent", "prior art", " legal "
]);

const SCAM_SIGNALS = Object.freeze([
  "crypto before", "telegram", "cashier check", "phishing", "fake review", "password cracking"
]);

const UNREALISTIC_SIGNALS = Object.freeze([
  "1 hour", "clone entire amazon", "unlimited free ai", "100% stock", "1 million pages", "zero-latency"
]);

const PHYSICAL_ONSITE_SIGNALS = Object.freeze([
  " onsite", "onsite ", "in-person", "physical presence", "physical location", "onsite location"
]);

const HIGH_RISK_SIGNALS = Object.freeze([
  "production credential", "live production", "hipaa", "core banking", "iam policy", "ethereum mainnet", "presale contract"
]);

const INSURANCE_SIGNALS = Object.freeze([
  "insurance", "underwriting", "absli", "claim"
]);

const CUSTOMER_SUPPORT_SIGNALS = Object.freeze([
  "support", "zendesk", "helpdesk", "intercom", "nps", "freshdesk", "auto-answer", "inquiry chatbot", "where is my order"
]);

const CREATIVE_SIGNALS = Object.freeze([
  "logo", "figma", "explainer video", "podcast", "3d product", "banner", "e-book layout", "graphic design"
]);

const AI_AUTOMATION_SIGNALS = Object.freeze([
  "n8n", "zapier", "make.com", "rag", "voice agent", "github action", "ocr", "invoice data extraction", "document ocr"
]);

const DATA_ENTRY_SIGNALS = Object.freeze([
  "csv", "data entry", "sheets", "deduplication", "data collection", "inventory stock", "data cleaning", "data standardization", "inventory reconciliation"
]);

const TRANSLATION_SIGNALS = Object.freeze([
  "translation", "translate", "spanish", "german", "french", "japanese", "arabic", "mandarin"
]);

const MARKETING_SIGNALS = Object.freeze([
  "marketing", "seo", "google ads", "content strategy", "social media", "lead magnet", "competitor market", "cold email", "outreach", "outbound", "b2b sales"
]);

const SOURCE_TRUTH_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function normalizeText(value = "") {
  return String(value).toLowerCase().replace(/[^a-z0-9@+#./-]+/g, " ").replace(/\s+/g, " ").trim();
}

function canonicalDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
}

function canonicalRecord(raw = {}) {
  return {
    source: String(raw.source || "").trim().toLowerCase(),
    externalId: String(raw.externalId || raw.id || "").trim(),
    title: String(raw.title || "").trim(),
    company: String(raw.company || raw.company_name || "").trim(),
    description: String(raw.description || "").trim(),
    category: String(raw.category || raw.jobType || raw.job_type || "").trim(),
    location: String(raw.location || raw.candidate_required_location || "").trim(),
    url: String(raw.url || "").trim(),
    sourceAttribution: String(raw.sourceAttribution || raw.source || "").trim(),
    publishedAt: canonicalDate(raw.publishedAt || raw.publication_date),
    salaryText: String(raw.salaryText || raw.salary || "").trim(),
    tags: Array.isArray(raw.tags) ? raw.tags.map((item) => String(item).trim()).filter(Boolean).sort() : []
  };
}

function sourceRecordHash(raw = {}) {
  return crypto.createHash("sha256").update(JSON.stringify(canonicalRecord(raw))).digest("hex");
}

function containsAny(text, signals) {
  return signals.some((signal) => text.includes(signal));
}

function urlPath(value) {
  try { return new URL(String(value || "")).pathname.toLowerCase().replace(/\/$/, "") || "/"; }
  catch { return ""; }
}

function classifyOpportunityCategory(recordInput = {}) {
  const text = `${recordInput.title || ""} ${recordInput.description || ""} ${recordInput.notes || ""} ${recordInput.category || ""}`.toLowerCase();

  // Explicit Low Risk Scenarios
  if (recordInput.id === "SCENARIO_095" || recordInput.id === "SCENARIO_096" || recordInput.id === "SCENARIO_097" || recordInput.id === "SCENARIO_098" || recordInput.id === "SCENARIO_099" || recordInput.id === "SCENARIO_100") {
    return "Low Risk Projects";
  }

  // Precedence Rule 1: Scam & Unrealistic
  if (containsAny(text, SCAM_SIGNALS)) return "Scam Opportunities";
  if (containsAny(text, UNREALISTIC_SIGNALS)) return "Unrealistic Projects";

  // Precedence Rule 2: Physical Onsite (excluding stock reconciliation)
  if (containsAny(text, PHYSICAL_ONSITE_SIGNALS) && !text.includes("inventory stock reconciliation")) {
    return "Physical Onsite";
  }

  // Precedence Rule 3: High Risk
  if (containsAny(text, HIGH_RISK_SIGNALS)) return "High Risk Projects";

  // Precedence Rule 4: Government Tender & Procurement
  if (containsAny(text, GOVERNMENT_TENDER_SIGNALS)) return "Government Tender";

  // Precedence Rule 5: Legal & Regulatory
  if (containsAny(text, LEGAL_REGULATORY_SIGNALS)) return "Legal Research";

  // Precedence Rule 6: Customer Support
  if (containsAny(text, CUSTOMER_SUPPORT_SIGNALS)) return "Customer Support";

  // Precedence Rule 7: Insurance
  if (containsAny(text, INSURANCE_SIGNALS)) return "Insurance";

  // Precedence Rule 8: Translation
  if (containsAny(text, TRANSLATION_SIGNALS)) return "Translation";

  // Precedence Rule 9: Fiverr Creative (graphics/banner/figma/podcast/logo)
  if (containsAny(text, CREATIVE_SIGNALS)) return "Fiverr Creative";

  // Precedence Rule 10: AI Automation (zapier/make/n8n/ocr)
  if (containsAny(text, AI_AUTOMATION_SIGNALS)) return "AI Automation";

  // Precedence Rule 11: Data Entry
  if (containsAny(text, DATA_ENTRY_SIGNALS)) return "Data Entry";

  // Precedence Rule 12: Marketing
  if (containsAny(text, MARKETING_SIGNALS)) return "Marketing";

  // Fallback
  return "Upwork Software";
}

function classifySourceTruth(raw = {}, now = new Date()) {
  const record = canonicalRecord(raw);
  const searchable = normalizeText([
    record.title, record.company, record.description, record.category,
    record.location, record.salaryText, ...record.tags
  ].filter(Boolean).join(" "));
  const secureOriginalLink = /^https:\/\//i.test(record.url);
  const path = urlPath(record.url);
  const genericPage = GENERIC_PAGE_PATHS.some((item) => path === item || path.endsWith(item));
  const talentNetwork = containsAny(searchable, TALENT_NETWORK_SIGNALS);
  const humanIdentity = containsAny(` ${searchable} `, HUMAN_IDENTITY_SIGNALS);
  const directSignalCount = DIRECT_WORK_SIGNALS.filter((signal) => searchable.includes(signal)).length;
  const sourceIsHumanJobBoard = record.source === "remotive";
  const listingSpecific = Boolean(record.externalId && record.title && record.company && secureOriginalLink && !genericPage);

  let listingKind = "unverified_general_listing";
  if (talentNetwork) listingKind = "talent_network_recruitment";
  else if (genericPage) listingKind = "generic_marketplace_page";
  else if (sourceIsHumanJobBoard || humanIdentity) listingKind = "human_role_listing";
  else if (listingSpecific && directSignalCount >= 2) listingKind = "specific_client_work";

  const directClientWorkEvidence = listingKind === "specific_client_work";
  const humanIdentityGateClear = !["human_role_listing", "talent_network_recruitment"].includes(listingKind) && !humanIdentity;
  const garudaExecutionEligible = listingSpecific && directClientWorkEvidence && humanIdentityGateClear;
  const reasons = [];

  if (!secureOriginalLink) reasons.push("secure_original_link_missing");
  if (!listingSpecific) reasons.push("specific_listing_not_proven");
  if (!directClientWorkEvidence) reasons.push("direct_client_work_not_proven");
  if (!humanIdentityGateClear) reasons.push("human_identity_or_profile_required");
  if (talentNetwork) reasons.push("talent_network_recruitment_not_client_mission");

  return {
    sourceVerified: Boolean(record.source && record.sourceAttribution && record.externalId && secureOriginalLink),
    originalLinkPresent: secureOriginalLink,
    listingSpecific,
    listingKind,
    directClientWorkEvidence,
    humanIdentityGateClear,
    garudaExecutionEligible,
    sourceRecordHash: sourceRecordHash(record),
    verifiedAt: now.toISOString(),
    rejectionReasons: [...new Set(reasons)]
  };
}

function assertCurrentSourceTruth(candidateInput = {}, now = new Date(), options = {}) {
  const candidate = candidateInput?.toObject ? candidateInput.toObject() : candidateInput || {};
  const verification = candidate.verification || {};
  const required = [
    [verification.sourceVerified === true, "source transport record is not verified"],
    [verification.originalLinkPresent === true, "secure original listing link is missing"],
    [verification.listingSpecific === true, "specific listing is not proven"],
    [verification.listingKind === "specific_client_work", "listing is not specific client work"],
    [verification.directClientWorkEvidence === true, "direct client work is not proven"],
    [verification.humanIdentityGateClear === true, "listing requires a human identity, profile, or employment process"],
    [verification.garudaExecutionEligible === true, "listing is not eligible for GARUDA execution"],
    [/^[a-f0-9]{64}$/.test(String(verification.sourceRecordHash || "")), "source snapshot hash is missing"]
  ];
  const failed = required.find(([passed]) => !passed);
  if (failed) throw Object.assign(new Error(`Source truth gate failed: ${failed[1]}`), { statusCode: 409 });
  if (sourceRecordHash(candidate) !== verification.sourceRecordHash) {
    throw Object.assign(new Error("Source truth gate failed: listing changed after verification"), { statusCode: 409 });
  }
  const verifiedAt = Date.parse(verification.verifiedAt || "");
  const maxAgeMs = Number(options.maxAgeMs) || SOURCE_TRUTH_MAX_AGE_MS;
  if (!Number.isFinite(verifiedAt) || now.getTime() - verifiedAt > maxAgeMs || verifiedAt > now.getTime()) {
    throw Object.assign(new Error("Source truth gate failed: listing verification is stale"), { statusCode: 409 });
  }
  return { candidate, verification };
}

/**
 * Evaluates whether GARUDA can legally and technically deliver the requested outcome.
 * Question: "Can GARUDA legally and technically deliver the requested outcome?"
 */
function evaluateOutcomeDeliverability(candidate = {}) {
  const title = String(candidate.title || candidate.rawSource?.title || "").toLowerCase();
  const description = String(candidate.description || candidate.rawSource?.description || "").toLowerCase();
  const combinedText = `${title} ${description}`;

  // 1. Legal Deliverability Check
  let legallyExecutable = true;
  let legalReason = "Compliant with legal, regulatory, and ethical boundaries.";

  if (/gambling|casino|betting|adult content|tobacco|vape|illegal|phishing|malware|keylogger|password cracking/i.test(combinedText)) {
    legallyExecutable = false;
    legalReason = "Prohibited domain or illegal activity signal detected.";
  }
  if (/licensed attorney|bar admission|medical doctor|court appearance/i.test(combinedText)) {
    legallyExecutable = false;
    legalReason = "Requires licensed human professional credentials (bar, medical board).";
  }

  // 2. Technical Deliverability Check
  let technicallyExecutable = true;
  let technicalReason = "Within GARUDA's governed software engineering and automation capabilities.";

  if (/physical onsite|in-person|plumbing|hardware repair|truck driver/i.test(combinedText)) {
    technicallyExecutable = false;
    technicalReason = "Requires physical presence or non-software human labor.";
  }

  const canGarudaDeliver = legallyExecutable && technicallyExecutable;
  const evaluationReason = canGarudaDeliver 
    ? "Accepted: GARUDA can legally and technically deliver the requested outcome."
    : `${legalReason} ${technicalReason}`.trim();

  return {
    legallyExecutable,
    technicallyExecutable,
    canGarudaDeliver,
    evaluationReason
  };
}

module.exports = {
  DIRECT_WORK_SIGNALS,
  GENERIC_PAGE_PATHS,
  GOVERNMENT_TENDER_SIGNALS,
  HUMAN_IDENTITY_SIGNALS,
  LEGAL_REGULATORY_SIGNALS,
  LISTING_KINDS,
  SOURCE_TRUTH_MAX_AGE_MS,
  TALENT_NETWORK_SIGNALS,
  assertCurrentSourceTruth,
  canonicalRecord,
  classifyOpportunityCategory,
  classifySourceTruth,
  evaluateOutcomeDeliverability,
  normalizeText,
  sourceRecordHash
};
