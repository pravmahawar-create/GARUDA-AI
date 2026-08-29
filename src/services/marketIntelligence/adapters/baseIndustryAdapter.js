/**
 * 🦅 GARUDA Market Intelligence — Base Industry Adapter Contract
 * Defines the canonical interface for domain-specific market discovery, qualification, and signals.
 */

class BaseIndustryAdapter {
  constructor(industry, options = {}) {
    if (!industry) throw new Error("Industry identifier is required for BaseIndustryAdapter");
    this.industry = industry;
    this.supportedRegions = options.supportedRegions || [];
  }

  /**
   * Generates intelligent discovery queries based on region and context.
   */
  generateDiscoveryQueries(context = {}) {
    throw new Error("generateDiscoveryQueries must be implemented by subclass");
  }

  /**
   * Evaluates candidate qualification against industry criteria.
   */
  qualifyCandidate(candidate = {}) {
    throw new Error("qualifyCandidate must be implemented by subclass");
  }

  /**
   * Evaluates commercial growth opportunity signals from observed facts.
   */
  evaluateOpportunitySignals(candidate = {}) {
    throw new Error("evaluateOpportunitySignals must be implemented by subclass");
  }

  /**
   * Formats industry-specific outreach context and discovery questions.
   */
  formatOutreachContext(candidate = {}) {
    throw new Error("formatOutreachContext must be implemented by subclass");
  }
}

module.exports = BaseIndustryAdapter;
