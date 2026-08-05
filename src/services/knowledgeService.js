const mongoose = require("mongoose");
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

  try {
    const results = await Knowledge.find(
      { $text: { $search: cleanQuery } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(safeLimit)
      .lean();

    if (results && results.length) {
      return results.map(normalizeKnowledgeItem);
    }
  } catch {
    // text search failed or unindexed
  }

  const results = await Knowledge.find({
    $or: [
      { title: new RegExp(cleanQuery, "i") },
      { content: new RegExp(cleanQuery, "i") }
    ]
  })
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

  try {
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

    if (results && results.length) {
      return results.map(normalizeKnowledgeItem);
    }
  } catch {
    // text index search unindexed or stop-word filtered
  }

  // Fallback 1: Keyword / regex matching in category
  const words = cleanQuery
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (words.length) {
    const results = await Knowledge.find({
      category: safeCategory,
      $or: [
        { keywords: { $in: words } },
        { title: { $in: words.map((w) => new RegExp(w, "i")) } },
        { content: { $in: words.map((w) => new RegExp(w, "i")) } }
      ]
    })
      .limit(safeLimit)
      .lean();

    if (results && results.length) {
      return results.map(normalizeKnowledgeItem);
    }
  }

  // Fallback 2: Category default documents
  const results = await Knowledge.find({ category: safeCategory })
    .limit(safeLimit)
    .lean();

  return results.map(normalizeKnowledgeItem);
};

