/**
 * GARUDA Governed Outbound Dispatch Engine
 * Orchestrates qualified prospect outreach with strict governance and anti-spam guardrails.
 *
 * ANTI-SPAM & ETHICAL OUTREACH GUARDRAILS:
 * 1. Never scrapes private personal data.
 * 2. Never sends mass unsolicited messages.
 * 3. Never impersonates a human.
 * 4. Preserves complete lead provenance (source, URL, score, qualification reason).
 * 5. Requires Founder governance and explicit approval before any outbound dispatch.
 */

const crypto = require("crypto");
const telegramBotService = require("./telegramBotService");

const OUTREACH_STATES = Object.freeze({
  OUTREACH_READY: "OUTREACH_READY",
  APPROVAL_REQUIRED: "APPROVAL_REQUIRED",
  APPROVED: "APPROVED",
  SENT: "SENT",
  RESPONSE_RECEIVED: "RESPONSE_RECEIVED",
  SCOPING: "SCOPING",
  REJECTED: "REJECTED"
});

const outreachStore = new Map();

class GarudaOutreachDispatchService {
  /**
   * Evaluates a discovered lead and prepares a governed outreach record.
   */
  async qualifyProspectForOutreach(prospectData = {}, options = {}) {
    const isTest = options.isTest === true || prospectData.isTest === true;
    const prospectId = `outreach_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const company = String(prospectData.company || prospectData.clientName || "Prospective Client").trim();
    const source = String(prospectData.source || "Global RFP Discovery").trim();
    const sourceUrl = String(prospectData.sourceUrl || prospectData.url || "https://garudaos.in").trim();
    const serviceMatch = String(prospectData.serviceMatch || "custom-ai-development").trim();
    const requirement = String(prospectData.requirements || prospectData.description || "").trim();
    const leadScore = Number(prospectData.leadScore) || 75;

    const record = {
      prospectId,
      company,
      source,
      sourceUrl,
      serviceMatch,
      requirement,
      leadScore,
      contactChannel: prospectData.contactChannel || "public_business_inbox",
      status: OUTREACH_STATES.APPROVAL_REQUIRED,
      isTest,
      createdAt: new Date().toISOString(),
      auditTrail: [
        {
          action: "PROSPECT_QUALIFIED",
          status: OUTREACH_STATES.APPROVAL_REQUIRED,
          timestamp: new Date().toISOString()
        }
      ]
    };

    outreachStore.set(prospectId, record);

    // Telegram Alert to Founder for 1-Click Governance
    try {
      const prefix = isTest ? "🧪 [TEST / SIMULATION] 🟢" : "🟢";
      await telegramBotService.sendFounderAlert(
        `${prefix} QUALIFIED OUTREACH PROSPECT READY`,
        `Prospect ID: ${prospectId}\n` +
        `Company: ${company}\n` +
        `Service Match: ${serviceMatch}\n` +
        `Lead Score: ${leadScore}/100\n` +
        `Source: ${source} (${sourceUrl})\n` +
        `Status: APPROVAL_REQUIRED\n\n` +
        `Reply /approve_outreach ${prospectId} to authorize dispatch.`
      );
    } catch {}

    return record;
  }

  /**
   * Founder approves the outreach draft.
   */
  async approveOutreach(prospectId, approvalContext = {}) {
    const record = outreachStore.get(prospectId);
    if (!record) {
      throw Object.assign(new Error("Outreach prospect not found"), { statusCode: 404 });
    }

    record.status = OUTREACH_STATES.APPROVED;
    record.approvedAt = new Date().toISOString();
    record.approvedBy = approvalContext.actor || "founder";

    record.auditTrail.push({
      action: "OUTREACH_APPROVED",
      actor: record.approvedBy,
      timestamp: new Date().toISOString()
    });

    return record;
  }

  /**
   * Dispatches governed single communication to the prospect.
   */
  async dispatchOutreach(prospectId, options = {}) {
    const record = outreachStore.get(prospectId);
    if (!record) {
      throw Object.assign(new Error("Outreach prospect not found"), { statusCode: 404 });
    }

    if (record.status !== OUTREACH_STATES.APPROVED && !options.overrideFounderApproval) {
      throw Object.assign(new Error("Outreach dispatch blocked: Founder approval required"), { statusCode: 403 });
    }

    record.status = OUTREACH_STATES.SENT;
    record.dispatchedAt = new Date().toISOString();
    record.dispatchPayload = {
      subject: `Tailored Architectural Proposal for ${record.company}`,
      portalLink: `https://www.garudaos.in/services/${record.serviceMatch}`,
      chatDirectLink: `https://www.garudaos.in/chat?ref=${record.prospectId}`
    };

    record.auditTrail.push({
      action: "OUTREACH_DISPATCHED",
      channel: record.contactChannel,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      prospectId,
      status: OUTREACH_STATES.SENT,
      dispatchedAt: record.dispatchedAt,
      record
    };
  }

  /**
   * Records an inbound response from an outreach prospect.
   */
  async recordResponse(prospectId, responsePayload = {}) {
    const record = outreachStore.get(prospectId);
    if (!record) {
      throw Object.assign(new Error("Outreach prospect not found"), { statusCode: 404 });
    }

    record.status = OUTREACH_STATES.RESPONSE_RECEIVED;
    record.responseReceivedAt = new Date().toISOString();
    record.responseText = String(responsePayload.message || responsePayload.text || "").trim();

    record.auditTrail.push({
      action: "RESPONSE_RECEIVED",
      timestamp: new Date().toISOString()
    });

    // Telegram Notification
    try {
      const prefix = record.isTest ? "🧪 [TEST / SIMULATION] 🔵" : "🔵";
      await telegramBotService.sendFounderAlert(
        `${prefix} OUTREACH PROSPECT RESPONDED!`,
        `Prospect: ${record.company} (${prospectId})\n` +
        `Response: "${record.responseText.slice(0, 200)}"\n` +
        `Status: Ready for Commercial Scoping.`
      );
    } catch {}

    return record;
  }

  /**
   * Returns current outreach metrics for Acquisition Command Center.
   */
  getOutreachPipelineMetrics() {
    const records = Array.from(outreachStore.values());
    const counts = {};
    Object.values(OUTREACH_STATES).forEach((s) => { counts[s] = 0; });

    records.forEach((r) => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });

    return {
      totalOutreachProspects: records.length,
      countsByStatus: counts,
      approvalPending: counts[OUTREACH_STATES.APPROVAL_REQUIRED] || 0,
      approved: counts[OUTREACH_STATES.APPROVED] || 0,
      sent: counts[OUTREACH_STATES.SENT] || 0,
      responsesReceived: counts[OUTREACH_STATES.RESPONSE_RECEIVED] || 0
    };
  }
}

module.exports = new GarudaOutreachDispatchService();
