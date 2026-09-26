/**
 * GARUDA FOUNDER INTELLIGENCE — Client Memory Service (Phase 5)
 *
 * Business logic over the persistence ADAPTER (never over JSONL directly).
 * All founder-private fields are explicitly classified; customer-safe views
 * are produced by allowlist serialization (additive safety).
 */

const { createAdapter } = require("./clientMemoryAdapter");
const { LABELS, makeEvidence, unknownEvidence } = require("./evidenceLabels");

const CUSTOMER_SAFE_FIELDS = Object.freeze([
  "id",
  "clientId",
  "displayName",
  "companyName",
  "industry",
  "goals",
  "updatedAt",
]);

const PRIVATE_STATEMENT_TYPES = Object.freeze([
  "founder_assumption",
  "negotiation_note",
  "private_note",
  "floor_price_note",
]);

/**
 * §8 logical chain record types — adapter-agnostic persistence.
 * mode "push" appends to an array field; mode "replace" upserts a single object.
 * Only listed types are writable (whitelist — no arbitrary field injection).
 */
const CHAIN_RECORD_TYPES = Object.freeze({
  contact: { field: "contact", mode: "replace", required: [] },
  requirement: { field: "requirements", mode: "push", required: ["text"] },
  question: { field: "questions", mode: "push", required: ["text"] },
  proposal: { field: "proposalLinks", mode: "push", required: ["proposalId"] },
  quote: { field: "quotes", mode: "push", required: ["label"] },
  negotiation: { field: "negotiations", mode: "push", required: ["summary"] },
  agreement: { field: "agreements", mode: "push", required: ["terms"] },
  project: { field: "project", mode: "replace", required: [] },
  payment: { field: "payments", mode: "push", required: ["amountINR"] },
});

const CHAIN_DEFAULTS = Object.freeze({
  contact: null,
  requirements: [],
  questions: [],
  proposalLinks: [],
  quotes: [],
  negotiations: [],
  agreements: [],
  project: null,
  payments: [],
});

let defaultAdapter = null;

function getAdapter() {
  if (!defaultAdapter) defaultAdapter = createAdapter();
  return defaultAdapter;
}

/** Test/DI hook — inject mongo/postgres adapter without touching logic. */
function setAdapter(adapter) {
  defaultAdapter = adapter;
}

function normalizeClientId(input) {
  const name = String(input.clientId || input.name || "").trim();
  if (!name) return null;
  return "cli_" + name.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 48);
}

async function createClientProfile(input = {}) {
  const clientId = normalizeClientId(input);
  if (!clientId) {
    return { success: false, reason: "CLIENT_ID_REQUIRED", label: LABELS.UNKNOWN };
  }
  const record = {
    clientId,
    displayName: String(input.displayName || input.name || "").trim(),
    companyName: String(input.companyName || input.company || "").trim(),
    industry: String(input.industry || "").trim(),
    goals: Array.isArray(input.goals) ? input.goals.map(String) : [],
    statements: [],
    founderAssumptions: [],
    privateNotes: [],
    interactions: [],
    // §8 chain defaults (old records lacking these get them on next update via defaults merge)
    ...CHAIN_DEFAULTS,
    ...(input.contact !== undefined ? { contact: input.contact } : {}),
  };
  const { record: saved } = await getAdapter().append(record);
  return { success: true, client: saved, label: LABELS.PLANNED };
}

async function recordClientStatement({ clientId, text, source = "transcript", at = null, type = "customer_statement" }) {
  if (!clientId || !text) {
    return { success: false, reason: "CLIENT_ID_AND_TEXT_REQUIRED", label: LABELS.UNKNOWN };
  }
  const adapter = getAdapter();
  const existing = (await adapter.search((r) => r.clientId === clientId))[0];
  if (!existing) return { success: false, reason: "CLIENT_NOT_FOUND", label: LABELS.UNKNOWN };

  const entry = { text: String(text), source, at, recordedAt: new Date().toISOString() };
  let patch;
  if (PRIVATE_STATEMENT_TYPES.includes(type)) {
    patch = { privateNotes: [...(existing.privateNotes || []), { type, ...entry }] };
  } else if (type === "founder_assumption") {
    patch = { founderAssumptions: [...(existing.founderAssumptions || []), entry] };
  } else {
    patch = { statements: [...(existing.statements || []), entry] };
  }
  const { record } = await adapter.update(existing.id, patch);
  return { success: true, client: record, label: LABELS.VERIFIED };
}

async function recordInteraction({ clientId, summary, outcome = null }) {
  if (!clientId || !summary) {
    return { success: false, reason: "CLIENT_ID_AND_SUMMARY_REQUIRED", label: LABELS.UNKNOWN };
  }
  const adapter = getAdapter();
  const existing = (await adapter.search((r) => r.clientId === clientId))[0];
  if (!existing) return { success: false, reason: "CLIENT_NOT_FOUND", label: LABELS.UNKNOWN };
  const interaction = {
    summary: String(summary),
    outcome: outcome ? String(outcome) : null,
    at: new Date().toISOString(),
  };
  const { record } = await adapter.update(existing.id, {
    interactions: [...(existing.interactions || []), interaction],
  });
  return { success: true, client: record, label: LABELS.VERIFIED };
}

/**
 * §8 generic chain recorder — one adapter-backed write for every logical
 * chain link (contact/requirement/question/proposal/quote/negotiation/
 * agreement/project/payment). Old records without chain fields get defaults
 * merged in before the write (schema evolution without migration).
 */
