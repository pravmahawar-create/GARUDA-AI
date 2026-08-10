const fs = require("fs");
const path = require("path");
require("dotenv").config();

const { runOutreach, getSummary, getSmtpConfig } = require("../src/services/insuranceOutreachService");
const { generateContactsCsv, getPipeline } = require("../src/services/insuranceLeadGenService");

const CONTACTS_PATH = path.join(__dirname, "..", "data", "insurance-contacts.csv");
const LOG_DIR = path.join(__dirname, "..", "reports");
const LOG_FILE = path.join(LOG_DIR, "insurance-scheduler.log");

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
      row[key] = cells[index] !== undefined ? cells[index] : "";
    });
    rows.push(row);
  }
  return rows;
}

function log(line) {
  const ts = new Date().toISOString();
  const entry = `[${ts}] ${line}`;
  console.log(entry);
  fs.mkdirSync(LOG_DIR, { recursive: true });
  fs.appendFileSync(LOG_FILE, entry + "\n", "utf8");
}

async function main() {
  let contacts = fs.existsSync(CONTACTS_PATH) ? parseCsv(fs.readFileSync(CONTACTS_PATH, "utf8")) : [];

  if (!contacts.length) {
    log("[SCHEDULER] contacts khaali ya file nahi. LeadGen auto-generate try kar raha hoon (minScore>=40)...");
    try {
      const gen = generateContactsCsv({ minScore: 40 });
      if (gen.generated > 0) {
        log(`[SCHEDULER] LeadGen: ${gen.generated} contacts auto-generated (${gen.contactsPath}).`);
        contacts = parseCsv(fs.readFileSync(CONTACTS_PATH, "utf8"));
      } else {
        const pipeline = getPipeline();
        log(`[SCHEDULER] LeadGen: koi qualified prospect nahi (${pipeline.scored} scored). Add karo: npm run leads:add`);
        return;
      }
    } catch (error) {
      log(`[SCHEDULER] LeadGen auto-generate failed: ${error.message}`);
      return;
    }
  }

  const smtp = getSmtpConfig();
  if (!smtp.ready) {
    log("[SCHEDULER] SMTP configured nahi hai (GARUDA_EMAIL_* env missing). Skip — sirf preview possible.");
    return;
  }

  log(`[SCHEDULER] run start — ${contacts.length} contacts in file.`);

  const result = await runOutreach(contacts, { maxEmails: contacts.length });
  for (const item of result.sent) {
    log(`  SENT   ${item.email} ${item.dryRun ? "(prepared)" : "(sent)"}`);
  }
  for (const item of result.skipped) {
    log(`  SKIP   ${item.email}: ${item.reason}`);
  }

  const summary = getSummary();
  log(
    `[SCHEDULER] done — total:${summary.total} sent:${summary.sent} optedOut:${summary.optedOut} ` +
      JSON.stringify(summary.byStatus)
  );
}

main().catch((error) => {
  console.error("[SCHEDULER] FATAL:", error.message);
  process.exit(1);
});
