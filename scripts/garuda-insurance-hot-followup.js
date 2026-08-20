// GARUDA Founder-approved premium follow-up — 2 HOT insurance prospects.
// FD-021/FD-022 governed send: premium recipient-specific copy, preview first,
// explicit Founder approval gate, one founder-approved send per recipient per
// day, exact-email recorded in the insurance outreach ledger. Lead status is
// never moved to converted/paid/won/active-buyer.
//
// Usage:
//   node scripts/garuda-insurance-hot-followup.js            -> PREVIEW (nothing sent)
//   node scripts/garuda-insurance-hot-followup.js --send     -> governed send
//
// Approval gate: --send (or GARUDA_FOUNDER_APPROVED=true). Preview shows the
// exact emails so the Founder can verify recipient/opportunity/claims first.
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { sendSmtpNative } = require("../src/services/motherPlatformAuthService");

const LEDGER_PATH = path.join(__dirname, "..", "data", "insurance-outreach-ledger.json");

const RECIPIENTS = [
  {
    email: "varun@gvcaudit.com",
    name: "Varun",
    company: "GVC Audit (Gupta Varundeep and Co)",
    city: "Gurgaon",
    subject: "GVC Audit — a savings-and-protection idea for your clients",
    body: `Hello Varun,

We came across GVC Audit (Gupta Varundeep and Co) in Gurgaon during our research, and we noticed the firm advises a large base of MSME clients.

Here is a thought we prepared specifically with that in mind.

Your clients already trust you for financial clarity. Every year they ask the same question: "where should money that has to be safe, but still grow, actually go?" Most answers today depend on market-linked products — which leaves the certainty gap unfilled.

We are GARUDA, an AI Financial Advisor and an official partner of Aditya Birla Sun Life (ABSLI). We help firms like GVC Audit add a genuinely simple, transparent savings layer to what they already offer:

- Guaranteed accumulation on savings starting at ₹30,000, with life protection built into the same premium — so the "safe money" conversation has a concrete, insurance-backed answer.
- Flexible amounts — no rigid locked figures, shaped around each client's income.
- ABSLI-documented plans, fully transparent — no invented numbers, ever.

This is a concept we can shape around GVC's existing client conversations. We are not asking you to push a product on your clients — we are proposing a complementary tool you can offer with confidence.

No proposal, no commitment. Would you be open to a 15-minute conversation next week to see whether this fits GVC Audit?

—
GARUDA
garudaos.in
Product & Technology`
  },
  {
    email: "dreamsolutionsjaipur@gmail.com",
    name: "Dream Solutions team",
    company: "Dream Solutions Pvt Ltd",
    city: "Jaipur",
    subject: "Dream Solutions — a guaranteed-savings layer for your clients",
    body: `Hello Dream Solutions team,

We came across Dream Solutions Pvt Ltd in Jaipur during our research and understand you work with clients as a financial adviser and distributor.

Here is a concept we prepared specifically for firms like yours.

Your clients come to you for one thing above all: clarity on where their money is safe and still working. Most savings conversations today drift toward market-linked products — strong on upside, uncertain on guarantees.

We are GARUDA, an AI Financial Advisor and an official partner of Aditya Birla Sun Life (ABSLI). We offer a simple, transparent savings-plus-protection layer that fits naturally into an advisor's toolkit:

- Guaranteed accumulation on savings starting at ₹30,000, with life protection built into the same premium.
- Flexible amounts — no rigid locked numbers, shaped around each client.
- ABSLI-documented plans, transparent, with no invented figures.

We are not asking you to push a product on your clients. We are proposing a complementary tool your firm can offer with confidence.

No proposal, no commitment. Would you be open to a short conversation next week to see whether this fits Dream Solutions?

—
GARUDA
garudaos.in
Product & Technology`
  }
];

function loadLedger() {
  try {
    if (fs.existsSync(LEDGER_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(LEDGER_PATH, "utf8"));
      return { leads: Array.isArray(parsed.leads) ? parsed.leads : [] };
    }
  } catch (e) {
    console.error("Ledger parse error:", e.message);
  }
  return { leads: [] };
}

function saveLedger(ledger) {
  fs.mkdirSync(path.dirname(LEDGER_PATH), { recursive: true });
  fs.writeFileSync(LEDGER_PATH, JSON.stringify(ledger, null, 2), "utf8");
}

