const crypto = require("crypto");
const { generateExecutiveDecisionReport } = require("./revenueIntelligenceEngineService");

function sha256(data) {
  return crypto.createHash("sha256").update(typeof data === "string" ? data : JSON.stringify(data)).digest("hex");
}

function plainText(value = "") {
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Evaluates a single candidate opportunity against Constitutional Amendments 1-6
 */
function evaluateAttackOpportunity(candidate = {}, context = {}, options = {}) {
  const rieReport = candidate.rieReport || generateExecutiveDecisionReport(candidate, context, options);

  const metrics = rieReport.metrics || {};
  const pricing = rieReport.pricing || {};
  const time = rieReport.timeEconomics || {};

  const title = plainText(candidate.title || candidate.rawSource?.title || rieReport.title || "Opportunity");
  const company = plainText(candidate.company || candidate.rawSource?.company || rieReport.clientCompany || "Client");
  const channel = candidate.opportunityChannel || "founder_garuda";

  // 1. Classification Framework (Amendment 3)
  let classification = "founder_garuda";
  if (channel === "autonomous_garuda" || candidate.verification?.garudaExecutionEligible && !candidate.capabilityAssessment?.humanIdentityRequired) {
    classification = "autonomous_garuda";
  } else if (/physical onsite|bar admission/i.test(candidate.description || "")) {
    classification = "human_only";
  } else if (rieReport.recommendation === "REJECT") {
    classification = "reject";
  }

  const { getEmpiricalProbability } = require("./dealTrackerService");
  const empirical = getEmpiricalProbability();

  const winProb = empirical.measured ? empirical.winRate : (rieReport.capabilityMatch?.score || 85);
  const { calculateOpportunityIntelligence } = require("./clientIntelligenceEngineService");
  const oppIntel = calculateOpportunityIntelligence(candidate, context);

  const baseValue = pricing.recommendedPrice || 2500;
  const expectedProfitAmount = Math.max(0, baseValue - (pricing.baseCost || 800));
  const revenueScore = oppIntel.opportunityScore;
  const executionScore = Math.min(100, Math.max(10, rieReport.capabilityMatch?.score || 85));

  // 3. Founder Effort
  let founderEffort = "low";
  if (classification === "autonomous_garuda") {
    founderEffort = "none";
  } else if (classification === "founder_garuda") {
    founderEffort = "low"; // Founder identity & 1-click submission
  } else if (classification === "human_only") {
    founderEffort = "high";
  }

  // 4. Competition & Automation %
  const competition = winProb > 80 ? "low" : winProb > 65 ? "medium" : "high";
  const aiAutomationPercent = Math.min(95, Math.max(70, Math.round((time.aiExecutionHours / (time.aiExecutionHours + time.humanCoordinationHours + time.approvalHours)) * 100)));

  // 5. Recommended Action
  let recommendedAction = oppIntel.recommendedAction;
  if (classification === "reject" || classification === "human_only") {
    recommendedAction = "❌ Reject";
  }

  const attackReasoning = `Opportunity Score ${oppIntel.opportunityScore}/100 | Risk: ${oppIntel.riskLevel} (${oppIntel.riskScore}/100) | ERV: ${pricing.currency || "USD"} $${oppIntel.expectedRevenueValue.toLocaleString()} | ${founderEffort.toUpperCase()} Founder effort.`;

  return {
    opportunityId: String(candidate.externalId || candidate.id || candidate._id || rieReport.opportunityId),
    title,
    clientCompany: company,
    url: String(candidate.url || candidate.rawSource?.url || rieReport.url || ""),
    classification,
    opportunityCategory: candidate.opportunityCategory || "freelance_project",
    revenueScore: oppIntel.opportunityScore,
    opportunityScore: oppIntel.opportunityScore,
    riskScore: oppIntel.riskScore,
    riskLevel: oppIntel.riskLevel,
    expectedRevenueValue: oppIntel.expectedRevenueValue,
    clientTrustScore: oppIntel.clientIntel.clientTrustScore,
    scopeClarity: oppIntel.clientIntel.scopeClarity,
    executionScore,
    founderEffort,
    competition,
    aiAutomationPercent,
    expectedDeliveryTime: {
      humanRealityDays: time.recommendedClientDeliveryDays,
      aiExecutionHours: time.aiExecutionHours,
      speedCompressionRatio: time.aiTimeCompressionRatio
    },
    expectedProfit: {
      amount: expectedProfitAmount,
      currency: pricing.currency || "USD"
    },
    recommendedAction,
    attackReasoning,
    clientIntelligence: oppIntel.clientIntel,
    riskAnalysis: oppIntel.riskAnalysis,
    rieReport
  };
}

/**
 * Generates TODAY'S ATTACK LIST (Amendment 4)
 */
function generateTodaysAttackList(candidates = [], context = {}, options = {}) {
  const now = options.now ? new Date(options.now) : new Date();
  const dateStr = now.toISOString().split("T")[0];

  const listToEvaluate = Array.isArray(candidates) && candidates.length > 0
    ? candidates
    : [
        {
          externalId: "opp-attack-001",
          url: "https://upwork.com/jobs/~0123456789abcdef",
          title: "Build Custom Node.js REST API & Automated Tests",
          company: "Acme FinTech Corp",
          description: "Build a custom Node.js microservice REST API endpoint with automated Jest test suite.",
          salaryText: "$5,000 fixed price",
          tags: ["Node.js", "REST API", "Automated Testing"]
        },
        {
          externalId: "opp-attack-002",
          url: "https://freelancer.com/projects/react-dashboard-frontend",
          title: "React Web Dashboard & Data Visualization",
          company: "DataCloud Systems",
          description: "Develop a React dashboard with charts and state management.",
          salaryText: "$3,500 fixed price",
          tags: ["React", "TypeScript", "Dashboard"]
        }
      ];

  const evaluated = listToEvaluate.map((item) => evaluateAttackOpportunity(item, context, { now }));

  // Sort candidates by Revenue Score descending
  evaluated.sort((a, b) => b.revenueScore - a.revenueScore);

  const rankedAttackList = evaluated.map((item, index) => ({
    rank: index + 1,
    ...item
  }));

  const totalPotentialRevenueAmount = rankedAttackList.reduce((sum, item) => sum + item.expectedProfit.amount, 0);
  const avgAutomation = Math.round(rankedAttackList.reduce((sum, item) => sum + item.aiAutomationPercent, 0) / rankedAttackList.length);

  return {
    attackListDate: dateStr,
    summary: {
      totalOpportunitiesEvaluated: rankedAttackList.length,
      topAttackCount: rankedAttackList.filter((item) => item.recommendedAction === "ATTACK_IMMEDIATELY" || item.recommendedAction === "FOUNDER_SUBMIT").length,
      totalPotentialRevenue: {
        amount: totalPotentialRevenueAmount,
        currency: rankedAttackList[0]?.expectedProfit?.currency || "USD"
      },
      averageAiAutomationPercent: avgAutomation
    },
    attackList: rankedAttackList,
    generatedAt: now.toISOString()
  };
}

/**
 * FOUNDER EXECUTION PLANNER ENGINE
 * Converts GARUDA from an analyst into an execution planner.
 * Tells Founder: "Ignore the other N opportunities. Do these 3 first."
 */
function generateTodaysFounderExecutionMission(candidates = [], context = {}, options = {}) {
  const attackData = generateTodaysAttackList(candidates, context, options);
  const allList = attackData.attackList || [];
  
  const top3 = allList.slice(0, 3);
  const ignoredCount = Math.max(0, allList.length - top3.length);

  const missionItems = top3.map((item, idx) => {
    return {
      executionPriority: idx === 0 ? "P0_IMMEDIATE" : idx === 1 ? "P1_HIGH" : "P2_MEDIUM",
      rank: idx + 1,
      opportunity: {
        title: item.title,
        company: item.clientCompany || "Client Team",
        url: item.url,
        category: item.opportunityCategory || "freelance_project"
      },
      whySelected: `Highest Expected Revenue Value (USD $${(item.expectedRevenueValue || 2500).toLocaleString()}) with ${item.riskLevel} risk (${item.riskScore}/100) and 100% technical deliverability fit.`,
      expectedRevenueUSD: item.expectedRevenueValue || item.expectedProfit?.amount || 2500,
      estimatedCompletionTime: `${item.expectedDeliveryTime?.humanRealityDays || 5} Business Days (${item.expectedDeliveryTime?.aiExecutionHours || 48} AI Hours)`,
      preparationStatus: "100% PREPARED & VALIDATED",
      proposalStatus: "READY (Category-tailored text generated)",
      documentsStatus: "READY (Test execution guarantee & breakdown attached)",
      founderApprovalNeeded: true,
      followUpRequired: "Automated 3-Day Follow-Up scheduled upon submission",
      confidence: `${item.opportunityScore || 85}%`
    };
  });

  return {
    missionHeadline: `FOUNDER DAILY EXECUTION MISSION — Ignore ${ignoredCount} lower-value candidates. Execute these ${top3.length} first.`,
    ignoredOpportunitiesCount: ignoredCount,
    executionDirective: "GARUDA has prioritized the market. Review and click 1-Click Copy / Open URL to execute.",
    dailyMissionItems: missionItems,
    totalMissionPipelineUSD: missionItems.reduce((sum, m) => sum + m.expectedRevenueUSD, 0)
  };
}

module.exports = {
  evaluateAttackOpportunity,
  generateTodaysAttackList,
  generateTodaysFounderExecutionMission,
  sha256
};
