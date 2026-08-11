// GARUDA GENERIC OUTREACH ENGINE (multi-domain).
// FD-107: per-domain ledger + SMTP dispatch, config-driven pitch assembly.
// Mirrors insuranceOutreachService but namespaces by domain so ANY industry
// gets its own ledger (<domain>-outreach-ledger.json) and can send its own
// outreach with zero changes to insurance.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const { getDomain } = require("./domainConfig");
const { buildPitch, loadKnowledgeChunks } = require("./genericPitchEngine");

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_PER_DAY_PER_CONTACT = 1;

function resolveLedgerPath(domain, overrides = {}) {
  const ns = domain.namespace || "leads";
  return (
    overrides.ledgerPath ||
    path.join(__dirname, "..", "..", "..", "data", `${ns}-outreach-ledger.json`)
  );
}

function loadLedger(ledgerPath) {
  try {
    if (fs.existsSync(ledgerPath)) {
      const parsed = JSON.parse(fs.readFileSync(ledgerPath, "utf8"));
      return { leads: Array.isArray(parsed.leads) ? parsed.leads : [] };
    }
  } catch {}
  return { leads: [] };
}

function saveLedger(ledgerPath, ledger) {
  fs.mkdirSync(path.dirname(ledgerPath), { recursive: true });
  fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2), "utf8");
}

function normalizeEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

function getLead(ledger, email) {
  return ledger.leads.find((lead) => lead.email === email) || null;
}

