const capabilityRegistry = require("./capabilityRegistryService");

const HUMAN_IDENTITY_SIGNALS = [
  "employee", "employment", "full time", "full-time", "part time", "part-time",
  "resume", "cv", "interview", "degree", "years experience", "years of experience",
  "work authorization", "linkedin", "portfolio", "background check", "coding challenge",
  "technical evaluation", "apply to join", "talent network", "vetted network", "your rate"
];

const SYNONYM_MAP = {
  i18n: "translation",
  localization: "translation",
  translate: "translation",
  sow: "proposal",
  quotation: "proposal",
  rfp: "tender",
  refactor: "audit",
  codebase: "repository",
  db: "database",
  postgres: "database",
  sql: "database",
  sheet: "spreadsheet",
  excel: "spreadsheet",
  csv: "spreadsheet",
  qa: "testing",
  validation: "testing"
};

const HIGH_WEIGHT_TAGS = new Set([
  "audit", "api", "translation", "vector", "3d", "spreadsheet", "csv", "rfp", "tender",
  "gdpr", "underwriting", "zendesk", "n8n", "docker", "kubernetes", "logo", "motion", "video"
]);

function normalizeText(value = "") {
  return String(value).toLowerCase().replace(/[^a-z0-9+#.]+/g, " ").replace(/\s+/g, " ").trim();
}

function tokenizeDemand(demand = {}) {
  const text = normalizeText([
    demand.title,
    demand.description,
    demand.category,
    ...(Array.isArray(demand.tags) ? demand.tags : [])
  ].filter(Boolean).join(" "));
  return { text, tokens: new Set(text.split(" ").filter((token) => token.length > 1)) };
}

function requiresHumanIdentity(demand = {}) {
  const { text } = tokenizeDemand(demand);
  return HUMAN_IDENTITY_SIGNALS.some((signal) => text.includes(signal));
}

function scoreCapability(capability, demand = {}) {
  const titleText = normalizeText(demand.title || "");
  const descText = normalizeText(demand.description || "");
  const fullText = `${titleText} ${descText}`;
  const tokens = new Set(fullText.split(" ").filter((t) => t.length > 1));

  tokens.forEach((t) => {
    if (SYNONYM_MAP[t]) tokens.add(SYNONYM_MAP[t]);
  });

  let rawScore = 0;
  const matchedTags = [];

  capability.tags.forEach((tag) => {
    const normTag = normalizeText(tag);
    const inTitle = titleText.includes(normTag);
    const inDesc = descText.includes(normTag) || tokens.has(normTag);

    if (inTitle || inDesc) {
      matchedTags.push(tag);
      let tagWeight = 15;
      if (HIGH_WEIGHT_TAGS.has(normTag)) tagWeight += 10;
      if (inTitle) tagWeight *= 1.5;
      rawScore += tagWeight;
    }
  });

  const normCategory = normalizeText(capability.category);
  const normName = normalizeText(capability.name);
  if (titleText.includes(normCategory) || descText.includes(normCategory)) rawScore += 20;
  if (titleText.includes(normName) || descText.includes(normName)) rawScore += 25;

  const score = Math.min(100, Math.round(rawScore));
  return { score, matchedTags };
}

function matchDemand(demand = {}, options = {}) {
  if (!String(demand.title || "").trim()) {
    throw Object.assign(new Error("title is required for capability matching"), { statusCode: 400 });
  }

  const humanIdentityRequired = requiresHumanIdentity(demand);
  const minimumScore = Math.min(100, Math.max(1, Number(options.minimumScore) || 20));
  const capabilities = capabilityRegistry.listCapabilities({ eligible: true }, options);
  const matches = capabilities
    .map((capability) => ({ ...capability, ...scoreCapability(capability, demand) }))
    .filter((capability) => capability.score >= minimumScore)
    .sort((a, b) => b.score - a.score || b.confidenceScore - a.confidenceScore || a.name.localeCompare(b.name));

  const selfEarningEligible = !humanIdentityRequired && matches.length > 0;
  return {
    demand: { title: String(demand.title).trim(), source: String(demand.source || "manual").trim() },
    humanIdentityRequired,
    selfEarningEligible,
    decision: humanIdentityRequired
      ? "human_opportunity_channel_only"
      : selfEarningEligible
        ? "capability_match_found"
        : "no_verified_capability_match",
    matches,
    requiresFounderApprovalForExternalAction: true,
    automaticApplicationAllowed: false,
    automaticContractAcceptanceAllowed: false
  };
}

module.exports = {
  HUMAN_IDENTITY_SIGNALS,
  matchDemand,
  normalizeText,
  requiresHumanIdentity,
  scoreCapability,
  tokenizeDemand
};
