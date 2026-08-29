/**
 * 🦅 GARUDA Market Intelligence — Base Discovery Source Contract
 * Defines the canonical interface for external discovery providers (search, registries, public web).
 */

class BaseDiscoverySource {
  constructor(sourceId, name, options = {}) {
    if (!sourceId || !name) throw new Error("sourceId and name are required for BaseDiscoverySource");
    this.sourceId = sourceId;
    this.name = name;
    this.sourceType = options.sourceType || "PUBLIC_WEB";
    this.isConfigured = options.isConfigured !== false;
    this.rateLimitPerMin = options.rateLimitPerMin || 30;
  }

  /**
   * Checks health and availability of this discovery source.
   */
  async checkAvailability() {
    throw new Error("checkAvailability must be implemented by subclass");
  }

  /**
   * Executes a discovery query and returns structured raw candidates with source evidence.
   */
  async executeQuery(query, options = {}) {
    throw new Error("executeQuery must be implemented by subclass");
  }
}

module.exports = BaseDiscoverySource;
