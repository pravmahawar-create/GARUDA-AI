/**
 * 🦅 GARUDA Vertical Knowledge Intelligence Service
 * Phase 5 — Domain-Isolated Knowledge & RAG Grounding Engine
 *
 * Connects domain knowledge (Real Estate project profiles, inventory specs,
 * amenities, legal/RERA compliance, Creative brand guidelines, and IdentityLock specs)
 * directly into conversational AI and agent workflows.
 *
 * Reuses canonical chunking and deterministic relevance ranking without duplicating databases.
 */

const crypto = require("crypto");
const garudaEventService = require("./garudaEventService");
const { GARUDA_EVENT_TYPES } = require("./garudaEventTypes");

const domainKnowledgeStore = new Map();

function tokenize(text = "") {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

class VerticalKnowledgeService {
  constructor() {
    this.store = domainKnowledgeStore;
  }

  /**
   * 1. Register or Update Domain Knowledge Artifacts.
   */
  async registerDomainKnowledge(domain, entityId, payload = {}) {
    if (!domain || !entityId) throw new Error("domain and entityId are required");

    const key = `${domain}:${entityId}`;
    const title = String(payload.title || payload.name || entityId).trim();
    const content = String(payload.content || JSON.stringify(payload)).trim();

    // Chunk content into searchable semantic snippets
    const lines = content.split(/\n\n+/).filter(Boolean);
    const chunks = lines.map((snippet, idx) => ({
      chunkId: `chk_${domain}_${entityId}_${idx}`,
      snippet: snippet.trim(),
      tokens: tokenize(snippet)
    }));

    const record = {
      domain,
      entityId,
      title,
      chunks,
      rawContent: content,
      metadata: payload.metadata || {},
      updatedAt: new Date().toISOString()
    };

    this.store.set(key, record);

    await garudaEventService.emitGarudaEvent({
      eventType: GARUDA_EVENT_TYPES.KNOWLEDGE_SOURCE_UPDATED,
      entityType: "knowledge",
      entityId: key,
      source: "vertical_knowledge_service",
      newState: "INDEXED",
      metadata: { domain, entityId, chunkCount: chunks.length }
    });

    return record;
  }

  /**
   * 2. Query Vertical Domain Knowledge with Explainable Semantic Ranking.
   */
  async queryVerticalKnowledge(domain, query = "", limit = 4) {
    const queryTokens = tokenize(query);
    const results = [];

    for (const [key, record] of this.store.entries()) {
      if (domain && record.domain !== domain) continue;

      for (const chunk of record.chunks) {
        let score = 0;
        for (const token of queryTokens) {
          if (chunk.tokens.includes(token)) score += 10;
          else if (chunk.snippet.toLowerCase().includes(token)) score += 5;
        }

        if (score > 0) {
          results.push({
            domain: record.domain,
            entityId: record.entityId,
            title: record.title,
            snippet: chunk.snippet,
            score
          });
        }
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  /**
   * 3. Context Injection helper for agents.
   */
  async injectVerticalContext(domain, entityId, query = "") {
    const key = `${domain}:${entityId}`;
    const directDoc = this.store.get(key);
    let chunks = [];

    if (directDoc && !query) {
      chunks = directDoc.chunks.slice(0, 3).map((c) => c.snippet);
    } else {
      const queried = await this.queryVerticalKnowledge(domain, query, 3);
      chunks = queried.map((q) => `[${q.title}] ${q.snippet}`);
    }

    if (!chunks.length) return "";
    return `### VERIFIED DOMAIN KNOWLEDGE (${domain.toUpperCase()}):\n${chunks.join("\n\n")}`;
  }
}

module.exports = new VerticalKnowledgeService();
module.exports.VerticalKnowledgeService = VerticalKnowledgeService;
