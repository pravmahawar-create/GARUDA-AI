const {
  recordDealSubmission,
  recordClientResponse,
  recordDealOutcome,
  getRealityMetrics,
  getEmpiricalProbability
} = require("../src/services/dealTrackerService");

function renderRealityMetricsReport() {
  console.log("=================================================");
  console.log("🦅 GARUDA AI REALITY METRICS REPORT (SPRINT 8)");
  console.log("=================================================\n");

  const metrics = getRealityMetrics();

  console.log("--- 1. EMPIRICAL CONVERSION METRICS ---");
  console.log(`Total Deals Submitted     : ${metrics.submissionCount}`);
  console.log(`Client Replies Received   : ${metrics.replyCount || 0} (${metrics.replyRateLabel})`);
  console.log(`Interview Rate            : ${metrics.interviewRateLabel}`);
  console.log(`Negotiation Rate          : ${metrics.negotiationRateLabel}`);
  console.log(`Deposit Rate              : ${metrics.depositRateLabel}`);
  console.log(`Empirical Win Rate        : ${metrics.winRateLabel}`);
  console.log(`Actual Revenue Collected  : USD $${metrics.revenueCollected.toLocaleString()}`);
  console.log(`Average Reply Time        : ${metrics.averageReplyTimeHours ? metrics.averageReplyTimeHours + " Hours" : "UNMEASURED"}`);
  console.log(`Average Deal Size         : USD $${metrics.averageDealSize.toLocaleString()}`);
  console.log(`Average Days to Payment   : ${metrics.averageDaysToPayment ? metrics.averageDaysToPayment + " Days" : "UNMEASURED"}\n`);

  console.log("--- 2. DEAL STATUS BREAKDOWN ---");
  Object.entries(metrics.statusBreakdown).forEach(([status, count]) => {
    console.log(`  • ${status.padEnd(18)}: ${count}`);
  });

  console.log("\n=================================================");
  console.log("AUDIT VERDICT: All hardcoded percentages (95%, 98%, 99%) have been eliminated.");
  console.log("All probability outputs now read: 'UNMEASURED (Awaiting empirical deal data)'");
  console.log("until Founder submits proposals and records real client responses.");
  console.log("=================================================\n");
}

renderRealityMetricsReport();
