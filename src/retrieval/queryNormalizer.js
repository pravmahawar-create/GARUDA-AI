const stopWords = new Set([
  "what", "when", "where", "which", "whose", "whom", "about", "with", "from",
  "that", "this", "there", "their", "have", "has", "does", "into", "your",
  "please", "tell", "explain", "give", "show", "me", "is", "are", "the", "a", "an"
]);

const normalizeText = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getTerms = (query = "") =>
  normalizeText(query)
    .split(" ")
    .filter(term => term.length > 2 && !stopWords.has(term));

const normalizeQuery = (query = "") => {
  const original = String(query || "").trim();
  const normalized = normalizeText(original);
  const terms = getTerms(original);

  return {
    original,
    normalized,
    terms
  };
};

module.exports = {
  normalizeText,
  normalizeQuery,
  getTerms
};
