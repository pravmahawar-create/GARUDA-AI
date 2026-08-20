// GARUDA Tutoring Lead Import
// Usage: node scripts/garuda-tutoring-import.js <file.json|csv>
//   JSON: [{ "businessName": "...", "email": "...", "city": "...", "website": "...", "locale": "en", "country": "US" }]
//   CSV : businessName,email,city,website,locale,country
// Adds scored prospects into the tutoring domain pipeline (data/tutoring-prospects.json).
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { addProspects, getPipeline } = require("../src/services/leadgen/genericLeadGenEngine");

function parseCsv(file) {
  const raw = fs.readFileSync(file, "utf8");
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
  const rows = [];
  for (const line of lines.slice(1)) {
    const cells = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const row = {};
    header.forEach((key, index) => { row[key] = cells[index] !== undefined ? cells[index] : ""; });
    if (row.email) rows.push(row);
  }
  return rows;
}

function loadRows(file) {
  if (/\.json$/i.test(file)) {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  }
  return parseCsv(file);
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node scripts/garuda-tutoring-import.js <file.json|csv>");
    process.exit(1);
  }
  if (!fs.existsSync(file)) {
    console.error(`File not found: ${file}`);
    process.exit(1);
  }
  const rows = loadRows(file);
  if (!rows.length) {
    console.error("No rows with email found.");
    process.exit(1);
  }
  const mapped = rows.map((r) => ({
    businessName: r.businessName || r.name || "",
    website: r.website || r.url || "",
    email: r.email,
    city: r.city || "",
    locale: r.locale || "en",
    country: r.country || (/(dubai|uae|emirates)/i.test(r.city || "") ? "AE" : "US"),
    notes: r.notes || "Founder-imported tutoring lead",
    source: "founder_import"
  }));
  const result = await addProspects(mapped, { domain: "tutoring", minScore: 0 });
  const pipeline = getPipeline({ domain: "tutoring" });
  console.log(JSON.stringify({
    added: result.added.length,
    skipped: result.skipped.map((s) => s.reason),
    total: result.total,
    pipeline
  }, null, 2));
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
