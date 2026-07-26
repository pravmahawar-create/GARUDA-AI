const capabilityRegistry = require("./capabilityRegistryService");

const HUMAN_IDENTITY_SIGNALS = [
  "employee", "employment", "full time", "full-time", "part time", "part-time",
  "resume", "cv", "interview", "degree", "years experience", "years of experience",
  "work authorization", "linkedin", "portfolio", "background check", "coding challenge",
  "technical evaluation", "apply to join", "talent network", "vetted network", "your rate"
];

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
  const normalized = tokenizeDemand(demand);
  const matchedTags = capability.tags.filter((tag) => {
    const normalizedTag = normalizeText(tag);
    return normalized.text.includes(normalizedTag) || normalized.tokens.has(normalizedTag);
  });
  const score = capability.tags.length
    ? Math.round((matchedTags.length / Math.min(capability.tags.length, 5)) * 100)
    : 0;
  return { score: Math.min(100, score), matchedTags };
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
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  const traceEnabled = Boolean(options.trace || process.env.TRACE_MODE === "true");
  let trace = undefined;

  if (traceEnabled) {
    const { tokens } = tokenizeDemand(demand);
    const winningCapability = matches.length > 0 ? matches[0].id : null;
    const topScore = matches.length > 0 ? matches[0].score : 0;

    trace = {
      opportunityId: String(demand.externalId || demand.id || demand.title || ""),
      tokensExtracted: Array.from(tokens),
      winningCapability,
      candidates: capabilities.map((cap) => {
        const { score, matchedTags } = scoreCapability(cap, demand);
        return {
          id: cap.id,
          name: cap.name,
          category: cap.category,
          matchedTags,
          finalScore: score,
          confidence: cap.confidenceScore,
          status: score < minimumScore ? "below_threshold" : cap.id === winningCapability ? "winner" : "lost",
          lossReason: score < minimumScore
            ? `Score (${score}) below minimumScore (${minimumScore})`
            : cap.id !== winningCapability
            ? `Score (${score}) lower than winner score (${topScore})`
            : undefined
        };
      })
    };
  }

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
    ...(trace ? { trace } : {}),
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
