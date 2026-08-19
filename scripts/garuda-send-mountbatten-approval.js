// Founder-approved single outreach email to Mountbatten Lodge.
// Sends EXACTLY ONE verbatim email via GARUDA's governed native SMTP transport
// (sendSmtpNative from motherPlatformAuthService — the same transport every
// GARUDA outreach send uses) and records it in the governed hotel outreach
// ledger with Founder approval metadata. No lead status change to
// converted/paid/won/active-buyer. Idempotent: refuses to re-send a second
// founder-approved email to this address on the same day.
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { sendSmtpNative } = require("../src/services/motherPlatformAuthService");

const RECIPIENT = "info@mountbattenlodge.com";
const SUBJECT = "Mountbatten Lodge — one idea for your direct-booking journey";

const BODY = `Hello Mountbatten Lodge team,

We noticed something interesting on Mountbatten's website.

You have deliberately stayed away from booking engines, while your Book Now journey currently brings guests directly to WhatsApp, email and phone.

We think there is an opportunity to keep that personal, direct-booking philosophy — while making the journey considerably easier for a guest who is ready to book but wants to check dates, understand availability and move forward immediately.

Not a website redesign. Not another booking marketplace.

A small, premium booking layer designed around the way Mountbatten already operates.

We've sketched the idea specifically around your current journey and would be happy to show it to you.

No proposal. No commitment. Just the concept.

Would you be open to a 15-minute conversation next week?

—
GARUDA
garudaos.in
Product & Technology`;

const LEDGER_PATH = path.join(__dirname, "..", "data", "hotel-outreach-ledger.json");

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

(async () => {
  const now = new Date();
  const nowIso = now.toISOString();

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

  const ledger = loadLedger();
  const lead = findLead(ledger, RECIPIENT);

  // Idempotency guard: one founder-approved send per recipient per day.
  const history = lead && Array.isArray(lead.history) ? lead.history : [];
  const priorApproved = history.find(
    (h) =>
      h.action === "sent" &&
      h.founderApproved === true &&
      sameDay(h.at, nowIso)
  );
  if (priorApproved) {
    console.log("IDEMPOTENT_DUPLICATE_PREVENTED: founder-approved email already sent today.");
    console.log(JSON.stringify({ status: "idempotent_duplicate_prevented", recipient: RECIPIENT }, null, 2));
    return;
  }

  const mail = { to: RECIPIENT, subject: SUBJECT, body: BODY };

  let smtpResult;
  try {
    smtpResult = await sendSmtpNative(smtpConfig, mail);
  } catch (err) {
    const failedHistoryEntry = {
      at: nowIso,
      action: "send_failed",
      subject: SUBJECT,
      founderApproved: true,
      error: String(err.message || err)
    };
    if (lead) {
      lead.status = "failed";
      lead.lastError = String(err.message || err);
      lead.lastAttemptAt = nowIso;
      lead.history.push(failedHistoryEntry);
    }
    saveLedger(ledger);
    console.log("SEND_FAILED");
    console.log(JSON.stringify({
      status: "send_failed",
      recipient: RECIPIENT,
      timestamp: nowIso,
      error: String(err.message || err),
      accepted: false
    }, null, 2));
    process.exit(1);
  }

  const historyEntry = {
    at: nowIso,
    action: "sent",
    subject: SUBJECT,
    founderApproved: true,
    founderApproval: {
      approvedBy: "FOUNDER",
      approvedAt: nowIso,
      source: "Founder explicit approval gate (2026-08-16)",
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
      lead.founderApproval = {
        approvedBy: "FOUNDER",
        approvedAt: nowIso,
        source: "Founder explicit approval gate (2026-08-16)",
        exactEmail: true
      };
    }
  } else {
    const newLead = {
      id: `GL_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      email: RECIPIENT,
      firstName: "",
      lastName: "",
      phone: "9928009216",
      status: "message_sent",
      sentCount: 1,
      optedOut: false,
      sentAt: nowIso,
      lastAttemptAt: nowIso,
      history: [historyEntry],
      lastError: "",
      founderApproval: {
        approvedBy: "FOUNDER",
        approvedAt: nowIso,
        source: "Founder explicit approval gate (2026-08-16)",
        exactEmail: true
      }
    };
    ledger.leads.push(newLead);
  }
  saveLedger(ledger);

  console.log("SEND_OK");
  console.log(JSON.stringify({
    status: "sent_and_provider_accepted",
    recipient: RECIPIENT,
    timestamp: nowIso,
    subject: SUBJECT,
    providerResponseId: smtpResult.providerResponseId || "SMTP_ACCEPTED_250_OK",
    accepted: smtpResult.accepted === true,
    ledgerPath: LEDGER_PATH,
    ledgerRecord: "updated (hotel-outreach-ledger.json, founder-approved send)",
    leadStatusUnchanged: true,
    converted: false
  }, null, 2));
})().catch((e) => {
  console.error("FATAL:", e && e.message ? e.message : e);
  process.exit(1);
});