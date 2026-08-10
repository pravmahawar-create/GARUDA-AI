const fs = require("fs");
const path = require("path");
require("dotenv").config();

const { previewOutreach, runOutreach, getSummary, optOutLead } = require("../src/services/insuranceOutreachService");

const CONTACTS_PATH = path.join(__dirname, "..", "data", "insurance-contacts.csv");

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

function loadContacts() {
  if (!fs.existsSync(CONTACTS_PATH)) {
    console.error(`[GARUDA] contacts file nahi mili: ${CONTACTS_PATH}`);
    console.error(`[GARUDA] Format: email,firstName,lastName,phone,query`);
    console.error(`[GARUDA] Pehle create karo, phir `);
    process.exit(1);
  }
  const raw = fs.readFileSync(CONTACTS_PATH, "utf8");
  return parseCsv(raw);
}

function usage() {
  console.log(`
GARUDA ABSLI Outreach — CLI

  npm run insurance:preview           -> 5-10 line pitch preview (kuch bhi send nahi hoga)
  npm run insurance:send -- --limit 5 -> pehle 5 eligible contacts ko email send
  npm run insurance:send -- --all     -> saare eligible contacts ko email send
  npm run insurance:optout -- EMAIL   -> kisi email ko permanently opt-out
  npm run insurance:status            -> outreach summary

Contacts file: data/insurance-contacts.csv
Format (header line zaroori):
  email,firstName,lastName,phone,query
`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "help";

  if (command === "help" || command === "--help" || command === "-h") {
    usage();
    return;
  }

  if (command === "status") {
    console.log("[GARUDA] Outreach summary:", JSON.stringify(getSummary(), null, 2));
    return;
  }

  if (command === "optout") {
    const email = args[1];
    if (!email) {
      console.error("[GARUDA] usage: npm run insurance:optout -- EMAIL");
      process.exit(1);
    }
    const result = optOutLead(email);
    console.log("[GARUDA] opt-out:", JSON.stringify(result));
    return;
  }

  if (command === "preview" || command === "send") {
    const contacts = loadContacts();
    if (!contacts.length) {
      console.error("[GARUDA] contacts file khali hai ya format sahi nahi.");
      process.exit(1);
    }

    if (command === "preview") {
      const preview = previewOutreach(contacts);
      console.log(`[GARUDA] Generated ${preview.generated} pitches (dry-run, kuch send nahi hua).`);
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

    const limitArg = args.find((a) => a.startsWith("--limit"));
    const allArg = args.includes("--all");
    const dryRun = args.includes("--dry-run");
    const maxEmails = allArg ? contacts.length : limitArg ? Number(limitArg.split("=")[1] || 5) : 5;

    if (dryRun) {
      const preview = previewOutreach(contacts.slice(0, maxEmails));
      console.log(`[GARUDA] DRY-RUN: ${preview.results.length} prepared (kuch send nahi hua).`);
      for (const result of preview.results) {
        if (result.ok) console.log(`  -> ${result.email} [${result.subject}]`);
        else console.log(`  xx ${result.email} [${result.reason}]`);
      }
      return;
    }

    console.log(`[GARUDA] Sending to max ${maxEmails} contacts...`);
    const result = await runOutreach(contacts, { maxEmails });
    console.log(`[GARUDA] Sent: ${result.sent.length}`);
    for (const item of result.sent) {
      console.log(`  -> ${item.email} ${item.dryRun ? "(prepared)" : "(sent)"}`);
    }
    if (result.skipped.length) {
      console.log(`[GARUDA] Skipped: ${result.skipped.length}`);
      for (const item of result.skipped) console.log(`  xx ${item.email}: ${item.reason}`);
    }
    console.log(`[GARUDA] Ledger: ${result.ledgerPath}`);
    return;
  }

  usage();
}

main().catch((error) => {
  console.error("[GARUDA] FATAL:", error.message);
  process.exit(1);
});
