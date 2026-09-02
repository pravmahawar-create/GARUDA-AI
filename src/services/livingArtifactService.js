/**
 * 🦅 GARUDA Living Artifact — Minimal reusable contract
 * Founder principle: GARUDA stands behind what it creates.
 * Lifecycle: CREATE → PRESENT → EXPLAIN → QUESTION → ANSWER → CONTINUE
 * Reuses persistentMemory for continuity; no duplicate engine.
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
function getArtifactsFile() {
  return process.env.LIVING_ARTIFACTS_FILE || path.join(DATA_DIR, "living-artifacts.jsonl");
}
const LIVING_ARTIFACTS_FILE = getArtifactsFile();

function ensureDir() {
  try { if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true }); } catch {}
}

const stores = new Map();
function getStore() {
  const file = getArtifactsFile();
  if (!stores.has(file)) stores.set(file, new Map());
  return stores.get(file);
}
const livingStore = getStore();

// Optional MongoDB model — loaded lazily, fallback to file/memory if not available
let LivingArtifactModel = null;
try {
  LivingArtifactModel = require("../models/LivingArtifact");
} catch {}
function isDbAvailable() {
  try {
    const mongoose = require("mongoose");
    const db = require("../database/db");
    return db.isMongoConnected && db.isMongoConnected() && mongoose.connection && mongoose.connection.readyState === 1 && LivingArtifactModel;
  } catch { return false; }
}

function loadFromDisk() {
  ensureDir();
  try {
    if (fs.existsSync(LIVING_ARTIFACTS_FILE)) {
      const lines = fs.readFileSync(LIVING_ARTIFACTS_FILE, "utf8").split("\n").filter(Boolean);
      for (const l of lines) {
        try { const doc = JSON.parse(l); if (doc && doc.artifactId) livingStore.set(doc.artifactId, doc); } catch {}
      }
    }
  } catch {}
}
loadFromDisk();

function appendDoc(doc) {
  ensureDir();
  try { fs.appendFileSync(LIVING_ARTIFACTS_FILE, JSON.stringify(doc) + "\n", "utf8"); } catch {}
}

function anticipateQuestions({ artifactType, audience, purpose, keyClaims, risks }) {
  const base = [];
  const type = String(artifactType || "").toLowerCase();
  const aud = String(audience || "").toLowerCase();
  const isInvestor = aud.includes("investor") || type.includes("investor") || String(purpose||"").toLowerCase().includes("investor");

  if (isInvestor) {
    base.push(
      { category: "PRODUCT", question: "What is GARUDA?" , evidenceHint: "purpose/audience" },
      { category: "DIFFERENTIATION", question: "How is GARUDA different from ChatGPT?", evidenceHint: "differentiation claim" },
      { category: "MOAT", question: "What is the moat? Why can't others easily copy it?", evidenceHint: "moat/technology" },
      { category: "REVENUE", question: "How will GARUDA make money?", evidenceHint: "revenue model" },
      { category: "MARKET", question: "Who needs it?", evidenceHint: "audience/market" },
      { category: "COMPETITION", question: "Who are competitors?", evidenceHint: "competition" },
      { category: "TECHNOLOGY", question: "What is proprietary technology?", evidenceHint: "technology" },
      { category: "SOVEREIGNTY", question: "What happens if providers disappear?", evidenceHint: "sovereignty" },
      { category: "RISKS", question: "What could go wrong?", evidenceHint: "risks" },
      { category: "FUTURE", question: "Where does GARUDA go next?", evidenceHint: "future" }
    );
  } else {
    // Generic anticipation based on claims/risks
    if (Array.isArray(keyClaims)) {
      for (const c of keyClaims.slice(0, 3)) {
        base.push({ category: "CLAIM", question: `Can you explain claim: "${String(c.claim||c).slice(0,60)}"?`, evidenceHint: c.evidence ? "evidence" : "reasoned" });
      }
    }
    if (Array.isArray(risks) && risks.length) {
      base.push({ category: "RISKS", question: "What are the main risks and mitigations?", evidenceHint: "risks" });
    }
    if (!base.length) base.push({ category: "GENERAL", question: "What was the purpose of this artifact?", evidenceHint: "purpose" });
  }
  return base;
}

function createLivingArtifactContext(input = {}) {
  const artifactId = input.artifactId || `la_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
  const artifactType = input.artifactType || "investor_presentation";
  const purpose = input.purpose || "Explain GARUDA to investor";
  const audience = input.audience || "investor";
  const sourceGoal = input.sourceGoal || input.goal || null;
  const sourceBrief = input.sourceBrief || null;

  const narrative = input.narrative || buildDefaultNarrative({ artifactType, purpose, audience, sourceGoal });
  const keyClaims = Array.isArray(input.keyClaims) ? input.keyClaims : buildDefaultClaims({ artifactType });
  const evidence = Array.isArray(input.evidence) ? input.evidence : [];
  const assumptions = Array.isArray(input.assumptions) ? input.assumptions : [];
  const decisions = Array.isArray(input.decisions) ? input.decisions : [];
  const risks = Array.isArray(input.risks) ? input.risks : [];

  const anticipatedQuestions = Array.isArray(input.anticipatedQuestions) && input.anticipatedQuestions.length
    ? input.anticipatedQuestions
    : anticipateQuestions({ artifactType, audience, purpose, keyClaims, risks });

  const preparedAnswers = buildPreparedAnswers({ keyClaims, evidence, assumptions, anticipatedQuestions });

  const conversationContext = {
    artifactId,
    canPresent: true,
    canExplain: true,
    canAnswerQuestions: true,
    nextPrompt: "That was GARUDA at a high level. But a presentation should start a conversation, not end one. Ask me anything about the technology, moat, revenue model, competition, risks or future.",
    anticipatedQuestions: anticipatedQuestions.map(q => q.question)
  };

  const continuityScopeId = input.continuityScopeId || input.sessionId || input.conversationId || input.projectId || input.briefId || null;
  const sessionId = input.sessionId || input.conversationId || input.continuityScopeId || null;
  const conversationId = input.conversationId || input.sessionId || null;
  const sourceArtifactId = input.sourceArtifactId || null;
  const rootArtifactId = input.rootArtifactId || sourceArtifactId || artifactId;
  const continuationInstruction = input.continuationInstruction || input.continuationOf || null;
  const status = input.status || "CREATED";

  const doc = {
    artifactId,
    artifactType,
    purpose,
    audience,
    sourceGoal,
    sourceBrief,
    narrative,
    keyClaims,
    evidence: evidence.map(e => ({ ...e, verified: Boolean(e.verified) })),
    assumptions,
    decisions,
    risks,
    anticipatedQuestions,
    preparedAnswers,
    conversationContext,
    projectId: input.projectId || null,
    briefId: input.briefId || null,
    goalId: input.goalId || null,
    sessionId: sessionId,
    conversationId: conversationId,
    continuityScopeId: continuityScopeId,
    sourceArtifactId: sourceArtifactId,
    rootArtifactId: rootArtifactId,
    continuationInstruction: continuationInstruction,
    status: status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: "1.0.0"
  };

  livingStore.set(artifactId, doc);
  appendDoc(doc);
  // Durable DB persistence (MongoDB) — file remains fallback for free/local
  if (isDbAvailable()) {
    try {
      LivingArtifactModel.create({ ...doc, createdAt: new Date(doc.createdAt), updatedAt: new Date(doc.updatedAt) }).catch(() => {});
    } catch {}
  }
  // Also persist to persistentMemory for continuity
  try {
    const memory = require("./persistentMemory/memoryService");
    memory.remember({
      type: "living_artifact",
      action: `LivingArtifact ${artifactType} for ${audience}: ${purpose}`.slice(0, 200),
      outcome: "created",
      tags: ["living_artifact", artifactType, audience],
      context: { artifactId, artifactType, purpose, audience, projectId: doc.projectId, briefId: doc.briefId, sessionId: doc.sessionId, continuityScopeId: doc.continuityScopeId, sourceArtifactId: doc.sourceArtifactId, rootArtifactId: doc.rootArtifactId }
    });
  } catch {}
  return doc;
}

function buildDefaultNarrative({ artifactType, purpose }) {
  if (String(artifactType).toLowerCase().includes("investor")) {
    return "Namaste. Before I show you what GARUDA can do, let me start with the problem we are trying to solve. Most businesses struggle with fragmented tools and generic AI. GARUDA was never intended to become another chatbot. It is a Sovereign AI Operating System that orchestrates understanding, planning, and governed execution to deliver complete outcomes, not just answers. Let me walk you through what that means, then we can discuss any part in detail.";
  }
  return `This artifact was created to achieve: ${purpose}. It is structured to be explainable and discussable.`;
}

function buildDefaultClaims({ artifactType }) {
  if (String(artifactType).toLowerCase().includes("investor")) {
    return [
      { claim: "GARUDA is a Sovereign AI Operating System, not a chatbot.", evidence: "Architecture: Mother Brain + EngineeringPipeline + Governance", confidence: "REASONED_FROM_CONTEXT" },
      { claim: "GARUDA orchestrates complete workflows, not single tool calls.", evidence: "CreativeStudioService orchestration, EngineeringPipeline lifecycle", confidence: "EVIDENCE_BACKED" },
      { claim: "Sovereign fallback ensures operation without external providers.", evidence: "garuda_sovereign_svg_renderer alwaysAvailable", confidence: "EVIDENCE_BACKED" },
    ];
  }
  return [{ claim: `Artifact of type ${artifactType} created for stated purpose.`, evidence: null, confidence: "ASSUMPTION" }];
}

function buildPreparedAnswers({ keyClaims, evidence, assumptions, anticipatedQuestions }) {
  return anticipatedQuestions.map(q => {
    const lower = q.question.toLowerCase();
    let answer = "I don't have enough verified information to answer that confidently.";
    let confidence = "UNKNOWN";
    if (lower.includes("different from chatgpt")) {
      answer = "ChatGPT is a conversational model. GARUDA is an OS that understands intent, plans multi-step work, executes via governed worktree-isolated engineering, validates quality, and persists living artifact context for continuity. ChatGPT answers; GARUDA delivers complete outcomes.";
      confidence = "REASONED_FROM_CONTEXT";
    } else if (lower.includes("moat")) {
      answer = "Moat is not a single feature. It is sovereign execution + governance + brand consistency + provider-agnostic adapters + living artifact continuity. Copying one feature does not copy the OS.";
      confidence = "REASONED_FROM_CONTEXT";
    } else if (lower.includes("make money") || lower.includes("revenue")) {
      answer = "Revenue via project-based client delivery, retainers, and future managed instances — but specific figures require verified business records, not invention.";
      confidence = "ASSUMPTION";
    } else if (lower.includes("competitors")) {
      answer = "General AI assistants and creative tools are competitors for parts, but GARUDA's differentiation is governed end-to-end orchestration with truth laws.";
      confidence = "REASONED_FROM_CONTEXT";
    } else if (lower.includes("providers disappear") || lower.includes("sovereignty")) {
      answer = "External providers are adapters, not dependencies. Sovereign SVG/storyboard renderers and local models ensure GARUDA remains operational; provider can be replaced behind same capability interface.";
      confidence = "EVIDENCE_BACKED";
    } else if (lower.includes("what is garuda")) {
      answer = "GARUDA is a Sovereign AI Operating System that makes complexity simple — it understands natural language, orchestrates specialist engines, validates quality and brand consistency, and stands behind what it creates via living artifact context.";
      confidence = "EVIDENCE_BACKED";
    }
    return { question: q.question, category: q.category, answer, confidence, evidenceAvailable: confidence !== "UNKNOWN" };
  });
}

function getLivingArtifactContext(artifactId) {
  if (!artifactId) return null;
  const doc = livingStore.get(String(artifactId));
  if (doc) return doc;
  // Try load from memory search as fallback
  try {
    const memory = require("./persistentMemory/memoryService");
    const rec = memory.recall({ query: String(artifactId), limit: 5 }) || [];
    const found = rec.find(r => r.context && r.context.artifactId === String(artifactId));
    if (found) return found.context;
  } catch {}
  return null;
}

function getMostRecentCreativeArtifact() {
  let mostRecent = null;
  for (const doc of livingStore.values()) {
    if (String(doc.artifactType || "").toLowerCase().includes("creative") || String(doc.artifactType || "") === "creative_asset") {
      if (!mostRecent || new Date(doc.createdAt) > new Date(mostRecent.createdAt)) {
        mostRecent = doc;
      }
    }
  }
  // Fallback: also consider any artifact with creative in purpose if no type match
  if (!mostRecent) {
    for (const doc of livingStore.values()) {
      if (String(doc.purpose || "").toLowerCase().includes("premium") || String(doc.purpose || "").toLowerCase().includes("poster") || String(doc.purpose || "").toLowerCase().includes("image")) {
        if (!mostRecent || new Date(doc.createdAt) > new Date(mostRecent.createdAt)) {
          mostRecent = doc;
        }
      }
    }
  }
  return mostRecent;
}

function getMostRecentCreativeArtifactScoped(filter = {}) {
  const { projectId, sessionId, continuityScopeId, briefId, conversationId } = filter || {};
  const effectiveSessionId = sessionId || conversationId || null;
  if (!projectId && !effectiveSessionId && !continuityScopeId && !briefId) return null;
  let mostRecent = null;
  // Check in-memory first
  for (const doc of livingStore.values()) {
    const isCreative = String(doc.artifactType || "").toLowerCase().includes("creative") || String(doc.artifactType || "") === "creative_asset";
    if (!isCreative) continue;
    let matches = false;
    if (continuityScopeId && doc.continuityScopeId && doc.continuityScopeId === continuityScopeId) matches = true;
    else if (projectId && doc.projectId && doc.projectId === projectId) matches = true;
    else if (effectiveSessionId && doc.sessionId && doc.sessionId === effectiveSessionId) matches = true;
    else if (effectiveSessionId && doc.conversationId && doc.conversationId === effectiveSessionId) matches = true;
    else if (briefId && doc.briefId && doc.briefId === briefId) matches = true;
    if (!matches) continue;
    if (!mostRecent || new Date(doc.createdAt) > new Date(mostRecent.createdAt)) {
      mostRecent = doc;
    }
  }
  if (mostRecent) return mostRecent;
  // Fallback to file (durable across restart, sync)
  try {
    if (fs.existsSync(LIVING_ARTIFACTS_FILE)) {
      const lines = fs.readFileSync(LIVING_ARTIFACTS_FILE, "utf8").split("\n").filter(Boolean);
      let fileMostRecent = null;
      for (const line of lines) {
        try {
          const doc = JSON.parse(line);
          const isCreative = String(doc.artifactType || "").toLowerCase().includes("creative") || String(doc.artifactType || "") === "creative_asset";
          if (!isCreative) continue;
          let matches = false;
          if (continuityScopeId && doc.continuityScopeId && doc.continuityScopeId === continuityScopeId) matches = true;
          else if (projectId && doc.projectId && doc.projectId === projectId) matches = true;
          else if (effectiveSessionId && doc.sessionId && doc.sessionId === effectiveSessionId) matches = true;
          else if (effectiveSessionId && doc.conversationId && doc.conversationId === effectiveSessionId) matches = true;
          else if (briefId && doc.briefId && doc.briefId === briefId) matches = true;
          if (!matches) continue;
          if (!fileMostRecent || new Date(doc.createdAt) > new Date(fileMostRecent.createdAt)) {
            fileMostRecent = doc;
          }
        } catch {}
      }
      if (fileMostRecent) {
        // Hydrate into memory for future calls
        livingStore.set(fileMostRecent.artifactId, fileMostRecent);
        return fileMostRecent;
      }
    }
  } catch {}
  // DB fallback is async — for sync path, return null if not found in memory/file
  // Async DB check is available via getMostRecentCreativeArtifactScopedAsync
  return null;
}

async function getMostRecentCreativeArtifactScopedAsync(filter = {}) {
  const syncResult = getMostRecentCreativeArtifactScoped(filter);
  if (syncResult) return syncResult;
  if (!isDbAvailable()) return null;
  const { projectId, sessionId, continuityScopeId, briefId, conversationId } = filter || {};
  const effectiveSessionId = sessionId || conversationId || null;
  if (!projectId && !effectiveSessionId && !continuityScopeId && !briefId) return null;
  const query = { artifactType: /creative/i };
  // Build strict scope filter — never global
  const orConditions = [];
  if (continuityScopeId) orConditions.push({ continuityScopeId });
  if (projectId) orConditions.push({ projectId });
  if (effectiveSessionId) orConditions.push({ sessionId: effectiveSessionId }, { conversationId: effectiveSessionId });
  if (briefId) orConditions.push({ briefId });
  if (!orConditions.length) return null;
  query.$or = orConditions;
  try {
    const doc = await LivingArtifactModel.findOne(query).sort({ createdAt: -1 }).lean();
    if (doc) {
      livingStore.set(doc.artifactId, doc);
      return doc;
    }
  } catch {}
  return null;
}

function getArtifactLineage(artifactId) {
  const lineage = [];
  let current = getLivingArtifactContext(artifactId);
  // Also try file if not in memory
  if (!current) {
    try {
      if (fs.existsSync(LIVING_ARTIFACTS_FILE)) {
        const lines = fs.readFileSync(LIVING_ARTIFACTS_FILE, "utf8").split("\n").filter(Boolean);
        for (const line of lines) {
          try {
            const doc = JSON.parse(line);
            if (doc.artifactId === artifactId) { current = doc; break; }
          } catch {}
        }
      }
    } catch {}
  }
  const visited = new Set();
  while (current && !visited.has(current.artifactId)) {
    visited.add(current.artifactId);
    lineage.unshift(current);
    if (!current.sourceArtifactId || visited.has(current.sourceArtifactId)) break;
    const parentId = current.sourceArtifactId;
    let parent = getLivingArtifactContext(parentId);
    if (!parent) {
      try {
        if (fs.existsSync(LIVING_ARTIFACTS_FILE)) {
          const lines = fs.readFileSync(LIVING_ARTIFACTS_FILE, "utf8").split("\n").filter(Boolean);
          for (const line of lines) {
            try {
              const doc = JSON.parse(line);
              if (doc.artifactId === parentId) { parent = doc; break; }
            } catch {}
          }
        }
      } catch {}
    }
    current = parent;
  }
  return lineage;
}

function getContinuationContext(filter = {}) {
  // Safe retrieval for continuation: uses scoped lookup, never global fallback
  const artifact = getMostRecentCreativeArtifactScoped(filter);
  if (!artifact) return null;
  return {
    sourceArtifactId: artifact.artifactId,
    rootArtifactId: artifact.rootArtifactId || artifact.artifactId,
    continuityScopeId: artifact.continuityScopeId,
    projectId: artifact.projectId,
    sessionId: artifact.sessionId,
    conversationId: artifact.conversationId,
    purpose: artifact.purpose,
    briefId: artifact.briefId
  };
}

function prepareArtifactPresentation(artifactId) {
  const ctx = getLivingArtifactContext(artifactId);
  if (!ctx) throw new Error(`Living artifact not found: ${artifactId}`);
  // Conversational presentation, not slide-reading
  const narrative = ctx.narrative;
  const closing = ctx.conversationContext?.nextPrompt || "That was the artifact. Ask me anything.";
  return {
    artifactId: ctx.artifactId,
    artifactType: ctx.artifactType,
    presentation: `${narrative}\n\n${closing}`,
    narrative: ctx.narrative,
    keyClaims: ctx.keyClaims,
    nextPrompt: closing,
    truthful: true
  };
}

function answerArtifactQuestion(artifactId, question) {
  const ctx = getLivingArtifactContext(artifactId);
  if (!ctx) return { answer: "I don't have enough verified information to answer that confidently.", confidence: "UNKNOWN", evidence: null };
  const q = String(question || "").trim();
  if (!q) return { answer: "Please ask a specific question about the artifact.", confidence: "UNKNOWN" };
  // Find prepared answer
  const prepared = (ctx.preparedAnswers || []).find(a => q.toLowerCase().includes(a.category.toLowerCase()) || a.question.toLowerCase().includes(q.toLowerCase().slice(0, 15)));
  if (prepared) {
    return { question: q, answer: prepared.answer, confidence: prepared.confidence, evidence: ctx.evidence, artifactId };
  }
  // Fallback: try to match key claim
  const claimMatch = (ctx.keyClaims || []).find(c => q.toLowerCase().includes(String(c.claim).toLowerCase().slice(0, 20)));
  if (claimMatch) {
    return { question: q, answer: `Based on artifact context: ${claimMatch.claim} — ${claimMatch.evidence || "reasoned from context."}`, confidence: claimMatch.confidence || "REASONED_FROM_CONTEXT", evidence: ctx.evidence };
  }
  return { question: q, answer: "I don't have enough verified information to answer that confidently.", confidence: "UNKNOWN", evidence: null, artifactId };
}

function listLivingArtifacts(filter = {}) {
  const { projectId, sessionId, continuityScopeId, briefId, artifactType, limit = 20 } = filter || {};
  // Strict scope isolation: require at least one scope filter, never global fallback
  if (!projectId && !sessionId && !continuityScopeId && !briefId) return [];
  const effectiveSessionId = sessionId || filter.conversationId || null;
  let results = [];
  // Check in-memory first
  for (const doc of livingStore.values()) {
    if (artifactType && !String(doc.artifactType || "").toLowerCase().includes(String(artifactType).toLowerCase())) continue;
    let matches = false;
    if (continuityScopeId && doc.continuityScopeId && doc.continuityScopeId === continuityScopeId) matches = true;
    else if (projectId && doc.projectId && doc.projectId === projectId) matches = true;
    else if (effectiveSessionId && doc.sessionId && doc.sessionId === effectiveSessionId) matches = true;
    else if (effectiveSessionId && doc.conversationId && doc.conversationId === effectiveSessionId) matches = true;
    else if (briefId && doc.briefId && doc.briefId === briefId) matches = true;
    if (!matches) continue;
    results.push(doc);
  }
  // File fallback for durability (sync)
  try {
    if (fs.existsSync(LIVING_ARTIFACTS_FILE)) {
      const lines = fs.readFileSync(LIVING_ARTIFACTS_FILE, "utf8").split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          const doc = JSON.parse(line);
          if (results.some(r => r.artifactId === doc.artifactId)) continue; // already in memory
          if (artifactType && !String(doc.artifactType || "").toLowerCase().includes(String(artifactType).toLowerCase())) continue;
          let matches = false;
          if (continuityScopeId && doc.continuityScopeId && doc.continuityScopeId === continuityScopeId) matches = true;
          else if (projectId && doc.projectId && doc.projectId === projectId) matches = true;
          else if (effectiveSessionId && doc.sessionId && doc.sessionId === effectiveSessionId) matches = true;
          else if (effectiveSessionId && doc.conversationId && doc.conversationId === effectiveSessionId) matches = true;
          else if (briefId && doc.briefId && doc.briefId === briefId) matches = true;
          if (!matches) continue;
          results.push(doc);
        } catch {}
      }
    }
  } catch {}
  results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const lim = Math.max(1, Math.min(Number(limit) || 20, 100));
  return results.slice(0, lim);
}

function clearForTesting() {
  livingStore.clear();
  try { if (fs.existsSync(LIVING_ARTIFACTS_FILE)) fs.writeFileSync(LIVING_ARTIFACTS_FILE, "", "utf8"); } catch {}
  // Also clear DB if available
  if (isDbAvailable()) {
    try { LivingArtifactModel.deleteMany({}).then(() => {}).catch(() => {}); } catch {}
  }
}

module.exports = {
  createLivingArtifactContext,
  getLivingArtifactContext,
  getMostRecentCreativeArtifact,
  getMostRecentCreativeArtifactScoped,
  listLivingArtifacts,
  getArtifactLineage,
  getContinuationContext,
  prepareArtifactPresentation,
  answerArtifactQuestion,
  anticipateQuestions,
  clearForTesting,
  _store: livingStore
};
