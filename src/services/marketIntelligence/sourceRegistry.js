/**
 * 🦅 GARUDA Market Intelligence — Source Registry
 * Manages registered discovery sources, health checks, and availability audits.
 */

const PublicSearchDiscoverySource = require("./sources/publicSearchDiscoverySource");

class SourceRegistry {
  constructor() {
    this.sources = new Map();
    this.registerDefaultSources();
  }

  registerDefaultSources() {
    this.registerSource(new PublicSearchDiscoverySource());
  }

  registerSource(sourceInstance) {
    if (!sourceInstance || !sourceInstance.sourceId) {
      throw new Error("Valid source instance with sourceId is required");
    }
    this.sources.set(sourceInstance.sourceId, sourceInstance);
  }

  getSource(sourceId) {
    return this.sources.get(sourceId);
  }

  listSources() {
    return Array.from(this.sources.values()).map(s => ({
      sourceId: s.sourceId,
      name: s.name,
      sourceType: s.sourceType,
      isConfigured: s.isConfigured,
      rateLimitPerMin: s.rateLimitPerMin
    }));
  }

  /**
   * Audits health and availability across all registered discovery sources.
   */
  async auditAllSources() {
    const results = [];
    for (const source of this.sources.values()) {
      try {
        const health = await source.checkAvailability();
        results.push({
          sourceId: source.sourceId,
          name: source.name,
          sourceType: source.sourceType,
          status: health.available ? "AVAILABLE" : "UNAVAILABLE",
          details: health
        });
      } catch (err) {
        results.push({
          sourceId: source.sourceId,
          name: source.name,
          sourceType: source.sourceType,
          status: "UNAVAILABLE",
          error: err.message
        });
      }
    }
    return results;
  }
}

module.exports = new SourceRegistry();
module.exports.SourceRegistry = SourceRegistry;
