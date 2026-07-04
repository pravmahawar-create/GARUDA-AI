const fs = require("fs");
const path = require("path");

const files = {
  "src/retrieval/queryExpander.js": `const expandQuery = (queryProfile = {}) => {
  const normalized = queryProfile.normalized || "";
  const terms = Array.isArray(queryProfile.terms) ? queryProfile.terms : [];

  const expansions = new Set(terms);

  if (normalized.includes("term insurance")) {
    [
      "term plan",
      "life cover",
      "death benefit",
      "financial protection",
      "protection plan",
      "sum assured"
    ].forEach(term => expansions.add(term));
  }

  return {
    ...queryProfile,
    expansions: Array.from(expansions)
  };
};

module.exports = {
  expandQuery
};
`,

  "src/retrieval/intentDetector.js": `const detectIntent = (queryProfile = {}) => {
  const normalized = queryProfile.normalized || "";

  if (/what is|define|meaning|means|kya hai|matlab/.test(normalized)) {
    return { ...queryProfile, intent: "definition" };
  }

  if (/benefit|features|coverage/.test(normalized)) {
    return { ...queryProfile, intent: "benefit" };
  }

  if (/premium|cost|payment|pay/.test(normalized)) {
    return { ...queryProfile, intent: "premium" };
  }

  if (/claim|death|nominee|settlement/.test(normalized)) {
    return { ...queryProfile, intent: "claim" };
  }

  return { ...queryProfile, intent: "general" };
};

module.exports = {
  detectIntent
};
`,

  "src/retrieval/productAliasEngine.js": `const productAliases = [
  {
    match: ["term insurance", "term plan", "life cover"],
    aliases: ["ABSLI Super Term Plan", "Super Term Plan"]
  },
  {
    match: ["fixed maturity", "maturity plan"],
    aliases: ["ABSLI Fixed Maturity Plan"]
  }
];

const applyProductAliases = (queryProfile = {}) => {
  const normalized = queryProfile.normalized || "";
  const expansions = new Set(queryProfile.expansions || []);

  for (const product of productAliases) {
    if (product.match.some(term => normalized.includes(term))) {
      product.aliases.forEach(alias => expansions.add(alias));
    }
  }

  return {
    ...queryProfile,
    expansions: Array.from(expansions)
  };
};

module.exports = {
  applyProductAliases
};
`,

  "src/retrieval/retrievalRanker.js": `const { normalizeText } = require("./queryNormalizer");

const scoreChunk = (chunk = {}, queryProfile = {}) => {
  const text = normalizeText(chunk.content || chunk.text || "");
  const sourceFile = normalizeText(chunk.sourceFile || "");
  const intent = queryProfile.intent || "general";
  const expansions = queryProfile.expansions || [];

  let score = typeof chunk.score === "number" ? chunk.score : 0;

  for (const term of expansions) {
    const normalizedTerm = normalizeText(term);
    if (normalizedTerm && text.includes(normalizedTerm)) score += 6;
    if (normalizedTerm && sourceFile.includes(normalizedTerm)) score += 4;
  }

  if (intent === "definition") {
    if (/term insurance/.test(text)) score += 12;
    if (/life cover|death benefit|financial protection|protection plan/.test(text)) score += 6;
    if (/means|refers to|is a|provides/.test(text)) score += 3;
  }

  if (queryProfile.normalized && queryProfile.normalized.includes("term insurance")) {
    if (/terminal illness/.test(text)) score -= 15;
    if (/terms and conditions|terms conditions/.test(text)) score -= 10;
    if (/fixed maturity/.test(sourceFile)) score -= 12;
    if (/the term cancer/.test(text)) score -= 15;
  }

  return score;
};

const rankChunks = (chunks = [], queryProfile = {}) =>
  chunks
    .map(chunk => ({
      ...chunk,
      hybridScore: scoreChunk(chunk, queryProfile)
    }))
    .filter(chunk => chunk.hybridScore > 0)
    .sort((a, b) => b.hybridScore - a.hybridScore);

module.exports = {
  scoreChunk,
  rankChunks
};
`,

  "src/retrieval/hybridRetriever.js": `const Knowledge = require("../models/Knowledge");
const { rankChunks } = require("./retrievalRanker");

const MAX_DB_RESULTS = 50;
const MAX_FINAL_RESULTS = 10;

const buildSearchText = (queryProfile = {}) => {
  const parts = [
    queryProfile.original,
    ...(queryProfile.expansions || [])
  ].filter(Boolean);

  return Array.from(new Set(parts)).join(" ");
};

const retrieveHybrid = async (queryProfile = {}) => {
  const searchText = buildSearchText(queryProfile);

  if (!searchText.trim()) return [];

  const rawResults = await Knowledge.find(
    { $text: { $search: searchText } },
    { score: { $meta: "textScore" } }
  )
    .sort({ score: { $meta: "textScore" } })
    .limit(MAX_DB_RESULTS)
    .lean();

  const ranked = rankChunks(rawResults, queryProfile);

  return ranked.slice(0, MAX_FINAL_RESULTS).map(item => ({
    sourceFile: item.sourceFile,
    page: item.page,
    category: item.category,
    text: item.content,
    score: item.hybridScore,
    retrievalScore: item.score
  }));
};

module.exports = {
  retrieveHybrid
};
`
};

function writeFile(filePath, content) {
  const absolutePath = path.join(process.cwd(), filePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content, "utf8");
  console.log("Wrote:", filePath);
}

console.log("GARUDA Build Orchestrator");
console.log("========================");
console.log("Target: Phase 2.4 Retrieval Intelligence");
console.log("");

for (const [filePath, content] of Object.entries(files)) {
  writeFile(filePath, content);
}

console.log("");
console.log("Build complete.");
console.log("Next: run syntax checks and integrate hybrid retriever into knowledgeService.");
