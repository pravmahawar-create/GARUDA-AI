/**
 * GARUDA FOUNDER INTELLIGENCE — Pricing Evidence Store (Phase 4)
 *
 * Source-of-truth policy (Founder correction #1):
 *  - The catalog below is NOT the ultimate truth. It is a VERSIONED,
 *    RETRIEVABLE EVIDENCE SNAPSHOT with explicit source metadata.
 *  - External verified source: live https://www.garudaos.in/pricing
 *    (fetched & verified 2026-09-26 by founder-directed live fetch).
 *  - Secondary internal evidence: GARUDA data files (manifest, targets,
 *    historical proposals) carry their own source + generatedAt metadata.
 *  - Stale snapshots are DETECTABLE (freshness flag + warnings).
 *  - If a current price cannot be verified → engine returns UNKNOWN,
 *    never an invented number.
 *
 * Re-verification: update the live snapshot block below (retrievedAt +
 * version bump) whenever the pricing page is re-fetched.
 */

const fs = require("fs");
const path = require("path");

const LIVE_SNAPSHOT_ID = "live-garudaos-pricing";
const LIVE_SOURCE_URL = "https://www.garudaos.in/pricing";
const LIVE_RETRIEVED_AT = "2026-09-26";
const LIVE_SNAPSHOT_VERSION = 1;
const STALE_AFTER_DAYS = 30;

/**
 * Entries verified directly from the live pricing page (2026-09-26).
 * type: "subscription" (period billing) | "project" (fixed-price from)
 */
const LIVE_ENTRIES = Object.freeze([
  {
    id: "saas_sovereign_personal",
    tag: "saas_subscription",
    title: "Sovereign Personal (SaaS)",
    amountINR: 0,
    period: "month",
    kind: "subscription",
    note: "Free tier start of SaaS range",
  },
  {
    id: "saas_enterprise_titan",
    tag: "saas_subscription",
    title: "Enterprise Titan (SaaS, top of range)",
    amountINR: 19999,
    period: "month",
    kind: "subscription",
    note: "Top of verified SaaS range ₹0–₹19,999/mo",
  },
  {
    id: "project_custom_ai",
    tag: "custom_ai",
    title: "Custom AI Development (starting from)",
    amountINR: 45000,
    period: "project",
    kind: "project_from",
  },
  {
    id: "project_saas_mvp",
    tag: "saas_mvp",
    title: "SaaS MVP Development (starting from)",
    amountINR: 50000,
    period: "project",
    kind: "project_from",
  },
  {
    id: "project_business_automation",
    tag: "business_automation",
    title: "Business Automation (starting from)",
    amountINR: 25000,
    period: "project",
    kind: "project_from",
  },
]);

const LIVE_POLICY = Object.freeze({
  milestoneGovernance: "50% milestone governance (verified on pricing page)",
});

function daysBetween(fromISO, nowMs) {
  const from = Date.parse(fromISO);
  if (Number.isNaN(from)) return null;
  return Math.floor((nowMs - from) / (24 * 60 * 60 * 1000));
}

function freshnessFor(retrievedAt, { nowMs = Date.now(), staleAfterDays = STALE_AFTER_DAYS } = {}) {
  const ageDays = daysBetween(retrievedAt, nowMs);
  if (ageDays === null) {
    return { freshness: "UNKNOWN", ageDays: null, staleAfterDays, isStale: true };
  }
  return {
    freshness: ageDays > staleAfterDays ? "STALE" : "CURRENT",
    ageDays,
    staleAfterDays,
    isStale: ageDays > staleAfterDays,
  };
}

function liveSnapshotMeta(options = {}) {
  return {
    snapshotId: LIVE_SNAPSHOT_ID,
    version: LIVE_SNAPSHOT_VERSION,
    source: { type: "url", ref: LIVE_SOURCE_URL, retrievedAt: LIVE_RETRIEVED_AT },
    freshness: freshnessFor(LIVE_RETRIEVED_AT, options),
    policy: LIVE_POLICY,
  };
}

function getLiveEntries(options = {}) {
  const meta = liveSnapshotMeta(options);
  return LIVE_ENTRIES.map((entry) => ({
    ...entry,
    snapshotId: meta.snapshotId,
    version: meta.version,
    source: meta.source,
    isStale: meta.freshness.isStale,
    freshness: meta.freshness.freshness,
  }));
}

