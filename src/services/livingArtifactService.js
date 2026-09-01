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
const LIVING_ARTIFACTS_FILE = path.join(DATA_DIR, "living-artifacts.jsonl");

function ensureDir() {
  try { if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true }); } catch {}
}

const livingStore = new Map();

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
    createdAt: new Date().toISOString(),
    version: "1.0.0"
  };

  livingStore.set(artifactId, doc);
  appendDoc(doc);
  // Also persist to persistentMemory for continuity
  try {
    const memory = require("./persistentMemory/memoryService");
    memory.remember({
      type: "living_artifact",
      action: `LivingArtifact ${artifactType} for ${audience}: ${purpose}`.slice(0, 200),
      outcome: "created",
      tags: ["living_artifact", artifactType, audience],
      context: { artifactId, artifactType, purpose, audience, projectId: doc.projectId, briefId: doc.briefId }
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

function clearForTesting() { livingStore.clear(); try { if (fs.existsSync(LIVING_ARTIFACTS_FILE)) fs.writeFileSync(LIVING_ARTIFACTS_FILE, "", "utf8"); } catch {} }

module.exports = {
  createLivingArtifactContext,
  getLivingArtifactContext,
  prepareArtifactPresentation,
  answerArtifactQuestion,
  anticipateQuestions,
  clearForTesting,
  _store: livingStore
};
