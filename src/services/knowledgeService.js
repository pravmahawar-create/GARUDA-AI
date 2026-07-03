const Knowledge = require("../models/Knowledge");

exports.searchKnowledge = async (query) => {
  const cleanQuery = String(query || "").trim();

  if (!cleanQuery) return [];

  const results = await Knowledge.find(
    { $text: { $search: cleanQuery } },
    { score: { $meta: "textScore" } }
  )
    .sort({ score: { $meta: "textScore" } })
    .limit(10)
    .lean();

  return results.map(item => ({
    sourceFile: item.sourceFile,
    page: item.page,
    category: item.category,
    text: item.content,
    score: item.score
  }));
};
