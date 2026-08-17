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