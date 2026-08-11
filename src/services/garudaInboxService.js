// GARUDA Inbox Service — Gmail IMAP polling for outreach replies.
// Reads unread mail in garudaos.ai@gmail.com, matches sender to outreach ledgers,
// classifies the reply, updates lead status, alerts founder, and schedules follow-ups.

const fs = require("fs");
const path = require("path");
const { ImapFlow } = require("imapflow");

const IMAP_HOST = process.env.GARUDA_IMAP_HOST || "imap.gmail.com";
const IMAP_PORT = Number(process.env.GARUDA_IMAP_PORT) || 993;

const DOMAINS = ["hotel", "restaurant", "gym", "education", "clinic", "insurance", "salon", "hospital", "realestate", "web_services"];

function loadJson(file) {
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {}
  return null;
}

function saveJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

function ledgerPath(domain) {
  const ns = { salon: "salon", hospital: "hospital", realestate: "realestate" }[domain] || domain;
  return path.join(__dirname, "..", "..", "data", `${ns}-outreach-ledger.json`);
}

function isConfigured() {
  return Boolean(process.env.GARUDA_EMAIL_USER && process.env.GARUDA_EMAIL_PASS);
}

function normalizeEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

// Find a lead across all domain ledgers by sender email.
function findLead(senderEmail) {
  const email = normalizeEmail(senderEmail);
  for (const domain of DOMAINS) {
    const file = ledgerPath(domain);
    const ledger = loadJson(file);
    if (!ledger || !Array.isArray(ledger.leads)) continue;
    const lead = ledger.leads.find((l) => normalizeEmail(l.email) === email);
    if (lead) return { domain, file, ledger, lead };
  }
  return null;
}

