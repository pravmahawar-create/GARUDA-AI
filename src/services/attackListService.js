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

  // 2. Revenue Score & Execution Score (Amendment 4)
  const baseValue = pricing.recommendedPrice || 2500;
  const winProb = metrics.probabilityOfWinning || 80;
  const payProb = metrics.probabilityOfPayment || 90;

  const expectedProfitAmount = Math.max(0, baseValue - (pricing.baseCost || 800));
  const revenueScore = Math.min(100, Math.max(10, Math.round((winProb * 0.4) + (payProb * 0.4) + Math.min(20, (expectedProfitAmount / 500)))));
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
  let recommendedAction = "FOUNDER_SUBMIT";
  if (revenueScore >= 85 && classification !== "reject") {
    recommendedAction = "ATTACK_IMMEDIATELY";
  } else if (rieReport.recommendation === "NEGOTIATE") {
    recommendedAction = "NEGOTIATE";
  } else if (classification === "reject" || classification === "human_only") {
    recommendedAction = "PASS";
  }

  const attackReasoning = `Revenue Score ${revenueScore}/100 | Expected Profit: ${pricing.currency || "USD"} ${expectedProfitAmount.toLocaleString()} | ${aiAutomationPercent}% AI Automation | ${founderEffort.toUpperCase()} Founder effort.`;

  return {
    opportunityId: String(candidate.externalId || candidate.id || candidate._id || rieReport.opportunityId),
    title,
    clientCompany: company,
    url: String(candidate.url || candidate.rawSource?.url || rieReport.url || ""),
    classification,
    revenueScore,
    executionScore,
    founderEffort,
    expectedDeliveryTime: {
      humanRealityDays: time.recommendedClientDeliveryDays || 4,
      aiExecutionHours: time.aiExecutionHours || 6
    },
    paymentProbability: payProb,
    competition,
    expectedProfit: {
      amount: expectedProfitAmount,
      currency: pricing.currency || "USD"
    },
    aiAutomationPercent,
    recommendedAction,
    attackReasoning,
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

module.exports = {
  evaluateAttackOpportunity,
  generateTodaysAttackList,
  sha256
};
