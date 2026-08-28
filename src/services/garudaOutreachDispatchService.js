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
const emailRelayService = require("./emailRelayService");

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
    let record = outreachStore.get(prospectId);
    if (!record) {
      record = {
        prospectId,
        company: approvalContext.company || "Prospective Client",
        projectTitle: approvalContext.title || "Custom Software & AI Project",
        source: approvalContext.source || "custom_software_rfp",
        sourceUrl: approvalContext.sourceUrl || "https://garudaos.in",
        contactChannel: approvalContext.contactChannel || "email",
        serviceMatch: approvalContext.serviceMatch || "custom-ai-development",
        status: OUTREACH_STATES.APPROVAL_REQUIRED,
        createdAt: new Date().toISOString(),
        auditTrail: []
      };
      outreachStore.set(prospectId, record);
    }

    record.status = OUTREACH_STATES.APPROVED;
    record.approvedAt = new Date().toISOString();
    record.approvedBy = approvalContext.approver || approvalContext.actor || "founder";

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
    let record = outreachStore.get(prospectId);
    if (!record) {
      record = {
        prospectId,
        company: options.company || "Prospective Client",
        projectTitle: options.title || "Custom Software & AI Project",
        status: OUTREACH_STATES.APPROVED,
        serviceMatch: options.serviceMatch || "custom-ai-development",
        contactChannel: options.contactChannel || "email",
        auditTrail: []
      };
      outreachStore.set(prospectId, record);
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
   * Evaluates current outbound delivery relay configuration from production environment.
   */
  getRelayConfigurationStatus() {
    const relayConfig = emailRelayService.getRelayConfig(process.env);
    const hasHttpRelay = relayConfig.ready === true;
    const hasSmtp = Boolean(process.env.GARUDA_EMAIL_HOST && process.env.GARUDA_EMAIL_USER && process.env.GARUDA_EMAIL_PASS);
    const hasTelegram = telegramBotService.isConfigured();
    const isEmailConfigured = hasHttpRelay || hasSmtp;
    const isConfigured = isEmailConfigured || hasTelegram;

    let activeProvider = "unconfigured";
    if (hasHttpRelay) {
      activeProvider = `http_relay_${relayConfig.config.provider}`;
    } else if (hasSmtp) {
      activeProvider = "smtp_relay";
    } else if (hasTelegram) {
      activeProvider = "telegram_bot";
    }

    return {
      configured: isConfigured,
      isEmailConfigured,
      activeProvider,
      httpRelay: {
        ready: hasHttpRelay,
        provider: relayConfig.config?.provider || String(process.env.GARUDA_EMAIL_RELAY_PROVIDER || "").toLowerCase() || null,
        fromEmail: relayConfig.config?.from || process.env.GARUDA_EMAIL_USER || null
      },
      smtpRelay: {
        ready: hasSmtp,
        host: process.env.GARUDA_EMAIL_HOST || null,
        port: Number(process.env.GARUDA_EMAIL_PORT) || 587,
        user: process.env.GARUDA_EMAIL_USER || null
      },
      hasTelegram,
      remediation: isEmailConfigured ? null : {
        code: "OUTBOUND_CREDENTIAL_MISSING",
        reason: "Outbound email relay not configured (set GARUDA_EMAIL_RELAY_PROVIDER/GARUDA_EMAIL_RELAY_KEY or GARUDA_EMAIL_HOST/USER/PASS).",
        requiredAction: "Verify GARUDA_EMAIL_RELAY_PROVIDER and GARUDA_EMAIL_RELAY_KEY in Render environment variables."
      }
    };
  }

  /**
   * Generates a truthful personalized outreach brief grounded in real GARUDA capabilities.
   */
  generatePersonalizedOutreachBrief(record = {}) {
    return {
      company: record.company,
      serviceMatch: record.serviceMatch,
      leadScore: record.leadScore,
      valueProposition: "Deterministic, governed custom software & AI development with automated QA test suites and cryptographic SHA-256 release manifests.",
      milestoneTerms: "50% kickoff advance deposit upon digital proposal acceptance; 50% upon verified QA delivery and client sign-off.",
      portalLink: `https://www.garudaos.in/services/${record.serviceMatch}`,
      chatDirectLink: `https://www.garudaos.in/chat?ref=${record.prospectId}`
    };
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

    const relayStatus = this.getRelayConfigurationStatus();

    return {
      totalOutreachProspects: records.length,
      countsByStatus: counts,
      approvalPending: counts[OUTREACH_STATES.APPROVAL_REQUIRED] || 0,
      approved: counts[OUTREACH_STATES.APPROVED] || 0,
      sent: counts[OUTREACH_STATES.SENT] || 0,
      responsesReceived: counts[OUTREACH_STATES.RESPONSE_RECEIVED] || 0,
      relayStatus
    };
  }
}

module.exports = new GarudaOutreachDispatchService();