// Very simple Hinglish/English intent classification (no LLM roundtrip needed for gating).
function classifyReply(text) {
  const t = String(text || "").toLowerCase();
  if (/(unsubscribe|stop|no thanks|nahi chahiye|no interest|not interested|remove me|don'?t contact|spam)/i.test(t)) {
    return "no";
  }
  if (/(yes|haan|hi|hello|interested|batao|kitna|price|quote|rate|cost|budget|shuru|details|more info|chahiye|krna|karna|call|baat karni)/i.test(t)) {
    return "interested";
  }
  if (/(who are you|garuda kya|kon hai|what is|kaun ho|about)/i.test(t)) {
    return "question";
  }
  return "unknown";
}

async function pollInbox(options = {}) {
  const user = String(process.env.GARUDA_EMAIL_USER || "").trim();
  const pass = String(process.env.GARUDA_EMAIL_PASS || "").trim();
  if (!user || !pass) {
    return { ok: false, error: "GARUDA_EMAIL_USER/PASS not configured", processed: 0 };
  }

  const client = new ImapFlow({
    host: IMAP_HOST,
    port: IMAP_PORT,
    secure: true,
    auth: { user, pass },
    logger: false,
    tls: { rejectUnauthorized: false }
  });

  const processed = [];
  try {
    await client.connect();

    // status BEFORE taking the mailbox lock (avoiding lock deadlock).
    let unseen = 0;
    try {
      const status = await client.status("INBOX", { unseen: true });
      unseen = Number(status.unseen || 0);
    } catch {}

    const maxToFetch = Math.min(Number(options.maxEmails) || 25, Math.max(unseen, 25));
    if (unseen === 0) {
      await client.logout();
      return { ok: true, processed };
    }

    const lock = await client.getMailboxLock("INBOX");
    const seenUids = [];
    try {
      // Fetch unseen messages — lightweight: envelope only. Mark-seen happens AFTER the loop.
      for await (const message of client.fetch({ seen: false }, { envelope: true, uid: true })) {
        if (processed.length >= maxToFetch) break;
        const envelope = message.envelope || {};
        const from = (envelope.from && envelope.from[0]) || {};
        const senderEmail = normalizeEmail(from.address || "");
        const subject = String(envelope.subject || "");
        const date = envelope.date ? new Date(envelope.date).toISOString() : new Date().toISOString();
        const bodyText = ""; // full body requires source fetch; subject+from is enough to classify replies
        const match = findLead(senderEmail);
        const intent = classifyReply(`${subject} ${bodyText}`);

        const record = {
          email: senderEmail,
          subject: String(subject).slice(0, 200),
          date,
          intent,
          snippet: String(subject || "").slice(0, 200),
          matched: Boolean(match)
        };

        if (match) {
          const { domain, file, ledger, lead } = match;
          lead.repliedAt = date;
          lead.replyIntent = intent;
          lead.replySnippet = String(subject || "").slice(0, 200);
          if (intent === "no") {
            lead.optedOut = true;
            lead.status = "replied_no";
          } else if (intent === "interested") {
            lead.status = "replied_interested";
          } else {
            lead.status = "replied";
          }
          lead.history = lead.history || [];
          lead.history.push({ at: date, action: `inbox_${intent}`, subject });
          saveJson(file, ledger);
          record.domain = domain;
          record.leadStatus = lead.status;
        }

        seenUids.push(message.uid);
        processed.push(record);
        if (options.onMessage) {
          try { options.onMessage(record); } catch {}
        }
      }

      // Mark seen AFTER iterating (flag writes inside the fetch loop can deadlock the stream).
      for (const uid of seenUids) {
        try {
          await client.messageFlagsAdd(uid, ["\\Seen"], { uid: true });
        } catch {}
      }
    } finally {
      lock.release();
    }
    await client.logout();
    return { ok: true, processed };
  } catch (error) {
    try { await client.logout(); } catch {}
    return { ok: false, error: error && error.message ? error.message : String(error), processed };
  }
}

async function sendFollowUp(email, domain, step = 1) {
  const outreachEngine = require("./leadgen/genericOutreachEngine");

  const smtp = outreachEngine.getSmtpConfig();
  if (!smtp.ready) return { ok: false, reason: "smtp_not_configured" };

  const FOLLOW_UP_BODY = {
    1: `Bas ek chhota reminder — maine pichle hafte GARUDA ke baare me aapko bataya tha. Kya aapko isme interest hai? Sirf "yes" reply karein aur main details bhej dunga.`,
    2: `Last update from GARUDA — agar is samay zaroorat nahi hai to koi baat nahi, reply "no" aur main aapko dobara kabhi pareshan nahi karunga. Par agar website/digital presence pe kaam karna ho to abhi best time hai.`
  };

  const mail = outreachEngine.buildMail(smtp.config, { email, firstName: "" }, {
    topic: "follow-up",
    body: `${FOLLOW_UP_BODY[step] || FOLLOW_UP_BODY[1]}\n\n-----\nYe email GARUDA (garudaos.in) ne bheji hai. Reply: UNSUBSCRIBE to opt out.`
  }, { website: "garudaos.in" });

  try {
    const { sendEmailNative } = require("./motherPlatformAuthService");
    const result = await sendEmailNative(smtp.config, mail);
    const match = findLead(email);
    if (match) {
      match.lead.followUpCount = (match.lead.followUpCount || 0) + 1;
      match.lead.history = match.lead.history || [];
      match.lead.history.push({ at: new Date().toISOString(), action: `follow_up_${step}`, subject: "follow-up" });
      match.lead.lastFollowUpAt = new Date().toISOString();
      saveJson(match.file, match.ledger);
    }
    return { ok: true, email, step, accepted: result && result.accepted };
  } catch (error) {
    return { ok: false, email, reason: error && error.message ? error.message : String(error) };
  }
}

function pendingFollowUps(now = new Date()) {
  const due = [];
  const DAY = 24 * 60 * 60 * 1000;
  for (const domain of DOMAINS) {
    const ledger = loadJson(ledgerPath(domain));
    if (!ledger || !Array.isArray(ledger.leads)) continue;
    for (const lead of ledger.leads) {
      const sentAt = lead.sentAt ? new Date(lead.sentAt).getTime() : null;
      if (!sentAt) continue;
      const followUpCount = lead.followUpCount || 0;
      if (followUpCount >= 2) continue; // max 2 follow-ups
      if (lead.optedOut || lead.replyIntent === "no") continue;
      if (lead.bounced) continue; // address doesn't exist — never follow up
      if (lead.replyIntent === "interested" || lead.status === "replied_interested") continue;
      const sinceSent = now.getTime() - sentAt;
      const waitFor = (followUpCount + 1) * 3 * DAY;
      if (sinceSent >= waitFor) {
        due.push({ email: lead.email, domain, step: followUpCount + 1, sinceDays: Math.round(sinceSent / DAY) });
      }
    }
  }
  return due;
}

// Mark a lead as bounced (address doesn't exist) across every domain ledger.
// Returns how many ledgers were updated.
function markBounced(recipientEmail) {
  const email = normalizeEmail(recipientEmail);
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { updated: 0 };
  let updated = 0;
  for (const domain of DOMAINS) {
    const file = ledgerPath(domain);
    const ledger = loadJson(file);
    if (!ledger || !Array.isArray(ledger.leads)) continue;
    let changed = false;
    for (const lead of ledger.leads) {
      if (normalizeEmail(lead.email) === email && !lead.bounced) {
        lead.bounced = true;
        lead.bouncedAt = new Date().toISOString();
        lead.status = "bounced";
        lead.history = lead.history || [];
        lead.history.push({ at: lead.bouncedAt, action: "bounced", note: "delivery failed — address does not exist" });
        changed = true;
        updated++;
      }
    }
    if (changed) saveJson(file, ledger);
  }
  return { updated };
}

// Scan inbox for delivery-failure (bounce) notifications from the mail system,
// mark the matching leads as bounced so they are never followed up, and
// auto-delete the bounce notification emails (they serve no purpose after parsing).
// Returns the bounced recipient emails found.
async function scanBounces(options = {}) {
  const user = String(process.env.GARUDA_EMAIL_USER || "").trim();
  const pass = String(process.env.GARUDA_EMAIL_PASS || "").trim();
  if (!user || !pass) return { ok: false, error: "GARUDA_EMAIL_USER/PASS not configured", bounced: [] };

  const client = new ImapFlow({
    host: IMAP_HOST,
    port: IMAP_PORT,
    secure: true,
    auth: { user, pass },
    logger: false,
    tls: { rejectUnauthorized: false }
  });

  const bounced = [];
  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    const deleteUids = [];
    try {
      const uids = await client.search({
        subject: "delivery",
        or: [{ from: "mailer-daemon@googlemail.com" }, { from: "mailer-daemon@google.com" }]
      });
      const recent = (uids || []).slice(-Number(options.limit || 50));
      for (const uid of recent) {
        for await (const message of client.fetch({ uid }, { uid: true, source: true })) {
          const text = String(message.source || "");
          const recipient =
            (text.match(/Final-Recipient:\s*rfc822;\s*([^\s]+)/i) || [])[1] ||
            (text.match(/failed to deliver[^<]*<([^>]+)>/i) || [])[1];
          if (recipient) {
            const result = markBounced(recipient);
            bounced.push({ email: normalizeEmail(recipient), ledgersUpdated: result.updated });
          }
          deleteUids.push(uid);
        }
      }
      // Auto-delete processed bounce notifications (unless explicitly disabled).
      if (!(options.delete === false) && deleteUids.length) {
        try {
          await client.messageDelete(deleteUids, { uid: true });
        } catch {}
      }
    } finally {
      lock.release();
      await client.logout();
    }
    return { ok: true, bounced, deleted: deleteUids.length };
  } catch (error) {
    try { await client.logout(); } catch {}
    return { ok: false, error: error && error.message ? error.message : String(error), bounced };
  }
}

module.exports = {
  classifyReply,
  findLead,
  isConfigured,
  markBounced,
  pendingFollowUps,
  pollInbox,
  scanBounces,
  sendFollowUp
};
