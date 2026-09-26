/**
 * GARUDA FOUNDER INTELLIGENCE — Learning Loop (Phase L / §16)
 *
 * Data model: FOUND → QUOTED → NEGOTIATED → WON/LOST → ACTUAL_PRICE
 *             → ACTUAL_EFFORT → ACTUAL_COST → OUTCOME → LEARNING
 *
 * GOVERNANCE (permanent):
 *  - This store is READ-ONLY EVIDENCE for future intelligence.
 *  - It NEVER silently modifies pricing rules or governance constants.
 *  - Core pricing/governance changes require explicit founder approval.
 *  - Only founder-recorded events are accepted (founder-gated at the route).
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const { LABELS, makeEvidence, unknownEvidence } = require("./evidenceLabels");

const STAGES = Object.freeze([
  "FOUND",
  "QUOTED",
  "NEGOTIATED",
  "WON",
  "LOST",
  "ACTUAL_PRICE",
  "ACTUAL_EFFORT",
  "ACTUAL_COST",
  "OUTCOME",
  "LEARNING",
]);

const STAGE_REQUIRED = Object.freeze({
  FOUND: [],
  QUOTED: ["proposalId", "quotedINR"],
  NEGOTIATED: ["proposalId"],
  WON: ["proposalId"],
  LOST: ["proposalId"],
  ACTUAL_PRICE: ["proposalId", "actualPriceINR"],
  ACTUAL_EFFORT: ["proposalId", "actualEffortHours"],
  ACTUAL_COST: ["proposalId", "actualCostINR"],
  OUTCOME: ["proposalId", "outcome"],
  LEARNING: ["learning"],
});

const POLICY = "READ_ONLY_EVIDENCE — pricing rules NEVER auto-modified; founder governance required for changes";

function storeFile() {
  return (
    process.env.GARUDA_FI_LEARNING_FILE ||
    path.join(process.cwd(), "data", "founder-intelligence-learnings.jsonl")
  );
}

function readAll() {
  try {
    const file = storeFile();
    if (!fs.existsSync(file)) return [];
    return fs
      .readFileSync(file, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Record one learning-loop event. Deterministic validation, no LLM.
 */
function recordEvent(input = {}) {
  const stage = String(input.stage || "").toUpperCase();
  if (!STAGES.includes(stage)) {
    return {
      success: false,
      reason: "UNSUPPORTED_STAGE",
      allowed: STAGES,
      label: LABELS.UNKNOWN,
      evidence: [unknownEvidence("stage")],
    };
  }
  const required = STAGE_REQUIRED[stage];
  const missing = required.filter(
    (k) => input[k] === undefined || input[k] === null || input[k] === ""
  );
  if (missing.length > 0) {
    return {
      success: false,
      reason: "REQUIRED_FIELD_MISSING",
      stage,
      missing,
      label: LABELS.UNKNOWN,
      evidence: missing.map((f) => unknownEvidence(f)),
    };
  }

  const event = {
    eventId: "lrn_" + crypto.randomBytes(6).toString("hex"),
    ts: new Date().toISOString(),
    stage,
    proposalId: input.proposalId ? String(input.proposalId) : null,
    clientId: input.clientId ? String(input.clientId) : null,
    quotedINR: Number.isFinite(input.quotedINR) ? Math.round(input.quotedINR) : null,
    actualPriceINR: Number.isFinite(input.actualPriceINR) ? Math.round(input.actualPriceINR) : null,
    actualEffortHours: Number.isFinite(input.actualEffortHours) ? input.actualEffortHours : null,
    actualCostINR: Number.isFinite(input.actualCostINR) ? Math.round(input.actualCostINR) : null,
    outcome: input.outcome ? String(input.outcome) : null,
    lossReason: input.lossReason ? String(input.lossReason) : null,
    learning: input.learning ? String(input.learning) : null,
    note: input.note ? String(input.note) : null,
    label: LABELS.FOUNDER_JUDGMENT,
    policy: POLICY,
  };

  try {
    const file = storeFile();
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(file, JSON.stringify(event) + "\n", "utf8");
  } catch (err) {
    return {
      success: false,
      reason: "STORE_WRITE_FAILED",
      errorMessage: String(err.message).slice(0, 200),
      label: LABELS.BLOCKED,
      event,
    };
  }

  return {
    success: true,
    stage,
    event,
    label: LABELS.FOUNDER_JUDGMENT,
    policy: POLICY,
    evidence: [
      makeEvidence({
        field: `learning_loop:${stage}`,
        label: LABELS.FOUNDER_JUDGMENT,
        value: { stage, eventId: event.eventId },
        source: { type: "file", ref: "founderIntelligence.learningLoop", retrievedAt: event.ts },
        note: POLICY,
      }),
    ],
  };
}

function listEvents({ limit = 50, proposalId = null, stage = null } = {}) {
  let events = readAll();
  if (proposalId) events = events.filter((e) => e.proposalId === proposalId);
  if (stage) events = events.filter((e) => e.stage === String(stage).toUpperCase());
  const sliced = events.slice(-Math.max(1, Math.min(200, limit)));
  return {
    success: true,
    count: sliced.length,
    total: events.length,
    events: sliced,
    policy: POLICY,
  };
}

/** Aggregated stage counts — evidence for future intelligence, not a rule engine. */
function summarize() {
  const events = readAll();
  const byStage = {};
  for (const s of STAGES) byStage[s] = 0;
  for (const e of events) byStage[e.stage] = (byStage[e.stage] || 0) + 1;
  const pairedQuotes = events.filter((e) => e.stage === "QUOTED");
  const actuals = events.filter((e) => e.stage === "ACTUAL_PRICE");
  return {
    success: true,
    totalEvents: events.length,
    byStage,
    quoteToActualPairs: Math.min(pairedQuotes.length, actuals.length),
    label: events.length > 0 ? LABELS.FOUNDER_JUDGMENT : LABELS.UNKNOWN,
    policy: POLICY,
  };
}

module.exports = { recordEvent, listEvents, summarize, STAGES, STAGE_REQUIRED, POLICY };
