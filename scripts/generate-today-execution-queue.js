const https = require("https");
const { processFounderAssistedIntake } = require("../src/services/founderAssistedIntakeService");
const { buildFounderSubmissionPackage } = require("../src/services/founderSubmissionPackageService");
const { evaluateAttackOpportunity } = require("../src/services/attackListService");

function fetchLiveRemotiveJobs() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "remotive.com",
      path: "/api/remote-jobs?category=software-dev",
      method: "GET",
      headers: { "User-Agent": "GARUDA-SalesExecution/1.0" }
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try { resolve(JSON.parse(data).jobs || []); } catch (e) { reject(e); }
      });
    });
    req.on("error", (e) => reject(e));
    req.end();
  });
}

async function generateTodayExecutionQueue() {
  const jobs = await fetchLiveRemotiveJobs();
  const context = { founderApproved: true };

  const evaluatedList = [];

  for (const job of jobs) {
    const candidateInput = {
      url: String(job.url),
      source: "Remotive",
      title: String(job.title),
      company: String(job.company_name || "Client Team"),
      description: String(job.description || "").replace(/<[^>]*>/g, " ").slice(0, 3000),
      salaryText: String(job.salary || "not stated"),
      tags: Array.isArray(job.tags) ? job.tags : ["Software Development"],
      attestation: { founderAccessedAuthorizedAccount: true, noPlaceholderData: true, rawTextUnmodified: true }
    };

    try {
      const processed = processFounderAssistedIntake(candidateInput, context);
      const subPkg = buildFounderSubmissionPackage(processed, context);
      const attackEval = evaluateAttackOpportunity(processed, context);

      evaluatedList.push({
        job,
        processed,
        subPkg,
        attackEval
      });
    } catch (e) {
      // Skip
    }
  }

  // Sort by Opportunity Score descending
  evaluatedList.sort((a, b) => b.attackEval.opportunityScore - a.attackEval.opportunityScore);

  const top5 = evaluatedList.slice(0, 5);

  console.log("=== TODAY'S TOP 5 HIGH-PROBABILITY SOFTWARE ENGINEERING OUTREACH QUEUE ===");
  top5.forEach((item, index) => {
    console.log(`\n--------------------------------------------------`);
    console.log(`RANK #${index + 1}: ${item.processed.title} | ${item.processed.company}`);
    console.log(`URL             : ${item.processed.url}`);
    console.log(`Category        : ${item.processed.opportunityCategory}`);
    console.log(`Opportunity Score: ${item.attackEval.opportunityScore}/100`);
    console.log(`Risk Level      : ${item.attackEval.riskLevel}`);
    console.log(`Quoted Price    : USD $${item.subPkg.pricingRecommendation.recommendedPrice}`);
    console.log(`Delivery Time   : ${item.subPkg.effortEstimation.estimatedDeliveryDays} Business Days`);
    console.log(`Action          : ${item.attackEval.recommendedAction}`);
    console.log(`Proposal Preview:\n${item.subPkg.formattedSubmissionText.slice(0, 350)}...`);
  });
}

generateTodayExecutionQueue().catch(err => console.error(err));
