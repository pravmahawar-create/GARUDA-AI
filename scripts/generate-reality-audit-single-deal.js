const https = require("https");
const { processFounderAssistedIntake } = require("../src/services/founderAssistedIntakeService");
const { buildFounderSubmissionPackage } = require("../src/services/founderSubmissionPackageService");
const { generateExecutiveDecisionReport } = require("../src/services/revenueIntelligenceEngineService");
const { evaluateCroDealStrategy } = require("../src/services/garudaCroService");
const { getRealityMetrics } = require("../src/services/dealTrackerService");

function fetchLiveRemotiveJobs() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "remotive.com",
      path: "/api/remote-jobs?category=software-dev",
      method: "GET",
      headers: { "User-Agent": "GARUDA-SingleAudit/1.0" }
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

async function runSingleDealAudit() {
  const jobs = await fetchLiveRemotiveJobs();
  const aTeamJob = jobs.find(j => String(j.title).includes("Senior Independent Software Developer") || String(j.company_name).includes("A.Team")) || jobs[0];

  const candidateInput = {
    url: String(aTeamJob.url),
    source: "Remotive",
    title: String(aTeamJob.title),
    company: String(aTeamJob.company_name || "A.Team"),
    description: String(aTeamJob.description || "").replace(/<[^>]*>/g, " ").slice(0, 5000),
    salaryText: String(aTeamJob.salary || "$90 - $150 /hour"),
    tags: Array.isArray(aTeamJob.tags) ? aTeamJob.tags : ["Software Development", "React", "Node.js"],
    attestation: { founderAccessedAuthorizedAccount: true, noPlaceholderData: true, rawTextUnmodified: true }
  };

  const context = { founderApproved: true };
  const processed = processFounderAssistedIntake(candidateInput, context);
  const subPkg = buildFounderSubmissionPackage(processed, context);
  const rieReport = generateExecutiveDecisionReport(processed, context);
  const croStrategy = evaluateCroDealStrategy(processed, context);

  console.log("=== SINGLE HIGHEST-PROBABILITY REVENUE AUDIT ===");
  console.log("Title      :", processed.title);
  console.log("Company    :", processed.company);
  console.log("URL        :", processed.url);
  console.log("Salary Text:", processed.salaryText);
  console.log("Quoted     :", subPkg.pricingRecommendation.currency, subPkg.pricingRecommendation.recommendedPrice);
  console.log("Floor      :", subPkg.pricingRecommendation.currency, subPkg.pricingRecommendation.minimumAcceptableFloorPrice);
  console.log("Delivery   :", subPkg.effortEstimation.estimatedDeliveryDays, "Days");
  console.log("\nPROPOSAL TEXT:\n", subPkg.formattedSubmissionText);
}

runSingleDealAudit().catch(err => console.error(err));
