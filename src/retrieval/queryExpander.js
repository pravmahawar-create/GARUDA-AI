const expandQuery = (queryProfile = {}) => {
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
