const capabilityRegistry = require("./capabilityRegistryService");

const HUMAN_IDENTITY_SIGNALS = [
  "employee", "employment", "full time", "full-time", "part time", "part-time",
  "resume", "cv", "interview", "degree", "years experience", "years of experience",
  "work authorization", "linkedin", "portfolio", "background check", "coding challenge",
  "technical evaluation", "apply to join", "talent network", "vetted network", "your rate"
];

const EXACT_ALIAS_MAP = {
  "node.js": "node",
  "nodejs": "node",
  "next.js": "nextjs",
  "next js": "nextjs",
  "postgre-sql": "postgres",
  "postgresql": "postgres",
  "auth-0": "auth0",
  "k8s": "kubernetes",
  "dockerized": "docker",
  "restful": "rest",
  "graphql-api": "graphql"
};

function normalizeExactToken(token = "") {
  let cleaned = String(token).toLowerCase().trim().replace(/['"’]/g, "");

  if (EXACT_ALIAS_MAP[cleaned]) {
    return EXACT_ALIAS_MAP[cleaned];
  }

  // Deterministic plural to singular normalization for domain terms
  if (cleaned.endsWith("s") && !cleaned.endsWith("ss") && cleaned.length > 3) {
    if (cleaned.endsWith("ies")) {
      cleaned = cleaned.slice(0, -3) + "y";
    } else if (cleaned.endsWith("es") && (cleaned.endsWith("ches") || cleaned.endsWith("shes") || cleaned.endsWith("boxes"))) {
      cleaned = cleaned.slice(0, -2);
    } else if (cleaned.endsWith("s") && !cleaned.endsWith("is") && !cleaned.endsWith("us") && !cleaned.endsWith("os")) {
      cleaned = cleaned.slice(0, -1);
    }
  }

  return cleaned;
}

function normalizeText(value = "") {
  const raw = String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const cleanedText = raw.replace(/[-_./]+/g, " ").replace(/[^a-z0-9+#\s]+/g, " ").replace(/\s+/g, " ").trim();
  const tokens = cleanedText.split(" ").map(normalizeExactToken);
  return tokens.join(" ");
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

function compareTieBreak(a, b, demand = {}) {
  // 1. Primary score comparison
  if (b.score !== a.score) return b.score - a.score;

  const titleText = normalizeText(demand.title || "");
  const descText = normalizeText(demand.description || "");

  // 2. Exact capability name match in title or description
  const normNameA = normalizeText(a.name);
  const normNameB = normalizeText(b.name);
  const nameInTitleA = titleText.includes(normNameA) ? 2 : descText.includes(normNameA) ? 1 : 0;
  const nameInTitleB = titleText.includes(normNameB) ? 2 : descText.includes(normNameB) ? 1 : 0;
  if (nameInTitleB !== nameInTitleA) return nameInTitleB - nameInTitleA;

  // 3. Exact tag match count
  const matchCountA = (a.matchedTags || []).length;
  const matchCountB = (b.matchedTags || []).length;
  if (matchCountB !== matchCountA) return matchCountB - matchCountA;

  // 4. Exact phrase match length (total character length of matched tags)
  const phraseLenA = (a.matchedTags || []).reduce((acc, t) => acc + t.length, 0);
  const phraseLenB = (b.matchedTags || []).reduce((acc, t) => acc + t.length, 0);
  if (phraseLenB !== phraseLenA) return phraseLenB - phraseLenA;

  // 5. Domain category match in title or description
  const normCatA = normalizeText(a.category);
  const normCatB = normalizeText(b.category);
  const catInTitleA = titleText.includes(normCatA) ? 2 : descText.includes(normCatA) ? 1 : 0;
  const catInTitleB = titleText.includes(normCatB) ? 2 : descText.includes(normCatB) ? 1 : 0;
  if (catInTitleB !== catInTitleA) return catInTitleB - catInTitleA;

  // 6. Confidence score
  const confA = a.confidenceScore || 0;
  const confB = b.confidenceScore || 0;
  if (confB !== confA) return confB - confA;

  // 7. Alphabetical order (LAST fallback ONLY)
  return a.name.localeCompare(b.name);
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
    .sort((a, b) => compareTieBreak(a, b, demand));

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
            ? `Score (${score}) lower or lost tie-break to winner (${winningCapability})`
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
  normalizeExactToken,
  normalizeText,
  requiresHumanIdentity,
  scoreCapability,
  tokenizeDemand
};
