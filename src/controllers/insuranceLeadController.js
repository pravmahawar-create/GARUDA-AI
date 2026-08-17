const { InsuranceLead, LEAD_STATUSES } = require("../models/InsuranceLead");
const telegramInsuranceWorker = require("../services/telegramInsuranceWorkerService");

function sendError(res, error, fallback) {
  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || fallback
  });
}

exports.list = async (req, res) => {
  try {
    const query = {};
    if (req.query.status && LEAD_STATUSES.includes(req.query.status)) query.status = req.query.status;
    if (req.query.source) query.source = String(req.query.source).trim();
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
    const items = await InsuranceLead.find(query).sort({ createdAt: -1 }).limit(limit);
    return res.json({ success: true, data: items.map((item) => item.toJSON()) });
  } catch (error) {
    return sendError(res, error, "Failed to list insurance leads");
  }
};

// Founder-gated InsuranceLead -> Opportunity handoff. Requires
// x-garuda-founder-approved header.
exports.promote = async (req, res) => {
  try {
    const result = await telegramInsuranceWorker.promoteLeadToOpportunity(req.params.id, {
      founderApproved: req.get("x-garuda-founder-approved")
    });
    if (!result.promoted) {
      return res.status(result.reason === "founder_approval_required" ? 403 : 400).json({ success: false, reason: result.reason });
    }
    return res.json({ success: true, data: result });
  } catch (error) {
    return sendError(res, error, "Failed to promote insurance lead to opportunity");
  }
};

// Founder-gated bulk import of qualified insurance contacts (from the founder's
// outreach CSV) into the InsuranceLead pipeline. Idempotent per email. Founder
// approval header required.
exports.importContacts = async (req, res) => {
  try {
    const founderApproved = req.get("x-garuda-founder-approved");
    if (!(founderApproved === true || String(founderApproved || "").trim().toLowerCase() === "true")) {
      return res.status(403).json({ success: false, message: "Founder approval required for insurance contact import" });
    }
    const contacts = Array.isArray(req.body.contacts) ? req.body.contacts : [];
    const inserted = [];
    const skipped = [];
    for (const raw of contacts) {
      const email = String(raw.email || "").trim().toLowerCase();
      if (!email) {
        skipped.push({ ...raw, reason: "no_email" });
        continue;
      }
      const existing = await InsuranceLead.findOne({ email });
      if (existing) {
        skipped.push({ email, reason: "duplicate" });
        continue;
      }
      const lead = await InsuranceLead.create({
        email,
        firstName: String(raw.firstName || raw.name || "").trim(),
        lastName: String(raw.lastName || "").trim(),
        phone: String(raw.phone || "").trim(),
        source: String(raw.source || "founder_contacts").trim(),
        status: "new",
        tags: ["founder_import", String(raw.query || "savings_investment")].filter(Boolean),
        notes: String(raw.notes || "").trim(),
        audit: [{ action: "founder_imported", at: new Date(), detail: `Import from founder contacts CSV${raw.query ? `, query=${raw.query}` : ""}` }]
      });
      inserted.push(lead.toJSON());
    }
    return res.status(201).json({ success: true, data: { inserted: inserted.length, skipped: skipped.length, insertedLeads: inserted, skippedReasons: skipped } });
  } catch (error) {
    return sendError(res, error, "Failed to import insurance contacts");
  }
};

// Founder-gated pitch preparation: builds a grounded ABSLI pitch for every
// `new` lead (using knowledge chunks) and stores pitchSubject/pitchBody. Sets
// status to message_prepared. Founder approval header required.
exports.preparePitches = async (req, res) => {
  try {
    const founderApproved = req.get("x-garuda-founder-approved");
    if (!(founderApproved === true || String(founderApproved || "").trim().toLowerCase() === "true")) {
      return res.status(403).json({ success: false, message: "Founder approval required to prepare insurance pitches" });
    }
    const { buildPitch, loadKnowledgeChunks, detectTopic } = require("../services/insurancePitchService");
    const chunks = loadKnowledgeChunks();
    const query = req.query.status || "new";
    const leads = await InsuranceLead.find({ status: query });
    const prepared = [];
    const failed = [];
    for (const lead of leads) {
      try {
        const topic = detectTopic(lead.tags && lead.tags.find((t) => ["child_education", "savings_investment", "family_protection", "cancer_health", "tax"].includes(t)) || "");
        const pitch = buildPitch({ firstName: lead.firstName, query: topic, chunks });
        lead.pitchSubject = `GARUDA: ${pitch.topic}`;
        lead.pitchBody = pitch.body;
        lead.status = "message_prepared";
        lead.audit = lead.audit || [];
        lead.audit.push({ action: "pitch_prepared", at: new Date(), detail: `topic=${pitch.topic}, facts=${pitch.factsUsed.length}` });
        await lead.save();
        prepared.push({ email: lead.email, topic: pitch.topic, factsUsed: pitch.factsUsed.length });
      } catch (error) {
        failed.push({ email: lead.email, reason: String(error.message || error) });
      }
    }
    return res.json({ success: true, data: { prepared: prepared.length, failed: failed.length, leads: prepared, failures: failed } });
  } catch (error) {
    return sendError(res, error, "Failed to prepare insurance pitches");
  }
};

