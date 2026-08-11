// GARUDA GENERIC OUTREACH CLI (multi-domain).
// FD-107: same commands as insurance outreach, but --domain flag so ANY
// configured industry can run outreach against its own ledger/contacts.
//
//   npm run leads:g:outreach -- --domain insurance status
//   npm run leads:g:outreach -- --domain <newDomain> preview
//   npm run leads:g:outreach -- --domain <newDomain> send -- --limit 5

const fs = require("fs");
const path = require("path");
require("dotenv").config();

const { getDomain } = require("../src/services/leadgen/domainConfig");
const { previewOutreach, runOutreach, getSummary, optOutLead } = require("../src/services/leadgen/genericOutreachEngine");

function parseDomain(args) {
  const idx = args.indexOf("--domain");
  return idx !== -1 ? args[idx + 1] : "insurance";
}

function contactsPathFor(domain) {
  return path.join(__dirname, "..", "data", `${domain}-contacts.csv`);
}

function normalizeHeaderKey(key) {
  const lower = key.toLowerCase();
  const camelMap = {
    firstname: "firstName",
    lastname: "lastName",
    email: "email",
    phone: "phone",
    query: "query",
    topic: "topic"
  };
  if (camelMap[lower]) return camelMap[lower];
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function parseCsv(raw) {
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
      row[normalizeHeaderKey(key)] = cells[index] !== undefined ? cells[index] : "";
    });
    rows.push(row);
  }
  return rows;
}

function loadContacts(domain) {
  const file = contactsPathFor(domain);
  if (!fs.existsSync(file)) {
    console.error(`[GARUDA:${domain}] contacts file nahi mili: ${file}`);
    console.error(`[GARUDA:${domain}] Format: email,firstName,lastName,phone,query`);
    process.exit(1);
  }
  return parseCsv(fs.readFileSync(file, "utf8"));
}

function usage() {
  console.log(`
GARUDA Generic Outreach — CLI (multi-domain)

  npm run leads:g:outreach -- --domain insurance status
  npm run leads:g:outreach -- --domain <newDomain> preview
  npm run leads:g:outreach -- --domain <newDomain> send -- --limit 5
  npm run leads:g:outreach -- --domain <newDomain> send -- --all --dry-run
  npm run leads:g:outreach -- --domain <newDomain> optout -- EMAIL

Contacts file: data/<domain>-contacts.csv  (pehle leads:g generate se banao)
`);
}

async function main() {
  const args = process.argv.slice(2);
  const domain = parseDomain(args);
  getDomain(domain);
  const rest = args.filter((a) => a !== "--domain" && a !== domain);
  const command = rest[0] || "help";
  const opts = { domain };

  if (command === "help" || command === "--help" || command === "-h") {
    usage();
    return;
  }

  if (command === "status") {
    console.log(`[GARUDA:${domain}] Outreach summary:`, JSON.stringify(getSummary(opts), null, 2));
    return;
  }

  if (command === "optout") {
    const email = rest[1];
    if (!email) {
      console.error(`[GARUDA:${domain}] usage: optout -- EMAIL`);
      process.exit(1);
    }
    console.log(`[GARUDA:${domain}] opt-out:`, JSON.stringify(optOutLead(email, opts)));
    return;
  }

  if (command === "preview" || command === "send") {
    const contacts = loadContacts(domain);
    if (!contacts.length) {
      console.error(`[GARUDA:${domain}] contacts file khali hai ya format sahi nahi.`);
      process.exit(1);
    }

    if (command === "preview") {
      const preview = previewOutreach(contacts, opts);
      console.log(`[GARUDA:${domain}] Generated ${preview.generated} pitches (dry-run, kuch send nahi hua).`);
      for (const result of preview.results) {
        if (!result.ok) {
          console.log(`\n--- SKIPPED ${result.email}: ${result.reason} ---`);
          continue;
        }
        console.log(`\n--- TO: ${result.email} (${result.firstName || "no-name"}) ---`);
        console.log(`Subject: ${result.subject}`);
        console.log(result.body);
      }
      return;
    }

    const limitArg = rest.find((a) => a.startsWith("--limit"));
    const allArg = rest.includes("--all");
    const dryRun = rest.includes("--dry-run");
    const maxEmails = allArg ? contacts.length : limitArg ? Number(limitArg.split("=")[1] || 5) : 5;

    if (dryRun) {
      const preview = previewOutreach(contacts.slice(0, maxEmails), opts);
      console.log(`[GARUDA:${domain}] DRY-RUN: ${preview.results.length} prepared (kuch send nahi hua).`);
      for (const result of preview.results) {
        if (result.ok) console.log(`  -> ${result.email} [${result.subject}]`);
        else console.log(`  xx ${result.email} [${result.reason}]`);
      }
      return;
    }

    console.log(`[GARUDA:${domain}] Sending to max ${maxEmails} contacts...`);
    const result = await runOutreach(contacts, { maxEmails, domain });
    console.log(`[GARUDA:${domain}] Sent: ${result.sent.length}`);
    for (const item of result.sent) {
      console.log(`  -> ${item.email} ${item.dryRun ? "(prepared)" : "(sent)"}`);
    }
    if (result.skipped.length) {
      console.log(`[GARUDA:${domain}] Skipped: ${result.skipped.length}`);
      for (const item of result.skipped) console.log(`  xx ${item.email}: ${item.reason}`);
    }
    console.log(`[GARUDA:${domain}] Ledger: ${result.ledgerPath}`);
    return;
  }

  usage();
}

main().catch((error) => {
  console.error("[GARUDA] FATAL:", error.message);
  process.exit(1);
});
