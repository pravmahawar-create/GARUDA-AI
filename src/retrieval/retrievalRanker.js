const { normalizeText } = require("./queryNormalizer");

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
