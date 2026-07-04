const Knowledge = require("../models/Knowledge");
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
