const Knowledge = require("../models/Knowledge");

function normalizeKnowledgeItem(item) {
  return {
    sourceFile: item.sourceFile,
    page: item.page,
    category: item.category,
    text: item.content,
    score: item.score,
  };
}

exports.searchKnowledge = async (query, limit = 10) => {
  const cleanQuery = String(query || "").trim();

  if (!cleanQuery || mongoose.connection.readyState !== 1) return [];

  const safeLimit = Math.max(1, Number(limit) || 10);

  const results = await Knowledge.find(
    { $text: { $search: cleanQuery } },
    { score: { $meta: "textScore" } }
  )
    .sort({ score: { $meta: "textScore" } })
    .limit(safeLimit)
    .lean();

  return results.map(normalizeKnowledgeItem);
};

exports.searchKnowledgeByCategory = async (
  query,
  category,
  limit = 8
) => {
  const cleanQuery = String(query || "").trim();
  const safeCategory = String(category || "").trim();

  if (!cleanQuery || !safeCategory || mongoose.connection.readyState !== 1) return [];

  const safeLimit = Math.max(1, Number(limit) || 8);

  const results = await Knowledge.find(
    {
      category: safeCategory,
      $text: { $search: cleanQuery },
    },
    { score: { $meta: "textScore" } }
  )
    .sort({ score: { $meta: "textScore" } })
    .limit(safeLimit)
    .lean();

  return results.map(normalizeKnowledgeItem);
};
