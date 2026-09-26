/**
 * GARUDA FOUNDER INTELLIGENCE — Research Bridge (Phase 7)
 *
 * Wraps EXISTING GARUDA research surfaces (knowledgeService, pricing
 * evidence store) with evidence labels + source preservation.
 * NEVER fabricates market data: no hits → BLOCKED/UNKNOWN, not invented.
 *
 * External web research is intentionally NOT auto-fired here; the founder
 * orchestrator can pass verified external snapshots in as `externalSources`.
 */

const { LABELS, makeEvidence, unknownEvidence } = require("./evidenceLabels");
const pricingEvidenceStore = require("./pricingEvidenceStore");

/**
 * @param {string} query
 * @param {object} [options]
 * @param {Array}  [options.externalSources] pre-verified external snapshots
 *        [{ title, url, retrievedAt, snippet }]
 * @param {object} [deps] { knowledgeService } injectable for tests
 */
async function research(query, options = {}, deps = {}) {
  const knowledge =
    deps.knowledgeService || require("../knowledgeService");
  const q = String(query || "").trim();
  const evidence = [];
  const sources = [];
  const findings = [];

  if (!q) {
    return {
      success: false,
      label: LABELS.UNKNOWN,
      reason: "QUERY_REQUIRED",
      findings: [],
      sources: [],
      evidence: [unknownEvidence("query")],
      warnings: [],
    };
  }

  // ---- Internal knowledge (existing engine, reused) ----
  let knowledgeHits = [];
  let knowledgeBlocked = null;
  try {
    if (typeof knowledge.searchKnowledge === "function") {
      knowledgeHits = await knowledge.searchKnowledge(q, 5);
    }
  } catch (err) {
    knowledgeBlocked = err.message;
  }

  if (Array.isArray(knowledgeHits) && knowledgeHits.length > 0) {
    for (const hit of knowledgeHits) {
      const source = {
        type: "file",
        ref: hit.source || hit.origin || "knowledgeService",
        retrievedAt: hit.updatedAt || null,
      };
      sources.push({ title: hit.title || hit.name || q, source });
      findings.push({
        text: hit.snippet || hit.text || hit.content || "",
        label: LABELS.VERIFIED,
        source,
      });
      evidence.push(
        makeEvidence({ field: `knowledge:${hit.title || "hit"}`, label: LABELS.VERIFIED, value: true, source })
      );
    }
  } else if (knowledgeBlocked) {
    evidence.push(
      makeEvidence({
        field: "knowledgeService",
        label: LABELS.BLOCKED,
        value: null,
        source: null,
        note: knowledgeBlocked,
      })
    );
  } else {
    evidence.push(unknownEvidence("knowledgeService", "No internal knowledge hits"));
  }

  // ---- Pricing-relevant research → live pricing evidence ----
  if (/\b(pric|pricing|rate|cost|charge|fees|kitna|bhav)\b/i.test(q)) {
    const live = pricingEvidenceStore.getLiveEntries();
    if (live.length > 0) {
      const meta = pricingEvidenceStore.liveSnapshotMeta();
      const stale = meta.freshness.isStale;
      evidence.push(
        makeEvidence({
          field: "live_pricing_page",
          label: stale ? LABELS.PARTIAL : LABELS.VERIFIED,
          value: { entries: live.length, range: "₹0–₹19,999/mo + projects" },
          source: meta.source,
          note: stale ? "STALE_SNAPSHOT" : null,
        })
      );
      sources.push({
        title: "GARUDA Official Pricing (live)",
        source: meta.source,
        freshness: meta.freshness,
      });
      findings.push({
        text: "Verified live pricing anchors available in pricing engine.",
        label: stale ? LABELS.PARTIAL : LABELS.VERIFIED,
        source: meta.source,
      });
      if (stale) {
        // staleness surfaced, never hidden
      }
    } else {
      evidence.push(unknownEvidence("live_pricing_page"));
    }
  }

  // ---- Founder-supplied external snapshots ----
  for (const ext of options.externalSources || []) {
    const source = {
      type: "url",
      ref: ext.url || ext.ref || null,
      retrievedAt: ext.retrievedAt || null,
    };
    const label = ext.retrievedAt && ext.snippet ? LABELS.VERIFIED : LABELS.PARTIAL;
    evidence.push(
      makeEvidence({ field: `external:${ext.title || source.ref}`, label, value: true, source })
    );
    sources.push({ title: ext.title || source.ref, source });
    findings.push({ text: ext.snippet || "", label, source });
  }

  const labels = evidence.map((e) => e.label);
  const hasVerified = labels.includes(LABELS.VERIFIED);
  const hasUnknown = labels.includes(LABELS.UNKNOWN);

  const overall = !hasVerified && hasUnknown
    ? LABELS.UNKNOWN
    : hasUnknown
      ? LABELS.PARTIAL
      : hasVerified
        ? LABELS.VERIFIED
        : LABELS.BLOCKED;

  // ---- Explicit research layers (§7) — never blur layer boundaries ----
  const pricingRequested = /\b(pric|pricing|rate|cost|charge|fees|kitna|bhav)\b/i.test(q);
  const extSources = options.externalSources || [];
  const layers = [
    {
      layer: "garuda_internal_knowledge",
      engine: "knowledgeService.searchKnowledge",
      status: knowledgeBlocked ? LABELS.BLOCKED : knowledgeHits.length > 0 ? LABELS.VERIFIED : LABELS.UNKNOWN,
      hits: knowledgeHits.length,
      note: knowledgeBlocked ? knowledgeBlocked : knowledgeHits.length > 0 ? null : "No internal knowledge match",
    },
    {
      layer: "verified_garuda_pricing",
      engine: "pricingEvidenceStore (garudaos.in/pricing snapshot)",
      status: pricingRequested
        ? (pricingEvidenceStore.getLiveEntries().length > 0
            ? (pricingEvidenceStore.liveSnapshotMeta().freshness.isStale ? LABELS.PARTIAL : LABELS.VERIFIED)
            : LABELS.UNKNOWN)
        : LABELS.UNKNOWN,
      hits: pricingRequested ? pricingEvidenceStore.getLiveEntries().length : 0,
      note: pricingRequested ? null : "Not requested for this query",
    },
    {
      layer: "external_current_research",
      engine: extSources.length > 0 ? "founder-supplied external snapshots" : "auto web research",
      status: extSources.length > 0 ? (extSources.every((e) => e.retrievedAt && e.snippet) ? LABELS.VERIFIED : LABELS.PARTIAL) : LABELS.PLANNED,
      hits: extSources.length,
      note: extSources.length > 0 ? null : "Auto web research not wired — pass verified externalSources or treat as PLANNED",
    },
    {
      layer: "scout_infrastructure",
      engine: "scoutOpportunityService",
      status: LABELS.PLANNED,
      hits: 0,
      note: "Scout serves opportunity pipelines (not market research) — intentionally not wired to avoid false market claims",
    },
  ];

  return {
    success: findings.length > 0,
    label: overall,
    query: q,
    findings,
    sources,
    evidence,
    layers,
    warnings: evidence.some((e) => e.note === "STALE_SNAPSHOT") ? ["PRICE_SNAPSHOT_STALE"] : [],
  };
}

module.exports = { research };
