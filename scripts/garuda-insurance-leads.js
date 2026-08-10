const fs = require("fs");
const path = require("path");
require("dotenv").config();

const {
  addProspects,
  generateContactsCsv,
  getPipeline,
  listProspects,
  removeProspect,
  scoreProspect,
  setPaths
} = require("../src/services/insuranceLeadGenService");

const PROSPECTS_PATH = path.join(__dirname, "..", "data", "insurance-prospects.json");

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

function usage() {
  console.log(`
GARUDA Insurance Lead Gen — CLI

  npm run leads:add -- "businessName=Sharma Traders,city=Jaipur,phone=9829012345,email=contact@sharmatraders.in,gstin=08ABC.." 
  npm run leads:add -- "businessName=Neha Classes,city=Ajmer,email=neha@x.in,notes=\"director, mother of two kids\"" 
  npm run leads:import -- FILE.csv                -> CSV/JSON import karo
  npm run leads:score -- "businessName=...,city=..." -> sirf score dekho (kuch save nahi)
  npm run leads:generate -- --minScore 60         -> qualified leads se contacts CSV banao
  npm run leads:status                            -> pipeline summary
  npm run leads:list -- --minScore 60             -> scored leads list

Prospect fields: businessName, firstName, lastName, email, phone, city, businessType,
  industry, gstin, website, address, source, notes, query

NOTE: sirf POCHA-approved/public information use karo. Koi data source scrape mat karo.
  Yesmadigi/yaha se liya data tabhi use karo jab usse use karne ki public allow ho.
`);
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

function fillFromEnvironmentFields(prospect) {
  if (!prospect.email && prospect.gstin) {
    prospect.email = prospect.gstin.split("/")[0].toLowerCase() + "@example.in";
  }
  return prospect;
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "help";
  const rest = args.slice(1);

  if (["help", "--help", "-h"].includes(command)) return usage();

  if (command === "score") {
    const prospect = fillFromEnvironmentFields(parseInlineArgs(rest.join(",")));
    const scored = scoreProspect(prospect);
    console.log(JSON.stringify(scored, null, 2));
    return;
  }

  if (command === "add") {
    const prospect = fillFromEnvironmentFields(parseInlineArgs(rest.join(",")));
    const result = addProspects([prospect]);
    console.log(`[GARUDA] Added: ${result.added.length} | Skipped: ${result.skipped.length}`);
    for (const s of result.skipped) console.log(`  xx ${s.email || s.businessName || "(no-email)"}: ${s.reason}`);
    for (const a of result.added) {
      console.log(`  ny ${a.email} | "${a.businessName}" | score ${a.score} ${a.grade} | query ${a.query}`);
    }
    return;
  }

  if (command === "import") {
    const file = rest[0];
    if (!file || !fs.existsSync(file)) {
      console.error("[GARUDA] usage: npm run leads:import -- FILE.csv|json (koi file nahi mili)");
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
    const result = addProspects(rows);
    console.log(`[GARUDA] Imported ${rows.length} rows -> Added ${result.added.length} | Skipped ${result.skipped.length}`);
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
    const result = generateContactsCsv({ minScore, dryRun });
    console.log(`[GARUDA] ${dryRun ? "DRY-RUN:" : "Generated:"} ${result.generated} rows (candidates: ${result.candidates})`);
    if (result.rows.length) {
      console.log(`  File: ${result.contactsPath}`);
      console.log(`  Query distribution:`);
      const byQuery = {};
      for (const r of result.rows) byQuery[r.query] = (byQuery[r.query] || 0) + 1;
      for (const [q, n] of Object.entries(byQuery)) console.log(`    ${q}: ${n}`);
    }
    if (!result.rows.length) console.log(`  NOTE: koi candidate nahi mila. Pehle leads:add ya leads:import se prospects daalo.`);
    return;
  }

  if (command === "status") {
    console.log("[GARUDA] Pipeline:", JSON.stringify(getPipeline(), null, 2));
    return;
  }

  if (command === "list") {
    const minScoreArg = rest.find((a) => a.startsWith("--minScore"));
    const queryArg = rest.find((a) => a.startsWith("--query"));
    const minScore = minScoreArg ? Number(minScoreArg.split("=")[1] || 0) : 0;
    const query = queryArg ? queryArg.split("=")[1] : "";
    const list = listProspects({ minScore, query });
    console.log(`[GARUDA] Prospects (score>=${minScore}${query ? `, query=${query}` : ""}): ${list.length}`);
    for (const p of list) {
      console.log(`  ${p.score} ${p.grade} | ${p.email} | ${p.businessName || p.firstName} | ${p.query}`);
    }
    return;
  }

  if (command === "remove") {
    const email = (rest[0] || "").replace(/^--/, "") || (rest[1] || "");
    if (!email) {
      console.error("[GARUDA] usage: npm run leads:remove -- EMAIL");
      process.exit(1);
    }
    const result = removeProspect(email);
    console.log(`[GARUDA] Removed: ${result.removed}`);
    return;
  }

  usage();
}

main().catch((error) => {
  console.error("[GARUDA] FATAL:", error.message);
  process.exit(1);
});