const { getRevenueMetrics: getCashRevenueMetrics } = require("./revenueService");
const {
  getRevenueMetrics: getPipelineMetrics,
  calculateNextHighestRoiAction,
  parseMonetaryValue
} = require("./revenueCommandCenterService");
const { getGarudaIdentityStatement } = require("./capabilityRegistryService");

async function getGarudaRevenueState(options = {}) {
  let cashMetrics = {
    receivedRevenue: 0,
    mtdRevenue: 0,
    pendingRevenue: 0,
    prevMonthRevenue: 0,
    refundedRevenue: 0,
    trend: "+0%",
    totalRecords: 0
  };

  let pipelineMetrics = {
    timestamp: new Date().toISOString(),
    dataSource: "fallback",
    metrics: {
      opportunitiesDiscovered: 0,
      qualifiedOpportunities: 0,
      garudaDeliverableOpportunities: 0,
      proposalReadyOpportunities: 0,
      founderApprovalsPending: 0,
      submittedProposals: 0,
      clientResponses: 0,
      negotiations: 0,
      wonOpportunities: 0,
      lostOpportunities: 0,
      revenuePotential: "$0 USD",
      revenueClosed: "$0 USD",
      conversionPercentage: "0%",
      outreach: {
        pendingOutreach: 0,
        sentToday: 0,
        responsesReceived: 0,
        meetingsRequested: 0,
        dealsProgressing: 0,
        blockedDeals: 0
      }
    },
    nextHighestRoiAction: {
      action: "RUN_LIVE_OPPORTUNITY_DISCOVERY",
      priority: "HIGH",
      reason: "Revenue pipeline is empty."
    }
  };

  try {
    const res = await getCashRevenueMetrics();
    if (res) cashMetrics = { ...cashMetrics, ...res };
  } catch (err) {
    // Defensive error handling: MongoDB offline or error
  }

  try {
    const res = await getPipelineMetrics(options);
    if (res && res.metrics) pipelineMetrics = res;
  } catch (err) {
    // Defensive error handling: Local fallback or pipeline error
  }

  const usdToInrRate = options.usdToInrRate || 83;

  const settledRevenueUSD = parseMonetaryValue(cashMetrics.receivedRevenue || 0);
  const settledRevenueINR = Math.round(settledRevenueUSD * usdToInrRate);

  const pendingRevenueUSD = parseMonetaryValue(cashMetrics.pendingRevenue || 0);
  const pendingRevenueINR = Math.round(pendingRevenueUSD * usdToInrRate);

  const pipelinePotentialUSD = parseMonetaryValue(pipelineMetrics.metrics.revenuePotential || 0);
  const pipelinePotentialINR = Math.round(pipelinePotentialUSD * usdToInrRate);

  const mtdSettledRevenueUSD = parseMonetaryValue(cashMetrics.mtdRevenue || 0);
  const mtdSettledRevenueINR = Math.round(mtdSettledRevenueUSD * usdToInrRate);

  const pm = pipelineMetrics.metrics || {};
  const nextAction = pipelineMetrics.nextHighestRoiAction || calculateNextHighestRoiAction(pm);

  return {
    summary: {
      settledRevenueINR,
      pendingRevenueINR,
      pipelinePotentialINR,
      mtdSettledRevenueINR,
      trend: cashMetrics.trend || "+0%",
      lastUpdated: new Date().toISOString()
    },
    pipeline: {
      opportunitiesDiscovered: pm.opportunitiesDiscovered || 0,
      qualifiedOpportunities: pm.qualifiedOpportunities || 0,
      garudaDeliverableOpportunities: pm.garudaDeliverableOpportunities || 0,
      proposalReadyOpportunities: pm.proposalReadyOpportunities || 0,
      founderApprovalsPending: pm.founderApprovalsPending || 0,
      submittedProposals: pm.submittedProposals || 0,
      clientResponses: pm.clientResponses || 0,
      negotiations: pm.negotiations || 0,
      wonOpportunities: pm.wonOpportunities || 0,
      lostOpportunities: pm.lostOpportunities || 0,
      conversionPercentage: pm.conversionPercentage || "0%"
    },
    outreach: pm.outreach || {
      pendingOutreach: 0,
      sentToday: 0,
      responsesReceived: 0,
      meetingsRequested: 0,
      dealsProgressing: 0,
      blockedDeals: 0
    },
    accounting: {
      settledRevenueUSD,
      pendingRevenueUSD,
      pipelinePotentialUSD,
      mtdRevenueUSD: mtdSettledRevenueUSD,
      refundedRevenueUSD: cashMetrics.refundedRevenue || 0,
      totalRecords: cashMetrics.totalRecords || 0,
      currency: "INR",
      exchangeRate: usdToInrRate
    },
    governance: {
      nextHighestRoiAction: nextAction,
      garudaIdentityStatement: typeof getGarudaIdentityStatement === "function"
        ? getGarudaIdentityStatement()
        : "I am GARUDA, Praveen's AI representative."
    },
    legacy: {
      receivedRevenue: cashMetrics.receivedRevenue || 0,
      mtdRevenue: cashMetrics.mtdRevenue || 0,
      revenuePotential: pm.revenuePotential || "$0 USD"
    }
  };
}

module.exports = {
  getGarudaRevenueState
};
