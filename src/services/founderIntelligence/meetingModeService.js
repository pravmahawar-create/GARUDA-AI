/**
 * GARUDA FOUNDER INTELLIGENCE — Meeting Mode (Phase 6)
 *
 * Founder correction #4 — SECURITY BOUNDARY:
 *  customerView and founderPrivate are SEPARATE SERVER-SIDE structures.
 *  customerView is built by ADDITIVE allowlist construction — private data
 *  is never copied in and then "filtered out".
 *  A hard assertion scans the serialized customerView for private-key
 *  leakage patterns and THROWS if anything slips (defense in depth).
 *  Frontend filtering is explicitly NOT the security mechanism.
 */

const crypto = require("crypto");
const { LABELS } = require("./evidenceLabels");

const PRIVATE_KEY_PATTERNS = Object.freeze([
  /floor/i,
  /margin/i,
  /private/i,
  /negotiat/i,
  /walkaway/i,
  /walk_away/i,
  /assumption/i,
  /costbasis/i,
  /cost_basis/i,
  /internal/i,
  /probability/i,
  /discount/i,
  /founderOnly/i,
  /founder_only/i,
]);

const CUSTOMER_VIEW_ALLOWLIST = Object.freeze([
  "sessionId",
  "mode",
  "customerGreeting",
  "publicAnswer",
  "publicQuote",
  "publicEvidence",
  "publicSources",
  "questionsForCustomer",
  "nextSteps",
  "understanding",
  "nextQuestion",
  "updatedAt",
]);

const PRIVATE_ALLOWLIST = Object.freeze([
  "sessionId",
  "internalFloor",
  "marginGuidance",
  "privateGuidance",
  "founderAssumptions",
  "privateNotes",
  "modelInference",
  "closeProbability",
  "negotiationIntelligence",
  "internalAssumptions",
  "clientMemoryPrivate",
  "costBasis",
  "analysis",
  "riskAlerts",
  "pricingGuidance",
  "proposalAction",
  "nextQuestionSuggestion",
]);

/**
 * §22 PERSISTENCE ABSTRACTION for meeting sessions.
 * Business logic talks ONLY to this store interface — swapping the backend
 * (memory → JSONL file → Mongo/Postgres) requires zero logic rewrites.
 * maturity is reported honestly in every startSession response.
 */
const fsMeeting = require("fs");
const pathMeeting = require("path");

function createMemoryStore() {
  const map = new Map();
  return {
    backend: "in_memory",
    maturity: "IN_MEMORY — process-local only; adapter-ready for Mongo/Postgres",
    get: (id) => map.get(id) || null,
    set: (id, session) => map.set(id, session),
    clear: () => map.clear(),
  };
}

function createJsonlStore() {
  const file = process.env.GARUDA_FI_MEETING_FILE ||
    pathMeeting.join(process.cwd(), "data", "founder-intelligence-meetings.jsonl");
  const map = new Map();
  try {
    if (fsMeeting.existsSync(file)) {
      const lines = fsMeeting.readFileSync(file, "utf8").split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          const rec = JSON.parse(line);
          if (rec && rec.sessionId && rec.session) map.set(rec.sessionId, rec.session);
        } catch { /* skip corrupt line — never crash the session */ }
      }
    }
  } catch { /* unreadable store → start empty, never fabricate */ }
  return {
    backend: "jsonl_file",
    maturity: "JSONL_FILE — local durable file (data/ is git-ignored); adapter-ready for Mongo/Postgres",
    get: (id) => map.get(id) || null,
    set: (id, session) => {
      map.set(id, session);
      try {
        const dir = pathMeeting.dirname(file);
        if (!fsMeeting.existsSync(dir)) fsMeeting.mkdirSync(dir, { recursive: true });
        fsMeeting.appendFileSync(file, JSON.stringify({ sessionId: id, savedAt: new Date().toISOString(), session }) + "\n", "utf8");
      } catch { /* persistence failure must not break the meeting */ }
    },
    clear: () => map.clear(),
  };
}

let meetingStore = null;
function getStore() {
  if (!meetingStore) {
    meetingStore = process.env.GARUDA_FI_MEETING_STORE === "file"
      ? createJsonlStore()
      : createMemoryStore();
  }
  return meetingStore;
}

/** Test hook — swap/clear store without touching business logic. */
function _resetSessions() {
  meetingStore = null;
}

function newSessionId() {
  return "mts_" + crypto.randomBytes(8).toString("hex");
}

function startSession({ topic = "", clientName = "" } = {}) {
  const sessionId = newSessionId();
  const now = new Date().toISOString();
  const session = {
    sessionId,
    topic: String(topic),
    clientName: String(clientName),
    startedAt: now,
    utterances: [],
    lastCustomerView: null,
    lastFounderPrivate: null,
  };
  getStore().set(sessionId, session);
  return {
    success: true,
    sessionId,
    startedAt: now,
    label: LABELS.PLANNED,
    persistence: { backend: getStore().backend, maturity: getStore().maturity },
  };
}

function getSession(sessionId) {
  return getStore().get(sessionId) || null;
}

function recordUtterance(sessionId, { speaker, text }) {
  const session = getStore().get(sessionId);
  if (!session) return { success: false, reason: "SESSION_NOT_FOUND" };
  const entry = {
    speaker: speaker === "customer" ? "customer" : "founder",
    text: String(text || ""),
    at: new Date().toISOString(),
  };
  session.utterances.push(entry);
  return { success: true, utterance: entry };
}

