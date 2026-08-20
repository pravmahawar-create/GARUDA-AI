// GARUDA GENERIC LEAD GEN CLI (multi-domain).
// FD-107: same commands as insurance lead-gen, but with --domain flag so ANY
// configured industry can run. Insurance remains the default domain and its
// data namespace is untouched.
//
//   node scripts/garuda-leads.js --domain insurance status
//   node scripts/garuda-leads.js --domain <newDomain> add "businessName=..."
//   node scripts/garuda-leads.js --domain <newDomain> generate --minScore 60

const fs = require("fs");
const path = require("path");
require("dotenv").config();

const { getDomain, listDomains } = require("../src/services/leadgen/domainConfig");
const {
  addProspects,
  generateContactsCsv,
  getPipeline,
  getProspects,
  listProspects,
  mongoReady,
  mongoStorageEnabled,
  scoreProspect
} = require("../src/services/leadgen/genericLeadGenEngine");

function parseDomainArgs(args) {
  const domainIdx = args.indexOf("--domain");
  const domain = domainIdx !== -1 ? args[domainIdx + 1] : "insurance";
  return domain;
}

function parseCsvToProspects(raw) {
  const lines = String(raw || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return [];
  const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
  const rows = [];
  for (const line of lines.slice(1)) {
    const cells = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const row = {};
    header.forEach((key, index) => {
      row[key] = cells[index] !== undefined ? cells[index] : "";
    });
    rows.push(row);
  }
  return rows;
}

function parseInlineArgs(arg) {
  const obj = {};
  const parts = String(arg || "").match(/("[^"]*"|[^,]+)/g) || [];
  parts.forEach((part) => {
    const pair = part.trim();
    const eq = pair.indexOf("=");
    if (eq === -1) return;
    const key = pair.slice(0, eq).trim();
    let value = pair.slice(eq + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (key) obj[key] = value;
  });
  return obj;
}

function usage() {
  const domains = listDomains().map((d) => `${d.id} (${d.label})`).join(", ");
  console.log(`
GARUDA Generic Lead Gen — CLI (multi-domain)

  --domain DOMAIN      jis domain par command chalani hai (default: insurance)
                      configured domains: ${domains}

  npm run leads:g -- --domain insurance add "businessName=...,city=...,email=..."
  npm run leads:g -- --domain insurance import -- FILE.csv
  npm run leads:g -- --domain insurance score -- "businessName=...,city=..."
  npm run leads:g -- --domain insurance generate -- --minScore 60 --dry-run
  npm run leads:g -- --domain insurance status
  npm run leads:g -- --domain insurance list -- --minScore 40 --query savings_investment

New industry? Sirf src/services/leadgen/domainConfig.js me ek naya domain config
add karo (topics, segments, hooks, brand lines) — engine automatically baaki sab
sambhal leta hai. Har domain ki apni data namespace hoti hai (data/<domain>-*).
`);
}

function fillFromEnvironmentFields(prospect) {
  if (!prospect.email && prospect.gstin) {
    prospect.email = prospect.gstin.split("/")[0].toLowerCase() + "@example.in";
  }
  return prospect;
}

async function main() {
  const args = process.argv.slice(2);
  const domain = parseDomainArgs(args);
  const rest = args.filter((a) => a !== "--domain" && a !== domain);
  const command = rest[0] || "help";

  if (["help", "--help", "-h"].includes(command)) return usage();

  // Mongo storage mode needs a live connection before the engine can route
  // reads/writes to the Prospect model. Fails soft: engine falls back to JSON.
  if (mongoStorageEnabled()) {
    const connectDB = require("../src/database/db");
    await connectDB();
  }

  const withDomain = { domain };

  if (command === "score") {
    const prospect = fillFromEnvironmentFields(parseInlineArgs(rest.slice(1).join(",")));
    const scored = scoreProspect(prospect, getDomain(domain));
    console.log(JSON.stringify(scored, null, 2));
    return;
  }

  if (command === "add") {
    const prospect = fillFromEnvironmentFields(parseInlineArgs(rest.slice(1).join(",")));
    const result = await addProspects([prospect], withDomain);
    console.log(`[GARUDA:${domain}] Added: ${result.added.length} | Skipped: ${result.skipped.length}${result.store === "mongo" ? " (mongo)" : ""}`);
    for (const s of result.skipped) console.log(`  xx ${s.email || s.businessName || "(no-email)"}: ${s.reason}`);
    for (const a of result.added) {
      console.log(`  ny ${a.email} | "${a.businessName}" | score ${a.score} ${a.grade} | query ${a.query}`);
    }
    return;
  }

  if (command === "import") {
    const file = rest.find((a) => !a.startsWith("--"));
    if (!file || !fs.existsSync(file)) {
      console.error(`[GARUDA:${domain}] usage: leads:g import -- FILE.csv|json (koi file nahi mili)`);
      process.exit(1);
    }
    const raw = fs.readFileSync(file, "utf8");
    let rows;
    if (/\.json$/i.test(file)) {
      const parsed = JSON.parse(raw);
      rows = Array.isArray(parsed) ? parsed : parsed.prospects || [];
    } else {
      rows = parseCsvToProspects(raw);
    }
    rows = rows.map(fillFromEnvironmentFields);
    const result = await addProspects(rows, withDomain);
    console.log(`[GARUDA:${domain}] Imported ${rows.length} rows -> Added ${result.added.length} | Skipped ${result.skipped.length}${result.store === "mongo" ? " (mongo)" : ""}`);
    for (const s of result.skipped.slice(0, 10)) console.log(`  xx ${s.email || s.businessName || "(no-email)"}: ${s.reason}`);
    for (const a of result.added.slice(0, 10)) {
      console.log(`  ny ${a.email} | "${a.businessName}" | score ${a.score} ${a.grade} | query ${a.query}`);
    }
    return;
  }

  if (command === "generate") {
    const minScoreArg = rest.find((a) => a.startsWith("--minScore"));
    const dryRun = rest.includes("--dry-run");
    const minScore = minScoreArg ? Number(minScoreArg.split("=")[1] || 60) : 40;
    const result = generateContactsCsv({ minScore, dryRun, domain });
    console.log(`[GARUDA:${domain}] ${dryRun ? "DRY-RUN:" : "Generated:"} ${result.generated} rows (candidates: ${result.candidates})`);
    if (result.rows.length) {
      console.log(`  File: ${result.contactsPath}`);
      const byQuery = {};
      for (const r of result.rows) byQuery[r.query] = (byQuery[r.query] || 0) + 1;
      for (const [q, n] of Object.entries(byQuery)) console.log(`    ${q}: ${n}`);
    }
    if (!result.rows.length) console.log(`  NOTE: koi candidate nahi mila. Pehle add/import se prospects daalo.`);
    return;
  }

  if (command === "status") {
    if (mongoReady()) {
      const list = await getProspects(domain);
      const byGrade = {};
      const byQuery = {};
      for (const p of list) {
        byGrade[p.grade] = (byGrade[p.grade] || 0) + 1;
        byQuery[p.query] = (byQuery[p.query] || 0) + 1;
      }
      console.log(`[GARUDA:${domain}] Pipeline (mongo):`, JSON.stringify({ total: list.length, hot: byGrade.HOT || 0, strong: byGrade.STRONG || 0, byGrade, byQuery, domain }, null, 2));
      return;
    }
    console.log(`[GARUDA:${domain}] Pipeline:`, JSON.stringify(getPipeline(withDomain), null, 2));
    return;
  }

  if (command === "list") {
    const minScoreArg = rest.find((a) => a.startsWith("--minScore"));
    const queryArg = rest.find((a) => a.startsWith("--query"));
    const minScore = minScoreArg ? Number(minScoreArg.split("=")[1] || 0) : 0;
    const query = queryArg ? queryArg.split("=")[1] : "";
    const list = mongoReady() ? await getProspects(domain, { minScore, query }) : listProspects({ minScore, query, domain });
    console.log(`[GARUDA:${domain}] Prospects (score>=${minScore}${query ? `, query=${query}` : ""}): ${list.length}`);
    for (const p of list) {
      console.log(`  ${p.score} ${p.grade} | ${p.email} | ${p.businessName || p.firstName} | ${p.query}`);
    }
    return;
  }

  usage();
}

main()
  .then(async () => {
    if (mongoStorageEnabled()) {
      const mongoose = require("mongoose");
      if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    }
  })
  .catch((error) => {
    console.error("[GARUDA] FATAL:", error.message);
    process.exit(1);
  });
