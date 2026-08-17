// GARUDA ABSLI Knowledge Accessor
//
// Single governed knowledge source for insurance Q&A. Prefers the canonical
// MongoDB `Knowledge` collection (category ABSLI) so deployed servers answer
// from the same verified knowledge the rest of GARUDA uses (RAG). Falls back to
// tracked file chunks (src/knowledge/absl-knowledge.json) only when MongoDB is
// unavailable so the bot never answers from nothing. Never fabricates figures.
const fs = require("fs");
const path = require("path");

const STATIC_KNOWLEDGE_PATH = path.join(__dirname, "..", "knowledge", "absl-knowledge.json");
const KNOWLEDGE_INDEX_PATH = path.join(__dirname, "..", "..", "data", "knowledge-index.json");

function loadStaticChunks() {
  let combined = [];
  try {
    const raw = fs.readFileSync(STATIC_KNOWLEDGE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) combined = combined.concat(parsed);
  } catch {}
  return combined;
}

function loadIndexChunks() {
  try {
    const raw = fs.readFileSync(KNOWLEDGE_INDEX_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function mongoKnowledgeAvailable() {
  try {
    const mongoose = require("mongoose");
    return Boolean(mongoose.connection && mongoose.connection.readyState === 1);
  } catch {
    return false;
  }
}

// Pull ABSLI knowledge chunks for a query. Returns normalized chunks:
// { text, source, page, score, origin: "mongo" | "static" | "index" }
async function getKnowledgeChunks(query, limit = 8) {
  const cleanQuery = String(query || "").trim();
  let chunks = [];
  let origin = null;

  if (await mongoKnowledgeAvailable()) {
    try {
      const knowledgeService = require("./knowledgeService");
      const results = await knowledgeService.searchKnowledgeByCategory(cleanQuery || "ABSLI", "ABSLI", limit);
      if (results && results.length) {
        chunks = results.map((item) => ({
          text: item.text,
          source: item.sourceFile,
          page: item.page,
          score: item.score,
          origin: "mongo"
        }));
        origin = "mongo";
      }
    } catch {}
  }

  if (!chunks.length) {
    const staticChunks = loadStaticChunks();
    const indexChunks = loadIndexChunks();
    const all = [...staticChunks, ...indexChunks];
    if (all.length) {
      chunks = all.map((c) => ({
        text: c.text || c.content || "",
        source: c.source || (staticChunks.includes(c) ? "absl-knowledge.json" : "knowledge-index.json"),
        page: c.page,
        score: 1,
        origin: indexChunks.length ? "index" : "static"
      }));
      origin = indexChunks.length ? "index" : "static";
    }
  }

  return { chunks, origin };
}

function knowledgeStats() {
  const staticCount = loadStaticChunks().length;
  const indexCount = loadIndexChunks().length;
  return { staticChunks: staticCount, indexChunks: indexCount, preferredOrigin: "mongo" };
}

module.exports = {
  getKnowledgeChunks,
  knowledgeStats,
  loadIndexChunks,
  loadStaticChunks,
  mongoKnowledgeAvailable
};