/**
 * Secondary internal evidence — loaded lazily from disk.
 * Every internal record keeps its own source metadata.
 */
function getInternalEntries() {
  const out = [];

  try {
    const manifestPath = path.join(process.cwd(), "data", "boilerplate-store-manifest.json");
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      const p = manifest.pricing || {};
      const src = {
        type: "file",
        ref: "data/boilerplate-store-manifest.json",
        retrievedAt: manifest.generatedAt || null,
        version: manifest.version || null,
      };
      if (p.standard && typeof p.standard.inr === "number") {
        out.push({
          id: "boilerplate_standard",
          tag: "boilerplate_license",
          title: `Boilerplate license — ${p.standard.license}`,
          amountINR: p.standard.inr,
          period: "project",
          kind: "fixed",
          source: src,
        });
      }
      if (p.extended && typeof p.extended.inr === "number") {
        out.push({
          id: "boilerplate_extended",
          tag: "boilerplate_license",
          title: `Boilerplate license — ${p.extended.license}`,
          amountINR: p.extended.inr,
          period: "project",
          kind: "fixed",
          source: src,
        });
      }
      if (p.hosted && typeof p.hosted.inr === "number") {
        out.push({
          id: "boilerplate_hosted",
          tag: "boilerplate_license",
          title: `Boilerplate hosted — ${p.hosted.license}`,
          amountINR: p.hosted.inr,
          period: "month",
          kind: "subscription",
          source: src,
        });
      }
    }
  } catch {
    /* internal snapshot unreadable → entries simply absent, never invented */
  }

  try {
    const targetsPath = path.join(process.cwd(), "data", "agency-whitelabel-targets.json");
    if (fs.existsSync(targetsPath)) {
      const targets = JSON.parse(fs.readFileSync(targetsPath, "utf8"));
      const match = Array.isArray(targets)
        ? String(targets[0]?.whiteLabelOffer || "").match(/₹\s?([\d,]+)/)
        : null;
      if (match) {
        const amount = Number(match[1].replace(/,/g, ""));
        if (Number.isFinite(amount)) {
          out.push({
            id: "agency_whitelabel_bot",
            tag: "whatsapp_bot_whitelabel",
            title: "Agency white-label bot delivery (flat, 48h)",
            amountINR: amount,
            period: "project",
            kind: "fixed",
            source: {
              type: "file",
              ref: "data/agency-whitelabel-targets.json",
              retrievedAt: null,
              version: null,
            },
          });
        }
      }
    }
  } catch {
    /* absent → UNKNOWN path downstream */
  }

  return out;
}

/**
 * Full catalog: live verified entries + internal secondary evidence.
 */
function getCatalog(options = {}) {
  return [...getLiveEntries(options), ...getInternalEntries()];
}

/**
 * Find best catalog entries for a service tag.
 * Returns [] when nothing is verifiable → caller must answer UNKNOWN.
 */
function findEntries(tag, options = {}) {
  return getCatalog(options).filter((e) => e.tag === tag);
}

function getSnapshotStatus(options = {}) {
  const meta = liveSnapshotMeta(options);
  return {
    live: meta,
    internalSources: [
      { ref: "data/boilerplate-store-manifest.json", label: "INTERNAL_FILE" },
      { ref: "data/agency-whitelabel-targets.json", label: "INTERNAL_FILE" },
    ],
    staleAfterDays: STALE_AFTER_DAYS,
    reverifyAction: `Refetch ${LIVE_SOURCE_URL} and bump LIVE_RETRIEVED_AT + LIVE_SNAPSHOT_VERSION in pricingEvidenceStore.js`,
  };
}

module.exports = {
  LIVE_SNAPSHOT_ID,
  LIVE_SOURCE_URL,
  LIVE_RETRIEVED_AT,
  LIVE_SNAPSHOT_VERSION,
  STALE_AFTER_DAYS,
  getLiveEntries,
  getInternalEntries,
  getCatalog,
  findEntries,
  getSnapshotStatus,
  freshnessFor,
  liveSnapshotMeta,
};
