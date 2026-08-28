/**
 * GARUDA Global Acquisition Adapter Registry
 * Orchestrates multi-source opportunity ingestion, isolation, deduplication, and normalization.
 */

const RemotiveDiscoveryAdapter = require("./remotiveAdapter");
const FreelanceRssDiscoveryAdapter = require("./freelanceRssAdapter");
const GitHubBountiesDiscoveryAdapter = require("./githubBountiesAdapter");
const CustomSoftwareRfpDiscoveryAdapter = require("./customSoftwareRfpAdapter");

class DiscoveryAdapterRegistry {
  constructor(options = {}) {
    this.adapters = new Map();
    this.registerDefaultAdapters(options);
  }

  registerDefaultAdapters(options = {}) {
    this.register(new RemotiveDiscoveryAdapter(options.remotive || {}));
    this.register(new FreelanceRssDiscoveryAdapter(options.freelanceRss || {}));
    this.register(new GitHubBountiesDiscoveryAdapter(options.bounties || {}));
    this.register(new CustomSoftwareRfpDiscoveryAdapter(options.rfps || {}));
  }

  register(adapter) {
    if (adapter && adapter.name) {
      this.adapters.set(adapter.name, adapter);
    }
  }

  getAdapter(name) {
    return this.adapters.get(name) || null;
  }

  listAdapters() {
    return Array.from(this.adapters.values()).map((a) => ({
      name: a.name,
      enabled: a.enabled,
      timeoutMs: a.timeoutMs
    }));
  }

  /**
   * Fetches opportunities from ALL registered adapters in parallel with fault isolation,
   * normalizes them, and removes multi-source duplicates.
   */
  async fetchAllOpportunities(options = {}) {
    const activeAdapters = Array.from(this.adapters.values()).filter((a) => a.enabled);
    const fetchPromises = activeAdapters.map((adapter) =>
      adapter
        .fetchAndNormalize()
        .then((items) => ({ success: true, source: adapter.name, items }))
        .catch((err) => ({ success: false, source: adapter.name, error: err.message, items: [] }))
    );

    const settled = await Promise.allSettled(fetchPromises);
    const allNormalized = [];
    const sourceMetrics = {};
    let totalRawFetched = 0;

    for (let i = 0; i < activeAdapters.length; i++) {
      const adapterName = activeAdapters[i].name;
      const res = settled[i];
      if (res.status === "fulfilled" && res.value && res.value.success) {
        const items = res.value.items || [];
        allNormalized.push(...items);
        totalRawFetched += items.length;
        sourceMetrics[adapterName] = { status: "success", count: items.length };
      } else {
        const error = (res.value && res.value.error) || (res.reason && res.reason.message) || "failed";
        sourceMetrics[adapterName] = { status: "error", error, count: 0 };
      }
    }

    // Deduplication by composite ID and content fingerprint
    const seenIdentities = new Set();
    const seenFingerprints = new Set();
    const deduplicated = [];
    let duplicatesRemoved = 0;

    for (const opp of allNormalized) {
      const identityKey = `${opp.source}:${opp.externalId}`;
      const fingerprintKey = opp.fingerprint;

      if (seenIdentities.has(identityKey) || seenFingerprints.has(fingerprintKey)) {
        duplicatesRemoved += 1;
        continue;
      }

      seenIdentities.add(identityKey);
      seenFingerprints.add(fingerprintKey);
      deduplicated.push(opp);
    }

    return {
      totalRawFetched,
      duplicatesRemoved,
      uniqueCount: deduplicated.length,
      opportunities: deduplicated,
      sourceMetrics
    };
  }
}

module.exports = new DiscoveryAdapterRegistry();
