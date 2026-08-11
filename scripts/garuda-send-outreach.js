// Send real outreach to seeded prospects via GARUDA generic outreach engine.
// Usage:
//   npm run leads:send -- --domain=hotel --max=3            (send up to 3)
//   npm run leads:send -- --domain=hotel --max=3 --dry-run  (preview only)
require("dotenv").config();
const fs = require("fs");
const leadGenEngine = require("../src/services/leadgen/genericLeadGenEngine");
const outreachEngine = require("../src/services/leadgen/genericOutreachEngine");

const args = process.argv.slice(2);
const domain = (args.find((a) => a.startsWith("--domain=")) || "--domain=hotel").split("=")[1];
const max = (args.find((a) => a.startsWith("--max=")) || "--max=3").split("=")[1];
const dryRun = args.includes("--dry-run");

function parseCsv(raw) {
  const lines = String(raw || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
  const rows = [];
  for (const line of lines.slice(1)) {
    const cells = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const row = {};
    header.forEach((key, i) => { row[key] = cells[i] !== undefined ? cells[i] : ""; });
    if (row.email) rows.push(row);
  }
  return rows;
}

(async () => {
  const result = leadGenEngine.generateContactsCsv({ minScore: 40, domain, dryRun: true });
  const raw = fs.existsSync(result.contactsPath) ? fs.readFileSync(result.contactsPath, "utf8") : "";
  let contacts = parseCsv(raw).slice(0, Number(max));

  if (!contacts.length) {
    console.log(`No contacts for ${domain}. Pehle 'leads:seed' ya manual add karo.`);
    return;
  }

  if (dryRun) {
    const preview = outreachEngine.previewOutreach(contacts, { domain });
    console.log(`[DRY-RUN] ${domain}: ${preview.results.length} emails previewed`);
    for (const r of preview.results) console.log(`  ${r.ok ? "OK" : "XX"} ${r.email} | ${r.reason || ""} | ${r.subject}`);
    return;
  }

  console.log(`Sending ${contacts.length} outreach emails for ${domain}...`);
  const sent = await outreachEngine.runOutreach(contacts, { domain, maxEmails: Number(max), dryRun: false });
  console.log("SENT:", (sent.sent || []).length, "| SKIPPED:", (sent.skipped || []).length);
  for (const s of sent.sent || []) console.log(`  OK ${s.email} | ${s.accepted ? "accepted" : "queued"}`);
  for (const s of sent.skipped || []) console.log(`  XX ${s.email} | ${s.reason}`);
})().catch((e) => {
  console.error("FATAL:", e && e.message ? e.message : e);
  process.exit(1);
});
