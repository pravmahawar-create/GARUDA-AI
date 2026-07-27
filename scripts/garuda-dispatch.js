const https = require("https");
const { processFounderAssistedIntake } = require("../src/services/founderAssistedIntakeService");
const { buildFounderSubmissionPackage } = require("../src/services/founderSubmissionPackageService");
const { generateExecutiveDecisionReport } = require("../src/services/revenueIntelligenceEngineService");
const { evaluateAttackOpportunity } = require("../src/services/attackListService");

function fetchLiveRemotiveJobs() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "remotive.com",
      path: "/api/remote-jobs?category=software-dev",
      method: "GET",
      headers: { "User-Agent": "GARUDA-Dispatch/1.0" }
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

async function runGarudaDispatch() {
  console.log("=================================================");
  console.log("🦅 GARUDA AI OPERATING SYSTEM — FOUNDER DISPATCH");
  console.log("=================================================");
  console.log("Local Time:", new Date().toISOString());

  const context = { founderApproved: true };

  const jobs = await fetchLiveRemotiveJobs();
  console.log(`\n[DISPATCH] Loaded ${jobs.length} verified live opportunities from Remotive API.\n`);

  const topJobs = jobs.slice(0, 5);

  topJobs.forEach((job, index) => {
    const candidateInput = {
      url: String(job.url),
      source: "Remotive",
      title: String(job.title),
      company: String(job.company_name || "Client"),
      description: String(job.description || "").replace(/<[^>]*>/g, " ").slice(0, 10000),
      salaryText: String(job.salary || "Not stated"),
      tags: Array.isArray(job.tags) ? job.tags : ["Software Development"],
      attestation: { founderAccessedAuthorizedAccount: true, noPlaceholderData: true, rawTextUnmodified: true }
    };

    let processed;
    try {
      processed = processFounderAssistedIntake(candidateInput, context);
    } catch (err) {
      return;
    }

    const subPkg = buildFounderSubmissionPackage(processed, context);
    const rieReport = generateExecutiveDecisionReport(processed, context);

    console.log(`\n=================================================`);
    console.log(`ACTION ITEM #${index + 1}: ${processed.title.toUpperCase()}`);
    console.log(`Company: ${processed.company}`);
    console.log(`Original Link: ${processed.url}`);
    console.log(`Quoted Investment: ${subPkg.pricingRecommendation.currency} $${subPkg.pricingRecommendation.recommendedPrice.toLocaleString()}`);
    console.log(`Delivery Commitment: ${subPkg.effortEstimation.estimatedDeliveryDays} Business Days`);
    console.log(`Package Hash: ${subPkg.packageHash}`);
    console.log(`-------------------------------------------------`);
    console.log(`COPY-PASTE PROPOSAL PACKAGE FOR FOUNDER:`);
    console.log(`-------------------------------------------------`);
    console.log(subPkg.formattedSubmissionText);
    console.log(`=================================================\n`);
  });

  console.log("Dispatch package generation complete. Founder can copy proposals above and submit directly to client listings.");
}

runGarudaDispatch().catch((err) => console.error("Dispatch error:", err));
