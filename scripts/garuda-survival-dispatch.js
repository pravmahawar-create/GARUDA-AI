const fs = require("fs");
const path = require("path");
require("dotenv").config();

const { fetchRemotiveJobsLive, normalizeListedItem } = require("../src/services/scoutPlatforms");
const { getRegistrySummary, listCapabilities, getGarudaIdentityStatement } = require("../src/services/capabilityRegistryService");
const { buildProposalForOpportunity } = require("../src/services/scoutProposals");
const { matchDemandUniversal } = require("../src/services/capabilityRegistryService");

const REPORT_DIR = path.join(__dirname, "..", "reports");
const DISPATCH_LOG = path.join(REPORT_DIR, "survival-dispatch.log");

function log(line) {
  const entry = `[${new Date().toISOString()}] ${line}`;
  console.log(entry);
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.appendFileSync(DISPATCH_LOG, entry + "\n", "utf8");
}

function capMatchScore(raw, capabilities) {
  const text = `${raw.title || ""} ${String(raw.notes || raw.description || "")} ${String(raw.budgetText || "")}`.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const cap of capabilities) {
    let score = 0;
    for (const tag of cap.tags) {
      const hay = text.match(new RegExp(tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
      if (hay) score += 15;
    }
    const words = cap.name.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (word.length > 3 && text.includes(word)) score += 10;
    }
    if (score > bestScore) {
      bestScore = score;
      best = cap;
    }
  }
  return { score: Math.min(99, bestScore), capability: best };
}

function isEngineeringFit(raw) {
  const text = `${raw.title || ""} ${String(raw.notes || "")}`.toLowerCase();
  const engineeringSignals = ["software", "developer", "api", "node", "javascript", "python", "react", "full-stack", "web", "backend", "frontend", "automation", "script", "database", "integration", "testing", "qa", "cloud", "data analysis", "excel", "research", "content", "writer", "copywriter", "translator", "designer"];
  return engineeringSignals.some((signal) => text.includes(signal));
}

function buildApplyPackage(opportunity, registrySummary) {
  const proposal = buildProposalForOpportunity(opportunity);
  const capName = opportunity.capabilityMatch?.name || opportunity.capability?.name || "defined deliverable";
  return {
    job: opportunity.title,
    company: opportunity.client || "Client",
    url: opportunity.url || "",
    budget: opportunity.budgetText || opportunity.salaryText || "market rate",
    bestCapability: capName,
    matchScore: opportunity.matchScore || 0,
    proposedFee: opportunity.expectedFee || "to be quoted after scope check",
    proposal: proposal?.proposal || "(proposal draft needs scope details)",
    nextAction: "OPEN URL > COPY PROPOSAL > SUBMIT VIA OFFICIAL ACCOUNT > RECORD IN GARUDA"
  };
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || "dispatch";
  const registrySummary = getRegistrySummary();
  const capabilities = listCapabilities({}, { rootDir: path.join(__dirname, "..") });

  log(`GARUDA Survival Dispatch — regime check`);
  log(`Capability registry: ${registrySummary.total} capabilities / ${registrySummary.verified} verified / universes: ${registrySummary.universes.length}`);

  if (mode === "registry") {
    console.log(JSON.stringify(registrySummary, null, 2));
    return;
  }

  let jobs;
  try {
    jobs = await fetchRemotiveJobsLive(250);
    log(`Remotive live: ${jobs.length} raw listings fetched.`);
  } catch (error) {
    log(`Remotive fetch failed: ${error.message}`);
    jobs = [];
  }

  const opportunities = jobs.map((job) => {
    const item = normalizeListedItem({
      platform: "remotive",
      source: "remotive_public_api",
      title: job.title,
      client: job.company_name,
      url: job.url,
      budgetText: job.salary,
      deadlineText: "flexible",
      notes: `${job.job_type || ""} ${(job.tags || []).join(" ")}`
    });
    const cap = capMatchScore(item, capabilities);
    const engineering = isEngineeringFit(item);
    const expectedFee = job.salary ? extractUsd(job.salary) : null;
    return {
      ...item,
      matchScore: cap.score,
      capabilityMatch: cap.capability,
      engineeringFit: engineering,
      expectedFee,
      salaryText: job.salary || ""
    };
  });

  const qualified = opportunities
    .filter((o) => o.title && (o.matchScore >= 30 || o.engineeringFit))
    .map((o, idx) => ({
      ...o,
      rank: idx + 1,
      package: buildApplyPackage(o, registrySummary)
    }))
    .sort((a, b) => (b.expectedFee || 0) - (a.expectedFee || 0))
    .slice(0, 30);

  log(`Qualified targets: ${qualified.length} (score>=30 or engineering-tagged).`);

  const report = {
    generatedAt: new Date().toISOString(),
    registry: registrySummary,
    summary: {
      fetched: jobs.length,
      qualified: qualified.length,
      totalPipelineEstimateUSD: qualified.reduce((sum, o) => sum + (o.expectedFee || 0), 0)
    },
    identity: getGarudaIdentityStatement(),
    targets: qualified
  };

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const outFile = path.join(REPORT_DIR, `survival-dispatch-${new Date().toISOString().split("T")[0]}.json`);
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2), "utf8");

  console.log("\n=== GARUDA SURVIVAL DISPATCH ===");
  console.log(`Report: ${outFile}`);
  console.log(JSON.stringify(report.summary, null, 2));
  console.log("\n=== TOP TARGETS (apply-ready) ===\n");
  for (const t of qualified.slice(0, 10)) {
    console.log(`#${t.rank} ${t.title}`);
    console.log(`   company: ${t.client || "n/a"} | budget: ${t.budgetText || "market rate"} | match: ${t.matchScore}/99 | cap: ${t.package?.bestCapability || t.capabilityMatch?.name || "n/a"}`);
    console.log(`   url: ${t.url}`);
  }
  console.log("\n=== IDENTITY (paste-protection) ===");
  console.log(report.identity);
}

function extractUsd(salary) {
  const text = String(salary || "").replace(/,/g, "");
  const ranges = text.match(/\$[\d.]+[kKmM]?/gi) || [];
  if (!ranges.length) return 0;
  const parsed = ranges.map((token) => {
    const t = token.replace(/[$]/g, "").toLowerCase();
    let n = Number(t.replace(/[km]/g, ""));
    if (/k/.test(t)) n *= 1000;
    if (/m/.test(t)) n *= 1e6;
    return n || 0;
  });
  const low = parsed[0];
  const high = parsed.length > 1 ? parsed[parsed.length - 1] : low;
  return Math.round((low + high) / 2) || low;
}

main().catch((error) => {
  log(`FATAL: ${error.message}`);
  process.exit(1);
});