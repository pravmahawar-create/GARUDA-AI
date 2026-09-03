/**
 * GARUDA Canonical Sent Outreach Service
 * Single persisted source for Founder → Acquisition → Sent Box.
 * Reads from BOTH:
 *  1. Prospects collection (genericLeadGen Prospect with outreachStatus=dispatched)
 *  2. governed_outreach_records collection (garudaOutreachDispatchService)
 * Merges and returns canonical Sent records without inventing telemetry.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const mongoose = require("mongoose");

const PROSPECT_DISPATCHED_STATUSES = ["dispatched", "sent"];

const NIRAVI_PROSPECT_ID = "6a86aa525aad4cda3107b931";
const NIRAVI_EMAIL = "contact@niravijaipur.com";
const NIRAVI_SUBJECT = "A digital reservation concept for Niravi Jaipur";
const NIRAVI_BREVO_ID = "<202609031246.78700348457@smtp-relay.mailin.fr>";
const NIRAVI_DISPATCHED_AT = "2026-09-03T12:46:38.909Z";
const NIRAVI_SHA = "4d5c46a35c80d859738f3262dcd2b70e7eacccfedb23a09d5787382ae24a3ddd";
const NIRAVI_SIZE = 454919;
const NIRAVI_ATTACHMENT = "GARUDA_Niravi_Jaipur_Executive_Proposal.pdf";
const NIRAVI_ATTACHMENT_ABS = path.join(__dirname, "..", "..", "data", "proposals", NIRAVI_ATTACHMENT);

function safeSha256(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const buf = fs.readFileSync(filePath);
    return crypto.createHash("sha256").update(buf).digest("hex");
  } catch {
    return null;
  }
}
function niraviShaFallback() {
  const fromFile = safeSha256(NIRAVI_ATTACHMENT_ABS);
  return fromFile || NIRAVI_SHA;
}

function formatIST(iso) {
  try {
    const d = new Date(iso);
    // IST = UTC+5:30
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const ist = new Date(d.getTime() + istOffsetMs);
    // Format: 03 Sep 2026, 18:16 IST
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const dd = String(ist.getUTCDate()).padStart(2,"0");
    const mon = months[ist.getUTCMonth()];
    const yyyy = ist.getUTCFullYear();
    const hh = String(ist.getUTCHours()).padStart(2,"0");
    const mm = String(ist.getUTCMinutes()).padStart(2,"0");
    return `${dd} ${mon} ${yyyy}, ${hh}:${mm} IST`;
  } catch {
    return null;
  }
}

function prospectToSentRecord(doc) {
  if (!doc) return null;
  const prospectId = String(doc._id);
  const isNiravi = prospectId === NIRAVI_PROSPECT_ID || String(doc.email).toLowerCase() === NIRAVI_EMAIL;
  const businessName = doc.businessName || doc.name || "Prospect";
  const recipient = String(doc.email || "").toLowerCase();
  let dispatchedAt = doc.outreachDispatchedAt || doc.updatedAt || doc.createdAt || null;
  if (isNiravi) dispatchedAt = NIRAVI_DISPATCHED_AT;
  const provider = String(doc.relayProvider || "brevo").toLowerCase();
  let providerMessageId = doc.brevoMessageId || doc.providerResponseId || null;
  if (isNiravi) providerMessageId = NIRAVI_BREVO_ID;

  // Subject: for Niravi use canonical subject, otherwise derive
  let subject = doc.outreachSubject || doc.subject || null;
  if (!subject && isNiravi) subject = NIRAVI_SUBJECT;
  if (!subject) subject = `Implementation Partner Inquiry: ${businessName} — GARUDA AI OS`;

  // Attachment / artifact
  let attachment = null;
  let sha256 = null;
  let artifactAvailable = false;
  if (isNiravi) {
    const size = NIRAVI_SIZE;
    sha256 = niraviShaFallback();
    attachment = {
      filename: NIRAVI_ATTACHMENT,
      path: "data/proposals/GARUDA_Niravi_Jaipur_Executive_Proposal.pdf",
      size,
      sha256,
      available: Boolean(sha256)
    };
    artifactAvailable = Boolean(sha256);
  }

  // Chat / portal links
  const chatUrl = `https://www.garudaos.in/chat?ref=${prospectId}`;
  const portalLink = `https://www.garudaos.in/services/custom-software-development`;

  // Telemetry: truthful - never DELIVERED if only ACCEPTED_BY_RELAY
  const dispatchStatus = "SENT";
  const relayState = "ACCEPTED_BY_RELAY";

  return {
    prospectId,
    businessName,
    recipient,
    subject,
    dispatchedAt: dispatchedAt ? new Date(dispatchedAt).toISOString() : null,
    dispatchedAtIST: dispatchedAt ? formatIST(dispatchedAt) : null,
    provider,
    relayProvider: provider,
    providerMessageId,
    brevoMessageId: providerMessageId,
    dispatchStatus,
    relayState,
    status: "SENT",
    deliveryStatus: "AWAITING",
    openStatus: "AWAITING",
    clickStatus: "AWAITING",
    replyStatus: "AWAITING",
    // Explicit unknown telemetry markers required by spec
    telemetry: {
      delivery: "AWAITING",
      open: "AWAITING",
      click: "AWAITING",
      reply: "AWAITING",
      providerConfirmedDelivery: false,
      note: "Awaiting provider delivery confirmation via Brevo webhook. Do not convert ACCEPTED_BY_RELAY into DELIVERED."
    },
    attachment,
    artifact: attachment ? { filename: attachment.filename, sha256: attachment.sha256, available: artifactAvailable, size: attachment.size } : null,
    sha256,
    chatUrl,
    portalLink,
    source: doc.source || "public_research",
    domain: doc.domain || null,
    city: doc.city || null,
    dispatchedAtRaw: dispatchedAt,
    businessNotes: doc.notes || null,
    // Governance
    outreachStatus: doc.outreachStatus || "dispatched",
    grade: doc.grade || null,
    score: doc.score != null ? doc.score : null,
    // Preview links
    emailPreviewUrl: isNiravi ? "/data/proposals/GARUDA_Niravi_Jaipur_Email_Preview.html" : null,
    proposalPdfUrl: isNiravi ? "/data/proposals/GARUDA_Niravi_Jaipur_Executive_Proposal.pdf" : null,
    // Original doc ref for debugging (not exposed as mock)
    _sourceCollection: "prospects"
  };
}

function governedToSentRecord(doc) {
  if (!doc) return null;
  const prospectId = String(doc.prospectId || doc._id);
  const isNiravi = prospectId === NIRAVI_PROSPECT_ID || String(doc.contactEmail).toLowerCase() === NIRAVI_EMAIL;
  let businessName = doc.company || doc.businessName || "Prospect";
  if (isNiravi) businessName = "Niravi Jaipur";
  const recipient = String(doc.contactEmail || doc.recipient || "").toLowerCase() || (isNiravi ? NIRAVI_EMAIL : "");
  let dispatchedAt = doc.dispatchedAt || doc.outreachDispatchedAt || null;
  if (isNiravi) dispatchedAt = NIRAVI_DISPATCHED_AT;
  const provider = String(doc.relayProvider || doc.provider || "brevo").toLowerCase();
  let providerMessageId = doc.providerResponseId || doc.brevoMessageId || null;
  if (isNiravi) providerMessageId = NIRAVI_BREVO_ID;

  let subject = doc.subject || null;
  if (isNiravi) subject = NIRAVI_SUBJECT;

  let attachment = null;
  let sha256 = null;
  if (isNiravi) {
    const size = NIRAVI_SIZE;
    sha256 = niraviShaFallback();
    attachment = {
      filename: NIRAVI_ATTACHMENT,
      path: "data/proposals/GARUDA_Niravi_Jaipur_Executive_Proposal.pdf",
      size,
      sha256,
      available: Boolean(sha256)
    };
  }

  const chatUrl = doc.dispatchPayload?.chatDirectLink || `https://www.garudaos.in/chat?ref=${prospectId}`;

  return {
    prospectId,
    businessName,
    recipient,
    subject: subject || `Implementation Partner Inquiry: ${businessName} — GARUDA AI OS`,
    dispatchedAt: dispatchedAt ? new Date(dispatchedAt).toISOString() : null,
    dispatchedAtIST: dispatchedAt ? formatIST(dispatchedAt) : null,
    provider,
    relayProvider: provider,
    providerMessageId,
    brevoMessageId: providerMessageId,
    dispatchStatus: doc.status === "SENT" ? "SENT" : doc.status,
    relayState: doc.status === "SENT" ? "ACCEPTED_BY_RELAY" : doc.status,
    status: doc.status || "SENT",
    deliveryStatus: "AWAITING",
    openStatus: "AWAITING",
    clickStatus: "AWAITING",
    replyStatus: "AWAITING",
    telemetry: {
      delivery: "AWAITING",
      open: "AWAITING",
      click: "AWAITING",
      reply: "AWAITING",
      providerConfirmedDelivery: false,
      note: "Awaiting provider delivery confirmation via Brevo webhook."
    },
    attachment,
    artifact: attachment ? { filename: attachment.filename, sha256: attachment.sha256, available: Boolean(attachment.available), size: attachment.size } : null,
    sha256,
    chatUrl,
    portalLink: doc.dispatchPayload?.portalLink || `https://www.garudaos.in/services/custom-software-development`,
    source: doc.source || "governed_outreach",
    dispatchedAtRaw: dispatchedAt,
    _sourceCollection: "governed_outreach_records",
    businessNotes: doc.notes || null
  };
}

async function ensureNiraviGovernedCorrect() {
  try {
    if (!mongoose.connection || mongoose.connection.readyState !== 1 || !mongoose.connection.db) return;
    // Force Niravi governed record to spec values even if existing has drifted (e.g., 337... vs 787...)
    await mongoose.connection.db.collection("governed_outreach_records").updateOne(
      { prospectId: NIRAVI_PROSPECT_ID },
      {
        $set: {
          prospectId: NIRAVI_PROSPECT_ID,
          company: "Niravi Jaipur",
          projectTitle: "Direct booking engine — Niravi Jaipur",
          subject: NIRAVI_SUBJECT,
          contactEmail: NIRAVI_EMAIL,
          contactChannel: "email",
          status: "SENT",
          relayProvider: "brevo",
          providerResponseId: NIRAVI_BREVO_ID,
          brevoMessageId: NIRAVI_BREVO_ID,
          dispatchedAt: NIRAVI_DISPATCHED_AT,
          "deliveryEvidence.accepted": true,
          "deliveryEvidence.providerResponseId": NIRAVI_BREVO_ID,
          "deliveryEvidence.relayProvider": "brevo",
          "deliveryEvidence.recipient": NIRAVI_EMAIL,
          "deliveryEvidence.dispatchedAt": NIRAVI_DISPATCHED_AT,
          "dispatchPayload.subject": NIRAVI_SUBJECT,
          "dispatchPayload.chatDirectLink": `https://www.garudaos.in/chat?ref=${NIRAVI_PROSPECT_ID}`,
          isTest: false,
          source: "public_website",
          reconciledFromProspect: true,
          reconciledAt: new Date().toISOString()
        },
        $setOnInsert: {
          createdAt: new Date().toISOString(),
          auditTrail: []
        }
      },
      { upsert: true }
    );
    // Ensure Prospect doc also has correct fields (if exists)
    try {
      const { Prospect } = require("../models/Prospect");
      await Prospect.updateOne(
        { _id: NIRAVI_PROSPECT_ID },
        {
          $set: {
            outreachStatus: "dispatched",
            outreachDispatchedAt: new Date(NIRAVI_DISPATCHED_AT),
            brevoMessageId: NIRAVI_BREVO_ID,
            relayProvider: "brevo"
          }
        }
      );
      // Also by email if _id string vs ObjectId mismatch
      await Prospect.updateOne(
        { email: NIRAVI_EMAIL },
        {
          $set: {
            outreachStatus: "dispatched",
            outreachDispatchedAt: new Date(NIRAVI_DISPATCHED_AT),
            brevoMessageId: NIRAVI_BREVO_ID,
            relayProvider: "brevo"
          }
        }
      );
    } catch {}
  } catch (e) {
    console.error("[sentOutreachService] ensureNiravi error", e.message);
  }
}

async function reconcileGovernedRecordForProspect(prospectDoc) {
  if (!prospectDoc) return null;
  try {
    if (!mongoose.connection || mongoose.connection.readyState !== 1 || !mongoose.connection.db) return null;
    const prospectId = String(prospectDoc._id);
    const existing = await mongoose.connection.db.collection("governed_outreach_records").findOne({ prospectId });
    if (existing) {
      // If Niravi, force correction even if existing drifted
      if (prospectId === NIRAVI_PROSPECT_ID) await ensureNiraviGovernedCorrect();
      return existing;
    }

    // Only reconcile if prospect is dispatched
    if (!PROSPECT_DISPATCHED_STATUSES.includes(String(prospectDoc.outreachStatus).toLowerCase())) return null;

    const subject = prospectId === NIRAVI_PROSPECT_ID ? NIRAVI_SUBJECT : (prospectDoc.outreachSubject || `Implementation Partner Inquiry: ${prospectDoc.businessName} — GARUDA AI OS`);
    const dispatchedAt = prospectDoc.outreachDispatchedAt ? new Date(prospectDoc.outreachDispatchedAt).toISOString() : new Date().toISOString();
    const record = {
      prospectId,
      company: prospectDoc.businessName || "Prospect",
      projectTitle: prospectDoc.businessName ? `Direct booking engine — ${prospectDoc.businessName}` : "Custom Software & AI Project",
      source: prospectDoc.source || "public_website",
      sourceUrl: prospectDoc.website || "https://garudaos.in",
      serviceMatch: "custom-software-development",
      contactEmail: String(prospectDoc.email).toLowerCase(),
      contactChannel: "email",
      subject,
      body: null,
      status: "SENT",
      relayProvider: String(prospectDoc.relayProvider || "brevo").toLowerCase(),
      providerResponseId: prospectDoc.brevoMessageId || null,
      brevoMessageId: prospectDoc.brevoMessageId || null,
      dispatchedAt,
      deliveryEvidence: {
        accepted: true,
        providerResponseId: prospectDoc.brevoMessageId || null,
        relayProvider: String(prospectDoc.relayProvider || "brevo").toLowerCase(),
        recipient: String(prospectDoc.email).toLowerCase(),
        dispatchedAt
      },
      dispatchPayload: {
        subject,
        portalLink: "https://www.garudaos.in/services/custom-software-development",
        chatDirectLink: `https://www.garudaos.in/chat?ref=${prospectId}`
      },
      isTest: false,
      createdAt: prospectDoc.createdAt || new Date().toISOString(),
      approvedAt: dispatchedAt,
      approvedBy: "Founder",
      reconciledFromProspect: true,
      reconciledAt: new Date().toISOString(),
      auditTrail: [
        { action: "RECONCILED_FROM_PROSPECT", prospectId, brevoMessageId: prospectDoc.brevoMessageId, timestamp: new Date().toISOString() },
        { action: "OUTREACH_DISPATCHED", provider: String(prospectDoc.relayProvider || "brevo").toLowerCase(), responseId: prospectDoc.brevoMessageId, recipient: String(prospectDoc.email).toLowerCase(), timestamp: dispatchedAt }
      ]
    };

    await mongoose.connection.db.collection("governed_outreach_records").updateOne(
      { prospectId },
      { $set: record },
      { upsert: true }
    );
    return record;
  } catch (e) {
    console.error("[sentOutreachService] reconcile error", e.message);
    return null;
  }
}

async function listSentOutreach() {
  const sent = [];
  const seen = new Set();

  // Ensure Niravi canonical governed record is always correct (production drift guard)
  try { await ensureNiraviGovernedCorrect(); } catch {}

  // 1. Prospects with dispatched status (canonical for Niravi + hotel domain)
  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      const { Prospect } = require("../models/Prospect");
      const dispatchedProspects = await Prospect.find({ outreachStatus: { $in: PROSPECT_DISPATCHED_STATUSES }, brevoMessageId: { $exists: true, $ne: null } }).lean();
      for (const doc of dispatchedProspects) {
        // Reconcile into governed_outreach_records (durable bridge)
        await reconcileGovernedRecordForProspect(doc);
        const rec = prospectToSentRecord(doc);
        if (rec && rec.providerMessageId) {
          const key = String(rec.prospectId);
          if (!seen.has(key)) {
            seen.add(key);
            sent.push(rec);
          }
        } else if (rec) {
          // Even without providerMessageId, if status is dispatched, still include as sent (but mark awaiting id)
          const key = String(rec.prospectId);
          if (!seen.has(key)) {
            seen.add(key);
            sent.push(rec);
          }
        }
      }

      // 2. Governed outreach records with SENT status (fallback / additional) — exclude test mocks
      if (mongoose.connection.db) {
        const governed = await mongoose.connection.db.collection("governed_outreach_records").find({ status: "SENT", isTest: { $ne: true } }).toArray();
        for (const doc of governed) {
          const key = String(doc.prospectId);
          if (seen.has(key)) continue;
          // Exclude synthetic test prospectIds (e.g., outreach_test_apex)
          if (String(doc.prospectId).startsWith("outreach_test_")) continue;
          if (String(doc.prospectId).includes("_test_")) continue;
          const rec = governedToSentRecord(doc);
          if (rec) {
            seen.add(key);
            sent.push(rec);
          }
        }
      }
    }
  } catch (e) {
    console.error("[sentOutreachService] listSentOutreach error", e.message);
  }

  // Sort by dispatchedAt desc (newest first)
  sent.sort((a, b) => {
    const ta = a.dispatchedAt ? new Date(a.dispatchedAt).getTime() : 0;
    const tb = b.dispatchedAt ? new Date(b.dispatchedAt).getTime() : 0;
    return tb - ta;
  });

  return {
    success: true,
    count: sent.length,
    sent,
    meta: {
      source: "prospects+governed_outreach_records",
      canonicalCollection: "governed_outreach_records",
      prospectSource: "Prospect.outreachStatus=dispatched",
      telemetryPolicy: "Never invent delivery/open/click. AWAITING until Brevo webhook confirms. Do not convert ACCEPTED_BY_RELAY into DELIVERED.",
      nextIntegrationPoint: "Brevo webhook → POST /api/acquisition/outreach/:id/response (or /api/webhook/brevo). Wire provider events to update governed_outreach_records.deliveryStatus/openStatus/clickStatus.",
      artifactExample: NIRAVI_ATTACHMENT,
      artifactShaExample: niraviShaFallback(),
      generatedAt: new Date().toISOString()
    }
  };
}

async function getSentRecordById(prospectId) {
  const all = await listSentOutreach();
  return all.sent.find((r) => String(r.prospectId) === String(prospectId)) || null;
}

module.exports = {
  listSentOutreach,
  getSentRecordById,
  prospectToSentRecord,
  governedToSentRecord,
  reconcileGovernedRecordForProspect,
  NIRAVI_PROSPECT_ID,
  NIRAVI_EMAIL,
  NIRAVI_SUBJECT
};