function ensureLead(ledger, contact) {
  const email = normalizeEmail(contact.email);
  let lead = getLead(ledger, email);
  if (!lead) {
    lead = {
      id: `GL_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
      email,
      firstName: String(contact.firstName || "").trim(),
      lastName: String(contact.lastName || "").trim(),
      phone: String(contact.phone || "").trim(),
      status: "new",
      sentCount: 0,
      optedOut: false,
      sentAt: null,
      lastAttemptAt: null,
      history: []
    };
    ledger.leads.push(lead);
  }
  return lead;
}

function canMessageToday(lead, now = new Date()) {
  if (!lead) return { allowed: true, reason: "new_lead" };
  if (lead.optedOut) return { allowed: false, reason: "opted_out" };
  const last = lead.lastAttemptAt ? new Date(lead.lastAttemptAt) : null;
  if (last && now.getTime() - last.getTime() < DAY_MS) {
    return { allowed: false, reason: "daily_cap" };
  }
  return { allowed: true, reason: "eligible" };
}

function buildMail(config, lead, pitch, domain) {
  const user = String(config.user || "").trim();
  const subject = `GARUDA: ${String(pitch.topic || "Ek aasaan baat")}`;
  const body = [
    pitch.body || "",
    "",
    "-----",
    `Ye email GARUDA (${domain.website || "garudaos.in"}) ne bheji hai.`,
    "Agar aap ye nahi chahte ki GARUDA aapko dobara message kare, toh sirf reply kare: UNSUBSCRIBE",
    "Aapka data kisi ke saath share nahi hota."
  ].join("\n");
  return {
    to: lead.email,
    subject,
    body,
    from: user
  };
}

function getSmtpConfig(env = process.env) {
  const host = String(env.GARUDA_EMAIL_HOST || "").trim();
  const port = Number(env.GARUDA_EMAIL_PORT) || 587;
  const user = String(env.GARUDA_EMAIL_USER || "").trim();
  const pass = String(env.GARUDA_EMAIL_PASS || "").trim();
  return {
    ready: Boolean(host && user && pass),
    config: { host, port, user, pass }
  };
}

async function sendEmailNative(config, mail) {
  const { sendSmtpNative } = require("../motherPlatformAuthService");
  const result = await sendSmtpNative(config, mail);
  return result;
}

function previewOutreach(contacts, options = {}) {
  const domain = getDomain(options.domain);
  const chunks = loadKnowledgeChunks(domain, options);
  const ledgerPath = resolveLedgerPath(domain, options);
  const ledger = loadLedger(ledgerPath);
  const now = options.now ? new Date(options.now) : new Date();

  const results = [];
  for (const contact of contacts) {
    const email = normalizeEmail(contact.email);
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      results.push({ email, ok: false, reason: "invalid_email" });
      continue;
    }
    const lead = ensureLead(ledger, contact);
    const gate = canMessageToday(lead, now);
    if (!gate.allowed) {
      results.push({ email, ok: false, reason: gate.reason });
      continue;
    }
    const pitch = buildPitch({
      firstName: lead.firstName,
      query: String(contact.query || contact.topic || ""),
      domainId: domain.id,
      chunks
    });
    results.push({
      email,
      firstName: lead.firstName,
      ok: true,
      subject: `GARUDA: ${pitch.topic}`,
      body: pitch.body,
      factsUsed: pitch.factsUsed,
      domain: domain.id
    });
  }
  return { generated: results.length, results };
}

async function runOutreach(contacts, options = {}) {
  const env = options.env || process.env;
  const smtp = getSmtpConfig(env);
  if (!smtp.ready) {
    throw new Error(
      "SMTP not configured. Set GARUDA_EMAIL_HOST, GARUDA_EMAIL_PORT, GARUDA_EMAIL_USER, GARUDA_EMAIL_PASS"
    );
  }

  const domain = getDomain(options.domain);
  const chunks = loadKnowledgeChunks(domain, options);
  const ledgerPath = resolveLedgerPath(domain, options);
  const ledger = loadLedger(ledgerPath);
  const now = options.now ? new Date(options.now) : new Date();
  const dryRun = options.dryRun === true;
  const max = Math.max(1, Number(options.maxEmails) || contacts.length);

  const sent = [];
  const skipped = [];

  for (const contact of contacts.slice(0, max)) {
    const email = normalizeEmail(contact.email);
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      skipped.push({ email, reason: "invalid_email" });
      continue;
    }
    const lead = ensureLead(ledger, contact);
    const gate = canMessageToday(lead, now);
    if (!gate.allowed) {
      skipped.push({ email, reason: gate.reason });
      continue;
    }
    const pitch = buildPitch({
      firstName: lead.firstName,
      query: String(contact.query || contact.topic || ""),
      domainId: domain.id,
      chunks
    });

    lead.lastAttemptAt = now.toISOString();
    lead.history.push({ at: now.toISOString(), action: dryRun ? "prepared" : "sent", subject: pitch.topic });

    if (dryRun) {
      lead.status = "message_prepared";
      saveLedger(ledgerPath, ledger);
      sent.push({ email, dryRun: true, subject: `GARUDA: ${pitch.topic}`, body: pitch.body });
      continue;
    }

    const mail = buildMail(smtp.config, lead, pitch, domain);
    try {
      const result = await sendEmailNative(smtp.config, mail);
      lead.sentCount += 1;
      lead.sentAt = now.toISOString();
      lead.status = "message_sent";
      lead.lastError = "";
      sent.push({ email, dryRun: false, result: { accepted: result.accepted, providerResponseId: result.providerResponseId } });
    } catch (error) {
      lead.status = "failed";
      lead.lastError = String(error.message || error);
      skipped.push({ email, reason: String(error.message || error) });
    }
    saveLedger(ledgerPath, ledger);
  }

  saveLedger(ledgerPath, ledger);
  return { sent, skipped, ledgerPath, domain: domain.id };
}

function optOutLead(email, options = {}) {
  const domain = getDomain(options.domain);
  const ledgerPath = resolveLedgerPath(domain, options);
  const ledger = loadLedger(ledgerPath);
  const lead = getLead(ledger, normalizeEmail(email));
  if (!lead) return { ok: false, reason: "lead_not_found" };
  lead.optedOut = true;
  lead.optOutAt = new Date().toISOString();
  lead.status = "opted_out";
  lead.history.push({ at: new Date().toISOString(), action: "opted_out", detail: "" });
  saveLedger(ledgerPath, ledger);
  return { ok: true, email: lead.email };
}

function getSummary(options = {}) {
  const domain = getDomain(options.domain);
  const ledgerPath = resolveLedgerPath(domain, options);
  const ledger = loadLedger(ledgerPath);
  const counts = {};
  for (const lead of ledger.leads) {
    counts[lead.status] = (counts[lead.status] || 0) + 1;
  }
  return {
    total: ledger.leads.length,
    optedOut: ledger.leads.filter((lead) => lead.optedOut).length,
    sent: ledger.leads.filter((lead) => lead.sentCount > 0).length,
    byStatus: counts,
    ledgerPath,
    domain: domain.id
  };
}

module.exports = {
  buildMail,
  canMessageToday,
  getSmtpConfig,
  getSummary,
  loadLedger,
  optOutLead,
  previewOutreach,
  runOutreach
};
