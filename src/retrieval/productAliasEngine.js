const productAliases = [
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