async function recordChain(clientId, type, data = {}) {
  const spec = CHAIN_RECORD_TYPES[type];
  if (!spec) {
    return { success: false, reason: "UNSUPPORTED_RECORD_TYPE", allowed: Object.keys(CHAIN_RECORD_TYPES), label: LABELS.UNKNOWN };
  }
  if (!clientId) {
    return { success: false, reason: "CLIENT_ID_REQUIRED", label: LABELS.UNKNOWN };
  }
  for (const key of spec.required) {
    if (data[key] === undefined || data[key] === null || data[key] === "") {
      return { success: false, reason: "REQUIRED_FIELD_MISSING", missing: [key], label: LABELS.UNKNOWN };
    }
  }
  const adapter = getAdapter();
  const existing = (await adapter.search((r) => r.clientId === clientId))[0];
  if (!existing) return { success: false, reason: "CLIENT_NOT_FOUND", label: LABELS.UNKNOWN };

  const entry = { ...data, recordedAt: new Date().toISOString() };
  let nextValue;
  if (spec.mode === "push") {
    const current = existing[spec.field];
    const base = Array.isArray(current) ? current : Array.isArray(CHAIN_DEFAULTS[spec.field]) ? CHAIN_DEFAULTS[spec.field] : [];
    nextValue = [...base, entry];
  } else {
    nextValue = entry;
  }
  const { record } = await adapter.update(existing.id, {
    [spec.field]: nextValue,
    ...chainCounts(existing, spec.field, nextValue),
  });
  return { success: true, type, field: spec.field, client: record, label: LABELS.VERIFIED };
}

/** Derive HISTORY counts so recall views expose chain depth without loading payloads. */
function chainCounts(source, field, nextValue) {
  const counts = { chainCounts: { ...(source.chainCounts || {}) } };
  counts.chainCounts[field] = Array.isArray(nextValue) ? nextValue.length : nextValue ? 1 : 0;
  return counts;
}

/**
 * Founder-only full view (contains privateNotes + founderAssumptions).
 */
async function getClientFounderView(clientId) {
  const records = await getAdapter().search((r) => r.clientId === clientId);
  if (records.length === 0) {
    return { success: false, reason: "CLIENT_NOT_FOUND", label: LABELS.UNKNOWN };
  }
  const c = records[0];
  return {
    success: true,
    label: records.length > 1 ? LABELS.CONTRADICTED : LABELS.VERIFIED,
    client: c,
    privateFieldsPresent: ["privateNotes", "founderAssumptions"],
  };
}

/**
 * Customer-safe view — ALLOWLIST serialization.
 * Private notes / assumptions / negotiation intelligence can NEVER appear
 * because only whitelisted keys are copied.
 */
async function getClientCustomerView(clientId) {
  const founderView = await getClientFounderView(clientId);
  if (!founderView.success) return founderView;
  const safe = {};
  for (const field of CUSTOMER_SAFE_FIELDS) {
    if (field in founderView.client) safe[field] = founderView.client[field];
  }
  safe.statements = (founderView.client.statements || []).map((s) => ({
    text: s.text,
    source: s.source,
    at: s.at,
  }));
  return { success: true, label: LABELS.VERIFIED, client: safe };
}

/**
 * Memory retrieval for orchestration: returns context + evidence labels.
 */
async function recallForContext(query, { limit = 5 } = {}) {
  const q = String(query || "").toLowerCase();
  const all = await getAdapter().listAll();
  const matched = all.filter((c) => {
    const haystack = JSON.stringify(c).toLowerCase();
    return q.split(/\s+/).some((tok) => tok.length > 2 && haystack.includes(tok));
  });
  if (matched.length === 0) {
    return {
      found: false,
      label: LABELS.UNKNOWN,
      evidence: [unknownEvidence("client_memory", "No matching client record")],
      clients: [],
    };
  }
  return {
    found: true,
    label: LABELS.VERIFIED,
    clients: matched.slice(0, limit).map((c) => ({
      clientId: c.clientId,
      displayName: c.displayName,
      companyName: c.companyName,
      industry: c.industry,
      goals: c.goals,
      lastInteraction: (c.interactions || []).slice(-1)[0] || null,
      statementCount: (c.statements || []).length,
      chainCounts: c.chainCounts || deriveChainCounts(c),
      updatedAt: c.updatedAt,
    })),
    evidence: [
      makeEvidence({
        field: "client_memory",
        label: LABELS.VERIFIED,
        value: { matches: matched.length },
        source: { type: "file", ref: "founderIntelligence.clientMemory", retrievedAt: null },
      }),
    ],
  };
}

function deriveChainCounts(c) {
  const counts = {};
  for (const [type, spec] of Object.entries(CHAIN_RECORD_TYPES)) {
    const v = c[spec.field];
    counts[spec.field] = Array.isArray(v) ? v.length : v ? 1 : 0;
    void type;
  }
  return counts;
}

async function listClients() {
  const all = await getAdapter().listAll();
  return all.map((c) => ({
    clientId: c.clientId,
    displayName: c.displayName,
    companyName: c.companyName,
    industry: c.industry,
    chainCounts: c.chainCounts || deriveChainCounts(c),
    updatedAt: c.updatedAt,
  }));
}

module.exports = {
  setAdapter,
  getAdapter,
  createClientProfile,
  recordClientStatement,
  recordInteraction,
  recordChain,
  getClientFounderView,
  getClientCustomerView,
  recallForContext,
  listClients,
  CUSTOMER_SAFE_FIELDS,
  PRIVATE_STATEMENT_TYPES,
  CHAIN_RECORD_TYPES,
};