/**
 * Allowlist pick — copies ONLY listed keys that exist and are non-undefined.
 */
function pick(obj, allowlist) {
  const out = {};
  for (const key of allowlist) {
    if (obj && obj[key] !== undefined) out[key] = obj[key];
  }
  return out;
}

/**
 * Hard security assertion: serialized customerView must NOT match any
 * private-key pattern. Throws MEETING_PRIVATE_LEAK on violation.
 */
function assertNoPrivateLeak(customerView) {
  const serialized = JSON.stringify(customerView);
  for (const pattern of PRIVATE_KEY_PATTERNS) {
    if (pattern.test(serialized)) {
      throw new Error(`MEETING_PRIVATE_LEAK: pattern ${String(pattern)} matched in customerView`);
    }
  }
  return true;
}

/**
 * Split an intelligence result into two SEPARATE server-side structures.
 *
 * @param {string} sessionId
 * @param {object} payload
 *   payload.public   -> fields safe for the customer-facing surface
 *   payload.private  -> internalFloor/margin/guidance/assumptions/memory
 */
function buildSplitResponse(sessionId, payload = {}) {
  const session = getStore().get(sessionId);
  if (!session) {
    return { success: false, reason: "SESSION_NOT_FOUND", label: LABELS.UNKNOWN };
  }

  const publicSrc = payload.public || {};
  const privateSrc = payload.private || {};

  // ---- CUSTOMER VIEW: additive allowlist construction ----
  const customerView = {
    sessionId,
    mode: "customer",
    customerGreeting: publicSrc.customerGreeting || "Namaste! Aap GARUDA ke saath live hain.",
    publicAnswer: publicSrc.publicAnswer || null,
    publicQuote: publicSrc.publicQuote || null,
    publicEvidence: Array.isArray(publicSrc.publicEvidence) ? publicSrc.publicEvidence : [],
    publicSources: Array.isArray(publicSrc.publicSources) ? publicSrc.publicSources : [],
    questionsForCustomer: Array.isArray(publicSrc.questionsForCustomer)
      ? publicSrc.questionsForCustomer
      : [],
    nextSteps: Array.isArray(publicSrc.nextSteps) ? publicSrc.nextSteps : [],
    // Customer-safe understanding (rebuilt additively from PUBLIC fields only)
    understanding: publicSrc.understanding ?? null,
    nextQuestion: publicSrc.nextQuestion ?? null,
    updatedAt: new Date().toISOString(),
  };

  // ---- FOUNDER PRIVATE: separate structure, own allowlist ----
  const founderPrivate = {
    sessionId,
    internalFloor: privateSrc.internalFloor ?? null,
    marginGuidance: privateSrc.marginGuidance ?? null,
    privateGuidance: Array.isArray(privateSrc.privateGuidance) ? privateSrc.privateGuidance : [],
    founderAssumptions: Array.isArray(privateSrc.founderAssumptions) ? privateSrc.founderAssumptions : [],
    privateNotes: Array.isArray(privateSrc.privateNotes) ? privateSrc.privateNotes : [],
    modelInference: Array.isArray(privateSrc.modelInference) ? privateSrc.modelInference : [],
    closeProbability: privateSrc.closeProbability ?? null,
    negotiationIntelligence: privateSrc.negotiationIntelligence ?? null,
    internalAssumptions: privateSrc.internalAssumptions ?? null,
    clientMemoryPrivate: privateSrc.clientMemoryPrivate ?? null,
    costBasis: privateSrc.costBasis ?? null,
    // §12 meeting capabilities — founder-facing only
    analysis: privateSrc.analysis ?? null,
    riskAlerts: Array.isArray(privateSrc.riskAlerts) ? privateSrc.riskAlerts : [],
    pricingGuidance: privateSrc.pricingGuidance ?? null,
    proposalAction: privateSrc.proposalAction ?? null,
    nextQuestionSuggestion: privateSrc.nextQuestionSuggestion ?? null,
    updatedAt: new Date().toISOString(),
  };

  // Defense in depth — throw before ever returning a leaking payload
  assertNoPrivateLeak(customerView);

  session.lastCustomerView = customerView;
  session.lastFounderPrivate = founderPrivate;

  return {
    success: true,
    label: LABELS.VERIFIED,
    customerView,
    founderPrivate,
  };
}

/**
 * Customer-facing accessor — returns ONLY the customerView structure.
 * (Used by the shareable meeting surface.)
 */
function getCustomerView(sessionId) {
  const session = getStore().get(sessionId);
  if (!session) return { success: false, reason: "SESSION_NOT_FOUND" };
  const view = session.lastCustomerView;
  if (!view) return { success: false, reason: "NO_CUSTOMER_VIEW_YET" };
  assertNoPrivateLeak(view);
  return { success: true, customerView: view };
}

/**
 * Founder-only accessor.
 */
function getFounderPrivate(sessionId) {
  const session = getStore().get(sessionId);
  if (!session) return { success: false, reason: "SESSION_NOT_FOUND" };
  if (!session.lastFounderPrivate) return { success: false, reason: "NO_PRIVATE_VIEW_YET" };
  return { success: true, founderPrivate: session.lastFounderPrivate };
}

module.exports = {
  startSession,
  getSession,
  recordUtterance,
  buildSplitResponse,
  getCustomerView,
  getFounderPrivate,
  assertNoPrivateLeak,
  pick,
  CUSTOMER_VIEW_ALLOWLIST,
  PRIVATE_ALLOWLIST,
  PRIVATE_KEY_PATTERNS,
  _resetSessions,
};