// Founder-gated pitch send: dispatches the stored pitchSubject/pitchBody for
// every `message_prepared` lead via the governed SMTP transport and advances
// the lead to `message_sent`. Idempotent per lead — only `message_prepared`
// leads are eligible, so a second call sends nothing.
exports.sendPitches = async (req, res) => {
  try {
    const founderApproved = req.get("x-garuda-founder-approved");
    if (!(founderApproved === true || String(founderApproved || "").trim().toLowerCase() === "true")) {
      return res.status(403).json({ success: false, message: "Founder approval required to send insurance pitches" });
    }
    const smtp = (() => {
      try {
        const { getSmtpConfig } = require("../services/insuranceOutreachService");
        return getSmtpConfig();
      } catch {
        return { ready: false, config: null };
      }
    })();
    if (!smtp.ready || !smtp.config) {
      return res.status(500).json({ success: false, message: "SMTP not configured (GARUDA_EMAIL_HOST/USER/PASS)" });
    }
    const { sendSmtpWithFallback } = require("../services/motherPlatformAuthService");
    const leads = await InsuranceLead.find({ status: "message_prepared" });
    const limit = Math.max(1, Number(req.query.limit) || leads.length);
    const sent = [];
    const failed = [];
    for (const lead of leads.slice(0, limit)) {
      if (!lead.pitchBody) {
        failed.push({ email: lead.email, reason: "no_pitch_body" });
        continue;
      }
      const mail = {
        to: lead.email,
        subject: lead.pitchSubject || `GARUDA: Aapke liye ek aasaan baat`,
        body: [
          lead.pitchBody,
          "",
          "-----",
          "Ye email GARUDA (garudaos.in) — AI Financial Advisor & ABSLI Financial Partner — ne bheji hai.",
          "Agar aap ye nahi chahte ki GARUDA aapko dobara message kare, toh sirf reply kare: UNSUBSCRIBE",
          "Aapka data kisi ke saath share nahi hota."
        ].join("\n")
      };
      try {
        const result = await sendSmtpWithFallback(smtp.config, mail);
        lead.sentCount = Number(lead.sentCount || 0) + 1;
        lead.sentAt = new Date();
        lead.lastAttemptAt = new Date();
        lead.status = "message_sent";
        lead.audit = lead.audit || [];
        lead.audit.push({
          action: "pitch_sent",
          at: new Date(),
          detail: `provider=${result.providerResponseId || "SMTP_ACCEPTED_250_OK"}, accepted=${result.accepted === true}`
        });
        await lead.save();
        sent.push({ email: lead.email, accepted: result.accepted === true, providerResponseId: result.providerResponseId || null });
      } catch (error) {
        // Gmail throttles rapid connections from cloud IPs — retry once after
        // a short pause before marking the lead failed.
        let retryResult = null;
        try {
          const delayMs = Number(req.query.retryDelayMs) || 2500;
          await new Promise((r) => setTimeout(r, delayMs));
          retryResult = await sendSmtpWithFallback(smtp.config, mail);
          lead.sentCount = Number(lead.sentCount || 0) + 1;
          lead.sentAt = new Date();
          lead.lastAttemptAt = new Date();
          lead.status = "message_sent";
          lead.audit = lead.audit || [];
          lead.audit.push({
            action: "pitch_sent_retried",
            at: new Date(),
            detail: `provider=${retryResult.providerResponseId || "SMTP_ACCEPTED_250_OK"}, accepted=${retryResult.accepted === true}`
          });
          await lead.save();
          sent.push({ email: lead.email, accepted: retryResult.accepted === true, providerResponseId: retryResult.providerResponseId || null });
        } catch (retryError) {
          const detail = (() => {
            const err = retryError || error;
            if (err && err.errors && err.errors.length) {
              return err.errors.map((e) => String((e && e.message) || e)).join(" | ");
            }
            if (err && err.cause) {
              return String((err.cause && err.cause.message) || err.cause);
            }
            return String((err && err.message) || err);
          })();
          lead.lastAttemptAt = new Date();
          lead.status = "failed";
          lead.reason = detail;
          lead.audit = lead.audit || [];
          lead.audit.push({ action: "pitch_send_failed", at: new Date(), detail });
          await lead.save();
          failed.push({ email: lead.email, reason: detail });
        }
      }
      // Space out sends so Gmail doesn't throttle the cloud egress IP.
      const interDelayMs = Number(req.query.delayMs) || 1200;
      if (interDelayMs > 0) await new Promise((r) => setTimeout(r, interDelayMs));
    }
    return res.json({ success: true, data: { sent: sent.length, failed: failed.length, leads: sent, failures: failed } });
  } catch (error) {
    return sendError(res, error, "Failed to send insurance pitches");
  }
};

// Founder-gated reset: returns `failed` leads (that have a stored pitchBody but
// were never actually delivered) back to `message_prepared` so the send can be
// retried. Only touches leads that were failed by a transport/config error and
// never reached message_sent.
exports.resetPitches = async (req, res) => {
  try {
    const founderApproved = req.get("x-garuda-founder-approved");
    if (!(founderApproved === true || String(founderApproved || "").trim().toLowerCase() === "true")) {
      return res.status(403).json({ success: false, message: "Founder approval required to reset insurance pitches" });
    }
    const leads = await InsuranceLead.find({ status: "failed", pitchBody: { $exists: true, $ne: "" } });
    const reset = [];
    for (const lead of leads) {
      if (lead.sentCount > 0 || lead.sentAt) {
        continue;
      }
      lead.status = "message_prepared";
      lead.reason = "";
      lead.audit = lead.audit || [];
      lead.audit.push({ action: "pitch_reset", at: new Date(), detail: "reset failed -> message_prepared for retry" });
      await lead.save();
      reset.push({ email: lead.email });
    }
    return res.json({ success: true, data: { reset: reset.length, leads: reset } });
  } catch (error) {
    return sendError(res, error, "Failed to reset insurance pitches");
  }
};