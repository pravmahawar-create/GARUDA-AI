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

module.exports = {
  DIRECT_WORK_SIGNALS,
  GENERIC_PAGE_PATHS,
  HUMAN_IDENTITY_SIGNALS,
  LISTING_KINDS,
  SOURCE_TRUTH_MAX_AGE_MS,
  TALENT_NETWORK_SIGNALS,
  assertCurrentSourceTruth,
  canonicalRecord,
  classifySourceTruth,
  normalizeText,
  sourceRecordHash
};
