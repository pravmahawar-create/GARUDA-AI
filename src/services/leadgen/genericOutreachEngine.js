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
  if (lead.bounced) return { allowed: false, reason: "bounced" };
  const last = lead.lastAttemptAt ? new Date(lead.lastAttemptAt) : null;
  if (last && now.getTime() - last.getTime() < DAY_MS) {
    return { allowed: false, reason: "daily_cap" };
  }
  return { allowed: true, reason: "eligible" };
}

function buildMail(config, lead, pitch, domain, locale = "hi") {
  const user = String(config.user || "").trim() || "praveen@garudaos.in";
  const isEn = locale === "en";
  const leadName = lead.firstName || "Partner";
  const subject = `GARUDA Architecture Brief: Autonomous Systems & Engineering Infrastructure`;
  const plainTextBody = [
    pitch.body || "",
    "",
    "-----",
    isEn
      ? `This email was sent by GARUDA AI OS (${domain.website || "https://www.garudaos.in"}).`
      : `Ye email GARUDA AI OS (${domain.website || "https://www.garudaos.in"}) ne bheji hai.`,
    isEn
      ? "Direct Inquiries: praveen@garudaos.in | Portal: https://www.garudaos.in"
      : "Official Email: praveen@garudaos.in | Portal: https://www.garudaos.in",
    isEn
      ? "To unsubscribe, simply reply: UNSUBSCRIBE"
      : "Agar aap ye message dobara nahi chahte, toh reply karein: UNSUBSCRIBE"
  ].join("\n");

  const paragraphs = (pitch.body || "")
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(Boolean);

  const scopingUrl = `https://www.garudaos.in/chat?ref=${encodeURIComponent(lead.id || "outreach")}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #04070a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #04070a; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- 600px Executive Brief Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #0a0f16; border: 1px solid rgba(212, 175, 55, 0.25); border-radius: 12px; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.5);">
          <!-- Header Bar -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #04070a 100%); padding: 24px 28px; border-bottom: 2px solid #d4af37;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <div style="font-size: 18px; font-weight: 900; letter-spacing: 0.1em; color: #ffffff; text-transform: uppercase;">
                      GARUDA AI OS
                    </div>
                    <div style="font-size: 11px; color: #d4af37; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 700; margin-top: 3px;">
                      Sovereign Autonomous Systems
                    </div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background: rgba(212, 175, 55, 0.12); border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 999px; padding: 4px 12px; font-size: 10px; color: #fef08a; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">
                      Executive Brief
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 28px 28px 20px 28px; font-size: 14px; line-height: 1.65; color: #cbd5e1;">
              ${paragraphs.map(para => `<p style="margin: 0 0 16px 0; color: #cbd5e1;">${para.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`).join("")}

              <!-- Architectural Highlights Block -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; margin: 24px 0 20px 0; padding: 14px 18px;">
                <tr>
                  <td>
                    <div style="font-size: 11px; color: #d4af37; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px;">
                      Deterministic Engineering Capabilities
                    </div>
                    <div style="font-size: 13px; color: #e2e8f0; line-height: 1.6;">
                      ◈ <strong>Autonomous Agent Fleets:</strong> High-throughput multi-agent execution with zero human latency.<br/>
                      ◈ <strong>Sovereign Data Security:</strong> Full on-premises air-gapped deployment option with 100% IP ownership.<br/>
                      ◈ <strong>Cryptographic Verification:</strong> Every milestone verified by SHA-256 test manifests before signoff.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Authoritative CTA Button -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0 16px 0;">
                <tr>
                  <td align="center">
                    <a href="${scopingUrl}" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b8860b 100%); color: #05070a; text-decoration: none; font-weight: 900; font-size: 14px; letter-spacing: 0.03em; padding: 14px 32px; border-radius: 8px; box-shadow: 0 8px 20px rgba(212,175,55,0.25);">
                      Schedule Architectural Scoping Session ➔
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #05080e; padding: 20px 28px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 11px; color: #64748b; line-height: 1.5;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <strong>GARUDA AI OS</strong> • Founder: Praveen Mahawar<br/>
                    Official Email: <a href="mailto:praveen@garudaos.in" style="color: #94a3b8; text-decoration: underline;">praveen@garudaos.in</a> | Portal: <a href="https://www.garudaos.in" style="color: #94a3b8; text-decoration: underline;">https://www.garudaos.in</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 10px; font-size: 10px; color: #475569;">
                    To unsubscribe from future architectural updates, reply directly with "UNSUBSCRIBE". Your privacy is rigorously respected under Anti-Fabrication Law.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return {
    to: lead.email,
    subject,
    body: plainTextBody,
    html,
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
    const locale = String(contact.locale || contact.country || "hi").toLowerCase().startsWith("en") ? "en" : "hi";
    const gate = canMessageToday(lead, now);
    if (!gate.allowed) {
      results.push({ email, ok: false, reason: gate.reason });
      continue;
    }
    const pitch = buildPitch({
      firstName: lead.firstName,
      query: String(contact.query || contact.topic || ""),
      domainId: domain.id,
      chunks,
      locale
    });
    results.push({
      email,
      firstName: lead.firstName,
      ok: true,
      locale,
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
    const locale = String(contact.locale || contact.country || "hi").toLowerCase().startsWith("en") ? "en" : "hi";
    const gate = canMessageToday(lead, now);
    if (!gate.allowed) {
      skipped.push({ email, reason: gate.reason });
      continue;
    }
    const pitch = buildPitch({
      firstName: lead.firstName,
      query: String(contact.query || contact.topic || ""),
      domainId: domain.id,
      chunks,
      locale
    });

    lead.lastAttemptAt = now.toISOString();
    lead.history.push({ at: now.toISOString(), action: dryRun ? "prepared" : "sent", subject: pitch.topic });

    if (dryRun) {
      lead.status = "message_prepared";
      saveLedger(ledgerPath, ledger);
      sent.push({ email, dryRun: true, subject: `GARUDA: ${pitch.topic}`, body: pitch.body, locale });
      continue;
    }

    const mail = buildMail(smtp.config, lead, pitch, domain, locale);
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
