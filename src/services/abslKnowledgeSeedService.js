// GARUDA ABSLI Knowledge Seed Service
//
// Seeds the canonical MongoDB `Knowledge` collection (category ABSLI) from
// verified knowledge assets so the deployed server answers insurance Q&A from
// the same governed knowledge GARUDA RAG uses. Idempotent: an index on
// (sourceFile, chunkIndex) keeps re-seeding from duplicating chunks.
//
// Sources (precedence):
//   1. data/knowledge-index.json (978 chunks, ABSLI brochure/site) — if present
//   2. src/knowledge/absl-knowledge.json (tracked enrichment chunks)
//
// Never fabricates content — only the verified chunks are written.
const fs = require("fs");
const path = require("path");
const Knowledge = require("../models/Knowledge");

const KNOWLEDGE_INDEX_PATH = path.join(__dirname, "..", "..", "data", "knowledge-index.json");
const STATIC_KNOWLEDGE_PATH = path.join(__dirname, "..", "knowledge", "absl-knowledge.json");

function readChunks(file) {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeChunk(chunk, index, originFile) {
  const text = String(chunk.text || chunk.content || "").trim();
  if (!text) return null;
  return {
    sourceFile: String(chunk.source || chunk.sourceFile || originFile).trim(),
    title: String(chunk.title || "").trim(),
    content: text,
    keywords: Array.isArray(chunk.keywords)
      ? chunk.keywords.map((k) => String(k).trim()).filter(Boolean)
      : [],
    chunkIndex: Number.isFinite(Number(chunk.chunkIndex)) ? Number(chunk.chunkIndex) : index,
    page: chunk.page != null && Number.isFinite(Number(chunk.page)) ? Number(chunk.page) : null,
    category: "ABSLI"
  };
}

async function countKnowledge() {
  return Knowledge.countDocuments({});
}

async function countByCategory(category = "ABSLI") {
  return Knowledge.countDocuments({ category });
}

// Seed MongoDB Knowledge from verified ABSLI assets. Idempotent upserts keyed by
// (sourceFile, chunkIndex).
async function seedAbslKnowledge(options = {}) {
  const sourceFiles = [KNOWLEDGE_INDEX_PATH, STATIC_KNOWLEDGE_PATH].filter((file) => fs.existsSync(file));
  const rawChunks = [];
  const origins = [];
  for (const file of sourceFiles) {
    const chunks = readChunks(file);
    if (chunks.length) {
      rawChunks.push(...chunks.map((c, i) => normalizeChunk(c, i, path.basename(file))).filter(Boolean));
      origins.push(`${path.basename(file)}:${chunks.length}`);
    }
  }
  if (!rawChunks.length) {
    return { seeded: 0, sources: [], note: "No ABSLI knowledge assets found to seed." };
  }

  const dryRun = Boolean(options.dryRun);
  let inserted = 0;
  if (!dryRun) {
    for (const chunk of rawChunks) {
      const result = await Knowledge.updateOne(
        { sourceFile: chunk.sourceFile, chunkIndex: chunk.chunkIndex },
        { $set: chunk },
        { upsert: true }
      );
      if (result.upsertedCount) inserted += 1;
    }
  }

  return {
    seeded: dryRun ? "dry_run" : inserted,
    sourceChunks: rawChunks.length,
    sources: origins,
    totalChunksNow: await countKnowledge(),
    absliChunksNow: await countByCategory("ABSLI"),
    dryRun
  };
}

module.exports = {
  countByCategory,
  countKnowledge,
  normalizeChunk,
  seedAbslKnowledge
};