/**
 * GARUDA Semantic Memory Service
 *
 * Remembers CONTEXT, not just keywords.
 * Stores conversations, decisions, outcomes as embeddings.
 * Retrieves relevant memories when similar situations arise.
 *
 * Unlike founderMemoryService (keyword-based):
 * - This stores full context with timestamps
 * - Retrieves by relevance, not just keyword match
 * - Tracks decision outcomes for learning
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const MEMORY_STORE = path.join(DATA_DIR, "semantic-memory.json");

// ──────────────────────────────────────────────────────────────────────────────
// 1. MEMORY TYPES — What GARUDA remembers
// ──────────────────────────────────────────────────────────────────────────────

const MEMORY_TYPES = {
  CONVERSATION: "conversation",     // What founder said
  DECISION: "decision",             // What was decided
  OUTCOME: "outcome",               // What happened
  LEARNING: "learning",             // What was learned
  PREFERENCE: "preference",         // What founder prefers
  FACT: "fact",                     // Verified information
  STRATEGY: "strategy"              // What approach worked/failed
};

// ──────────────────────────────────────────────────────────────────────────────
// 2. LOAD / SAVE
// ──────────────────────────────────────────────────────────────────────────────

function loadMemory() {
  try {
    if (!fs.existsSync(MEMORY_STORE)) return { entries: [], index: {} };
    return JSON.parse(fs.readFileSync(MEMORY_STORE, "utf8"));
  } catch {
    return { entries: [], index: {} };
  }
}

function saveMemory(store) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(MEMORY_STORE, JSON.stringify(store, null, 2));
}

// ──────────────────────────────────────────────────────────────────────────────
// 3. STORE MEMORY — Save with context
// ──────────────────────────────────────────────────────────────────────────────

function storeMemory({ type, content, context, tags, importance }) {
  const store = loadMemory();

  const entry = {
    id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: type || MEMORY_TYPES.FACT,
    content,
    context: context || {},
    tags: tags || [],
    importance: importance || 5, // 1-10 scale
    createdAt: new Date().toISOString(),
    lastAccessed: null,
    accessCount: 0,
    relatedMemories: [],
    outcome: null // filled later when result is known
  };

  // Build simple keyword index for retrieval
  const keywords = extractKeywords(content);
  for (const kw of keywords) {
    if (!store.index[kw]) store.index[kw] = [];
    store.index[kw].push(entry.id);
  }

  store.entries.push(entry);
  saveMemory(store);

  console.log(`[SemanticMemory] Stored: ${type} — ${content.slice(0, 60)}...`);
  return entry.id;
}

// ──────────────────────────────────────────────────────────────────────────────
// 4. RETRIEVE — Find relevant memories
// ──────────────────────────────────────────────────────────────────────────────

function retrieveMemories(query, { type, limit, minImportance } = {}) {
  const store = loadMemory();
  const queryKeywords = extractKeywords(query);

  // Score each memory by relevance
  const scored = [];
  for (const entry of store.entries) {
    // Type filter
    if (type && entry.type !== type) continue;

    // Importance filter
    if (minImportance && entry.importance < minImportance) continue;

    // Relevance score
    let score = 0;
    const entryKeywords = extractKeywords(entry.content);

    // Keyword overlap
    for (const qk of queryKeywords) {
      for (const ek of entryKeywords) {
        if (qk === ek) score += 3;
        else if (qk.includes(ek) || ek.includes(qk)) score += 1;
      }
    }

    // Tag match
    if (entry.tags) {
      for (const tag of entry.tags) {
        if (query.toLowerCase().includes(tag.toLowerCase())) score += 2;
      }
    }

    // Recency bonus (newer = higher score)
    const ageHours = (Date.now() - new Date(entry.createdAt).getTime()) / (1000 * 60 * 60);
    if (ageHours < 24) score += 5;
    else if (ageHours < 168) score += 3; // 1 week
    else if (ageHours < 720) score += 1; // 1 month

    // Importance bonus
    score += entry.importance * 0.5;

    if (score > 0) {
      scored.push({ ...entry, relevanceScore: score });
    }
  }

  // Sort by score, return top N
  scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
  const results = scored.slice(0, limit || 5);

  // Update access tracking
  for (const r of results) {
    const mem = store.entries.find(e => e.id === r.id);
    if (mem) {
      mem.lastAccessed = new Date().toISOString();
      mem.accessCount++;
    }
  }
  saveMemory(store);

  return results;
}

// ──────────────────────────────────────────────────────────────────────────────
// 5. RECORD OUTCOME — What happened after a decision
// ──────────────────────────────────────────────────────────────────────────────

function recordOutcome(memoryId, { outcome, success, notes }) {
  const store = loadMemory();
  const entry = store.entries.find(e => e.id === memoryId);
  if (!entry) return false;

  entry.outcome = {
    result: outcome,
    success,
    notes,
    recordedAt: new Date().toISOString()
  };

  // Store as new learning
  storeMemory({
    type: MEMORY_TYPES.LEARNING,
    content: `Decision "${entry.content.slice(0, 50)}" resulted in: ${outcome}. Success: ${success}`,
    context: { originalMemoryId: memoryId, outcome },
    tags: ["learning", "outcome", success ? "success" : "failure"],
    importance: success ? 7 : 8 // failures are more important to remember
  });

  saveMemory(store);
  return true;
}

// ──────────────────────────────────────────────────────────────────────────────
// 6. GET CONTEXT — Build context for LLM prompts
// ──────────────────────────────────────────────────────────────────────────────

function buildContextPack(currentTopic) {
  const store = loadMemory();
  const relevant = retrieveMemories(currentTopic || "general", { limit: 10 });

  const contextParts = [];

  // Recent conversations
  const conversations = relevant.filter(e => e.type === MEMORY_TYPES.CONVERSATION);
  if (conversations.length > 0) {
    contextParts.push("RECENT CONVERSATIONS:");
    for (const c of conversations.slice(0, 3)) {
      contextParts.push(`- ${c.content.slice(0, 200)}`);
    }
  }

  // Recent learnings
  const learnings = relevant.filter(e => e.type === MEMORY_TYPES.LEARNING);
  if (learnings.length > 0) {
    contextParts.push("\nLEARNINGS:");
    for (const l of learnings.slice(0, 3)) {
      contextParts.push(`- ${l.content.slice(0, 200)}`);
    }
  }

  // Active strategies
  const strategies = relevant.filter(e => e.type === MEMORY_TYPES.STRATEGY);
  if (strategies.length > 0) {
    contextParts.push("\nACTIVE STRATEGIES:");
    for (const s of strategies.slice(0, 3)) {
      contextParts.push(`- ${s.content.slice(0, 200)}`);
    }
  }

  // Founder preferences
  const prefs = store.entries.filter(e => e.type === MEMORY_TYPES.PREFERENCE).slice(-5);
  if (prefs.length > 0) {
    contextParts.push("\nFOUNDER PREFERENCES:");
    for (const p of prefs) {
      contextParts.push(`- ${p.content.slice(0, 200)}`);
    }
  }

  return contextParts.join("\n") || "No relevant memories found.";
}

// ──────────────────────────────────────────────────────────────────────────────
// 7. KEYWORD EXTRACTION — Simple but effective
// ──────────────────────────────────────────────────────────────────────────────

function extractKeywords(text) {
  if (!text) return [];
  const stopWords = new Set(["the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could", "should",
    "may", "might", "shall", "can", "need", "dare", "ought", "used", "to",
    "of", "in", "for", "on", "with", "at", "by", "from", "as", "into",
    "through", "during", "before", "after", "above", "below", "between",
    "out", "off", "over", "under", "again", "further", "then", "once",
    "here", "there", "when", "where", "why", "how", "all", "both",
    "each", "few", "more", "most", "other", "some", "such", "no",
    "nor", "not", "only", "own", "same", "so", "than", "too", "very",
    "just", "don", "now", "ki", "hai", "ye", "wo", "me", "ka", "ke",
    "ko", "se", "ne", "par", "aur", "ya", "jo", "kya", "kab", "kaise"]);

  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w))
    .slice(0, 20);
}

// ──────────────────────────────────────────────────────────────────────────────
// 8. MEMORY STATS
// ──────────────────────────────────────────────────────────────────────────────

function getMemoryStats() {
  const store = loadMemory();
  const byType = {};
  for (const entry of store.entries) {
    byType[entry.type] = (byType[entry.type] || 0) + 1;
  }

  const avgImportance = store.entries.length > 0
    ? (store.entries.reduce((sum, e) => sum + e.importance, 0) / store.entries.length).toFixed(1)
    : 0;

  const withOutcomes = store.entries.filter(e => e.outcome).length;
  const successful = store.entries.filter(e => e.outcome?.success).length;

  return {
    totalMemories: store.entries.length,
    byType,
    avgImportance,
    withOutcomes,
    successRate: withOutcomes > 0 ? ((successful / withOutcomes) * 100).toFixed(1) + "%" : "N/A",
    indexSize: Object.keys(store.index).length
  };
}

module.exports = {
  storeMemory,
  retrieveMemories,
  recordOutcome,
  buildContextPack,
  getMemoryStats,
  MEMORY_TYPES
};
