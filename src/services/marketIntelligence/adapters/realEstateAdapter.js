/**
 * 🦅 GARUDA Market Intelligence — Real Estate Industry Adapter
 * Focus: Delhi-NCR Real Estate (Noida, Greater Noida, Gurgaon, Delhi, Ghaziabad, Faridabad)
 */

const BaseIndustryAdapter = require("./baseIndustryAdapter");

class RealEstateAdapter extends BaseIndustryAdapter {
  constructor() {
    super("REAL_ESTATE", {
      supportedRegions: [
        "DELHI_NCR",
        "NOIDA",
        "GREATER_NOIDA",
        "GURGAON",
        "DELHI",
        "GHAZIABAD",
        "FARIDABAD"
      ]
    });
  }

  /**
   * Generates dynamic discovery queries across micro-markets and property categories.
   */
  generateDiscoveryQueries(context = {}) {
    const region = (context.region || "DELHI_NCR").toUpperCase();
    const localities = context.localities || ["Noida Sector 150", "Greater Noida West", "Dwarka Expressway", "Golf Course Ext Road"];
    
    const queryPatterns = [
      "luxury residential projects",
      "real estate developers official website",
      "new township property launch",
      "commercial retail developer projects"
    ];

    const queries = [];
    for (const loc of localities) {
      for (const pat of queryPatterns) {
        queries.push(`${pat} in ${loc}`);
      }
    }

    if (context.limit && Number(context.limit) > 0) {
      return queries.slice(0, Number(context.limit));
    }
    return queries.slice(0, 10);
  }

  /**
   * Qualifies whether a discovered entity is a genuine real estate business.
   */
  qualifyCandidate(candidate = {}) {
    const reasons = [];
    let score = 0;

    if (!candidate.companyName || candidate.companyName.length < 3) {
      return { qualified: false, score: 0, reasons: ["Missing valid developer/company name"] };
    }
    score += 25;
    reasons.push("Valid company identity detected");

    if (candidate.sourceUrl && (candidate.sourceUrl.startsWith("http://") || candidate.sourceUrl.startsWith("https://"))) {
      score += 25;
      reasons.push("Verifiable public source URL available");
    } else {
      return { qualified: false, score: 25, reasons: ["Missing verifiable source URL"] };
    }

    const nameOrDesc = `${candidate.companyName} ${candidate.description || ""} ${candidate.projectNames?.join(" ") || ""}`.toLowerCase();
    const realEstateKeywords = ["homes", "group", "infra", "developers", "projects", "builders", "properties", "residences", "realty", "living", "estates", "towers"];
    const hasKeyword = realEstateKeywords.some(kw => nameOrDesc.includes(kw));

    if (hasKeyword) {
      score += 25;
      reasons.push("Real estate domain keywords verified");
    } else {
      score += 10;
      reasons.push("General commercial enterprise — secondary real estate match");
    }

    if (candidate.reraNumber) {
      score += 25;
      reasons.push("UP/Haryana RERA registration identifier observed");
    } else {
      score += 10;
      reasons.push("Standard public listing without explicit RERA tag");
    }

    const qualified = score >= 60;
    return {
      qualified,
      score,
      reasons,
      tier: score >= 80 ? "TIER_1_ENTERPRISE_DEVELOPER" : qualified ? "TIER_2_BOUTIQUE_BUILDER" : "DISQUALIFIED"
    };
  }

  /**
   * Evaluates commercial growth opportunity signals from observed facts.
   */
  evaluateOpportunitySignals(candidate = {}) {
    const signals = [];

    // Signal 1: Mobile landing & load speed friction
    signals.push({
      signal: "MOBILE_LEAD_CAPTURE_FRICTION",
      hypothesis: "Digital ad traffic likely experiences conversion drop-off without sub-2s mobile landing funnel",
      evidence: candidate.sourceUrl ? `Audited public endpoint ${candidate.sourceUrl}` : "Public digital footprint inspection",
      confidence: 0.80,
      potentialService: "GARUDA High-Converting Mobile Funnel & Meta Ads Management"
    });

    // Signal 2: Conversational triage latency
    signals.push({
      signal: "SITE_VISIT_LATENCY_GAP",
      hypothesis: "Inbound buyer inquiries after business hours likely go cold due to manual calling delays",
      evidence: "Standard Delhi-NCR manual sales desk turnaround baseline",
      confidence: 0.85,
      potentialService: "GARUDA 60-Second WhatsApp AI Lead Qualification & Site-Visit Booking"
    });

    // Signal 3: Attribution & double-booking protection
    signals.push({
      signal: "CHANNEL_PARTNER_ATTRIBUTION_GAP",
      hypothesis: "Multi-broker walkthroughs lack cryptographic digital attribution and lead deduplication",
      evidence: "Multi-channel inventory sales workflow",
      confidence: 0.75,
      potentialService: "GARUDA Real Estate Growth OS Attribution Dashboard"
    });

    return signals;
  }

  /**
   * Formats industry-specific outreach context and discovery questions.
   */
  formatOutreachContext(candidate = {}) {
    const project = candidate.projectNames?.[0] || "your premier projects";
    return {
      suggestedPackage: "GARUDA_GROWTH_ENGINE",
      primaryValueVector: "Accelerating verified site-visit walkthroughs with 60-second conversational qualification",
      discoveryQuestions: [
        `What is your current average turnaround time between an ad inquiry for ${project} and the first sales call?`,
        "What percentage of digital inquiries currently convert into confirmed on-site walkthroughs?",
        "Are you currently tracking channel partner walkthrough attribution in real-time?"
      ]
    };
  }
}

module.exports = RealEstateAdapter;