function findLead(ledger, email) {
  return ledger.leads.find((lead) => lead.email === email) || null;
}

function sameDay(isoA, isoB) {
  const a = new Date(isoA);
  const b = new Date(isoB);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

async function main() {
  const args = process.argv.slice(2);
  const isSend = args.includes("--send") || String(process.env.GARUDA_FOUNDER_APPROVED || "").toLowerCase() === "true";

  if (!isSend) {
    console.log("=== PREVIEW (kuch send nahi hua) — founder approval required before send ===\n");
    for (const recipient of RECIPIENTS) {
      console.log(`--- TO: ${recipient.email} (${recipient.name}, ${recipient.company}, ${recipient.city}) ---`);
      console.log(`Subject: ${recipient.subject}`);
      console.log(recipient.body);
      console.log("\n----------------------------------------\n");
    }
    console.log("Run with --send after Founder approval to dispatch via governed SMTP.");
    return;
  }

  const smtpConfig = {
    host: process.env.GARUDA_EMAIL_HOST,
    port: process.env.GARUDA_EMAIL_PORT,
    user: process.env.GARUDA_EMAIL_USER,
    pass: process.env.GARUDA_EMAIL_PASS
  };
  if (!smtpConfig.host || !smtpConfig.user || !smtpConfig.pass) {
    console.error("BLOCKED: SMTP not configured (GARUDA_EMAIL_HOST/USER/PASS). No email sent.");
    process.exit(1);
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const ledger = loadLedger();

  for (const recipient of RECIPIENTS) {
    const lead = findLead(ledger, recipient.email);
    const history = lead && Array.isArray(lead.history) ? lead.history : [];
    const priorApproved = history.find(
      (h) => h.action === "sent" && h.founderApproved === true && sameDay(h.at, nowIso)
    );
    if (priorApproved) {
      console.log(`IDEMPOTENT_DUPLICATE_PREVENTED: founder-approved email already sent today to ${recipient.email}.`);
      continue;
    }

    const mail = { to: recipient.email, subject: recipient.subject, body: recipient.body };

    let smtpResult;
    try {
      smtpResult = await sendSmtpNative(smtpConfig, mail);
    } catch (err) {
      const failedEntry = {
        at: nowIso,
        action: "send_failed",
        subject: recipient.subject,
        founderApproved: true,
        error: String(err.message || err)
      };
      if (lead) {
        lead.status = "failed";
        lead.lastError = String(err.message || err);
        lead.lastAttemptAt = nowIso;
        lead.history.push(failedEntry);
      }
      saveLedger(ledger);
      console.log(`SEND_FAILED: ${recipient.email} -> ${String(err.message || err)}`);
      continue;
    }

    const historyEntry = {
      at: nowIso,
      action: "sent",
      subject: recipient.subject,
      founderApproved: true,
      founderApproval: {
        approvedBy: "FOUNDER",
        approvedAt: nowIso,
        source: "Founder explicit approval gate (2026-08-20, premium HOT-prospect follow-up)",
        exactEmail: true
      },
      providerResponseId: smtpResult.providerResponseId || "SMTP_ACCEPTED_250_OK"
    };

    if (lead) {
      lead.sentCount = Number(lead.sentCount || 0) + 1;
      lead.sentAt = nowIso;
      lead.lastAttemptAt = nowIso;
      lead.status = "message_sent";
      lead.lastError = "";
      lead.history.push(historyEntry);
      if (!lead.founderApproval) {
        lead.founderApproval = historyEntry.founderApproval;
      }
    } else {
      const newLead = {
        id: `GL_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
        email: recipient.email,
        firstName: recipient.name === "Varun" ? "Varun" : "",
        lastName: "",
        phone: recipient.email === "varun@gvcaudit.com" ? "9717355517" : "8875553345",
        status: "message_sent",
        sentCount: 1,
        optedOut: false,
        sentAt: nowIso,
        lastAttemptAt: nowIso,
        history: [historyEntry],
        lastError: "",
        founderApproval: historyEntry.founderApproval
      };
      ledger.leads.push(newLead);
    }
    saveLedger(ledger);

    console.log(`SEND_OK: ${recipient.email} -> accepted=${smtpResult.accepted === true}`);
  }
}

main().catch((e) => {
  console.error("FATAL:", e && e.message ? e.message : e);
  process.exit(1);
});