/**
 * GARUDA FOUNDER INTELLIGENCE — Evidence Label System (Phase 7)
 *
 * Canonical truth labels mandated by Founder directive.
 * NEVER allow unlabelled claims to leave the Founder Intelligence layer.
 */

const LABELS = Object.freeze({
  VERIFIED: "VERIFIED",                 // direct source, metadata present, fresh
  PARTIAL: "PARTIAL",                   // some fields sourced, some missing/stale
  ESTIMATE: "ESTIMATE",                 // deterministic model calculation from declared inputs
  FOUNDER_JUDGMENT: "FOUNDER_JUDGMENT",  // assumption explicitly provided by founder
  PLANNED: "PLANNED",                   // declared plan, not yet executed
  UNKNOWN: "UNKNOWN",                   // cannot be verified — returned instead of invented
  BLOCKED: "BLOCKED",                   // dependency unavailable
  CONTRADICTED: "CONTRADICTED",         // sources disagree
});

const VALID_LABELS = new Set(Object.values(LABELS));

// Priority for choosing a display label from multiple evidence items
// (higher = stronger). UNKNOWN is intentionally strong so a single
// unverifiable element is never masked by weaker ESTIMATE claims.
const LABEL_PRIORITY = Object.freeze({
  CONTRADICTED: 6,
  UNKNOWN: 5,
  VERIFIED: 4,
  PARTIAL: 3,
  FOUNDER_JUDGMENT: 2,
  PLANNED: 2,
  ESTIMATE: 1,
  BLOCKED: 0,
});

function isValidLabel(label) {
  return VALID_LABELS.has(label);
}

function assertLabel(label) {
  if (!isValidLabel(label)) {
    throw new Error(`INVALID_EVIDENCE_LABEL: ${label}`);
  }
  return label;
}

/**
 * Build a normalized evidence record.
 * source: { type: "url"|"file"|"founder"|"model"|"live", ref, retrievedAt, version? }
 */
function makeEvidence({ field, label, value = null, source = null, note = null }) {
  assertLabel(label);
  if (label !== LABELS.UNKNOWN && label !== LABELS.BLOCKED && !source) {
    throw new Error(`EVIDENCE_SOURCE_REQUIRED_FOR_${label}:${field}`);
  }
  return Object.freeze({
    field: String(field),
    label,
    value,
    source: source
      ? Object.freeze({
          type: source.type || null,
          ref: source.ref || null,
          retrievedAt: source.retrievedAt || null,
          version: source.version || null,
        })
      : null,
    note: note || null,
  });
}

function unknownEvidence(field, note = null) {
  return makeEvidence({ field, label: LABELS.UNKNOWN, source: null, note });
}

/**
 * Combine multiple evidence labels into the HONEST display label.
 * Rules:
 *  - CONTRADICTED wins outright.
 *  - UNKNOWN mixed with any sourced claim → PARTIAL (never hide unknowns,
 *    never nuke a genuinely sourced result to UNKNOWN).
 *  - Unknown-only → UNKNOWN.
 *  - Otherwise strongest present claim: PARTIAL > VERIFIED >
 *    FOUNDER_JUDGMENT > ESTIMATE > PLANNED > BLOCKED.
 */
function combineLabels(labels) {
  const clean = (labels || []).filter(isValidLabel);
  if (clean.length === 0) return LABELS.UNKNOWN;
  if (clean.includes(LABELS.CONTRADICTED)) return LABELS.CONTRADICTED;

  const has = (l) => clean.includes(l);
  const hasSourced =
    has(LABELS.VERIFIED) || has(LABELS.ESTIMATE) || has(LABELS.FOUNDER_JUDGMENT) || has(LABELS.PARTIAL) || has(LABELS.PLANNED);

  if (has(LABELS.UNKNOWN)) {
    return hasSourced ? LABELS.PARTIAL : LABELS.UNKNOWN;
  }
  if (has(LABELS.PARTIAL)) return LABELS.PARTIAL;
  if (has(LABELS.VERIFIED)) return LABELS.VERIFIED;
  if (has(LABELS.FOUNDER_JUDGMENT)) return LABELS.FOUNDER_JUDGMENT;
  if (has(LABELS.ESTIMATE)) return LABELS.ESTIMATE;
  if (has(LABELS.PLANNED)) return LABELS.PLANNED;
  if (has(LABELS.BLOCKED)) return LABELS.BLOCKED;
  return LABELS.UNKNOWN;
}

function summarizeEvidence(evidenceList) {
  const list = Array.isArray(evidenceList) ? evidenceList : [];
  return {
    label: combineLabels(list.map((e) => e.label)),
    count: list.length,
    unknownFields: list
      .filter((e) => e.label === LABELS.UNKNOWN)
      .map((e) => e.field),
    staleSources: list
      .filter((e) => e.note === "STALE_SNAPSHOT")
      .map((e) => e.field),
  };
}

module.exports = {
  LABELS,
  VALID_LABELS,
  LABEL_PRIORITY,
  isValidLabel,
  assertLabel,
  makeEvidence,
  unknownEvidence,
  combineLabels,
  summarizeEvidence,
};
