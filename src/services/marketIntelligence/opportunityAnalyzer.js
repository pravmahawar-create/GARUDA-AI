/**
 * 🦅 GARUDA Market Intelligence — Opportunity Analyzer
 * Evaluates commercial growth vectors, digital presence gaps, and generates structured hypotheses.
 */

class OpportunityAnalyzer {
  /**
   * Analyzes an evidence-backed prospect and generates qualified opportunities.
   */
  analyzeProspect(prospect = {}, adapter) {
    if (!prospect || !prospect.companyName) {
      return {
        qualificationStatus: "INSUFFICIENT_EVIDENCE",
        signals: [],
        confidenceScore: 0,
        summary: "Cannot analyze prospect without company identity"
      };
    }

    if (adapter && typeof adapter.evaluateOpportunitySignals === "function") {
      const signals = adapter.evaluateOpportunitySignals(prospect);
      const qualification = adapter.qualifyCandidate(prospect);

      return {
        qualificationStatus: qualification.qualified ? "QUALIFIED" : "DISQUALIFIED",
        qualificationScore: qualification.score,
        tier: qualification.tier || "UNCLASSIFIED",
        signals,
        reasons: qualification.reasons,
        confidenceScore: qualification.score
      };
    }

    // Generic fallback analysis
    return {
      qualificationStatus: "QUALIFIED",
      qualificationScore: 70,
      tier: "TIER_2_COMMERCIAL",
      signals: [
        {
          signal: "GENERAL_DIGITAL_ACCELERATION",
          hypothesis: "Company can scale inbound lead conversion with automated conversational triage",
          confidence: 0.75
        }
      ],
      confidenceScore: 70
    };
  }
}

module.exports = new OpportunityAnalyzer();
module.exports.OpportunityAnalyzer = OpportunityAnalyzer;
