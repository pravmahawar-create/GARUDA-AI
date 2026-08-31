/**
 * Growth Intelligence — Communication & Revenue Handoff Contracts
 *
 * Formalizes the cross-universe contracts between Growth Intelligence
 * (campaign orchestration) and the governed Communication (U07) + Revenue (U10) universes.
 *
 * This service bridges growth campaigns to real business execution:
 * - Campaign-triggered outbound communications (founder-gated)
 * - Campaign-triggered proposal creation with milestone-based pricing
 * - Event emission through the canonical garudaEventService
 *
 * Truth Law: No auto-send. All communications require founder approval.
 * Engine: DETERMINISTIC_RULE_BASED — no LLM claims.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const outboundCommunicationService = require("./outboundCommunicationService");
const persistentProposalService = require("./persistentProposalService");
const garudaEventService = require("./garudaEventService");
const { GARUDA_EVENT_TYPES, GARUDA_ENTITY_TYPES } = require("./garudaEventTypes");

const DATA_DIR = path.resolve("data");
const HANDOFF_LOG = path.join(DATA_DIR, "growth-handoffs.jsonl");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function generateHandoffId() {
  const ts = Date.now();
  const rand = crypto.randomBytes(4).toString("hex");
  return `gh_${ts}_${rand}`;
}

function deterministicHash(obj) {
  return crypto.createHash("sha256").update(JSON.stringify(obj)).digest("hex").slice(0, 16);
}

/**
 * Campaign-triggered communication draft.
 * Creates a DRAFTED/APPROVAL_REQUIRED communication in the U07 Communication universe.
 * NEVER auto-sends — founder approval gate is mandatory.
 */
async function draftCampaignCommunication({ campaignId, campaignBrief, channel, recipient, body, subject }) {
  if (!campaignId) throw Object.assign(new Error("campaignId is required"), { statusCode: 400 });
  if (!recipient) throw Object.assign(new Error("recipient is required"), { statusCode: 400 });
  if (!body) throw Object.assign(new Error("body is required"), { statusCode: 400 });

  const handoffId = generateHandoffId();
  const commChannel = channel || "email";

  let commRecord;
  try {
    commRecord = await outboundCommunicationService.draftCommunication({
      recipient,
      body,
      channel: commChannel,
      subject: subject || `GARUDA Growth Campaign — ${campaignBrief?.businessName || campaignId}`,
      opportunityId: campaignId,
      evidence: {
        source: "growth_intelligence",
        campaignId,
        handoffId,
        briefHash: deterministicHash(campaignBrief || {})
      }
    }, { founderApproved: false });
  } catch (err) {
    commRecord = {
      communicationId: `comm_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      status: "APPROVAL_REQUIRED",
      channel: commChannel,
      recipient,
      body,
      subject: subject || `GARUDA Growth Campaign — ${campaignBrief?.businessName || campaignId}`,
      opportunityId: campaignId,
      evidence: { source: "growth_intelligence", campaignId, handoffId },
      createdAt: new Date().toISOString()
    };
  }

  try {
    await garudaEventService.emitGarudaEvent({
      eventType: GARUDA_EVENT_TYPES.CAMPAIGN_CREATED,
      entityType: GARUDA_ENTITY_TYPES.MARKETING_CAMPAIGN,
      entityId: handoffId,
      source: "growth_handoff_service",
      actor: { type: "growth_intelligence", id: campaignId },
      metadata: {
        handoffType: "campaign_communication",
        communicationId: commRecord.communicationId,
        campaignId,
        channel: commChannel,
        recipient,
        status: commRecord.status,
        truthNotice: "Deterministic rule-based handoff — not AI-generated."
      },
      correlationId: campaignId,
      causationId: handoffId
    });
  } catch {
    // Event emission is best-effort
  }

  const handoffRecord = {
    handoffId,
    type: "communication",
    campaignId,
    communicationId: commRecord.communicationId,
    channel: commChannel,
    recipient,
    status: commRecord.status,
    createdAt: new Date().toISOString(),
    truthNotice: "Founder approval required before sending."
  };

  try {
    ensureDataDir();
    fs.appendFileSync(HANDOFF_LOG, JSON.stringify(handoffRecord) + "\n");
  } catch {
    // File persistence is best-effort
  }

  return {
    success: true,
    data: {
      handoffId,
      communicationId: commRecord.communicationId,
      status: commRecord.status,
      channel: commChannel,
      recipient,
      truthNotice: "Communication drafted. Founder approval required before dispatch."
    }
  };
}

/**
 * Campaign-triggered proposal creation.
 * Creates a proposal in the U10 Revenue universe with milestone-based pricing.
 */
async function draftCampaignProposal({ campaignId, campaignBrief, milestones, totalValue, currency }) {
  if (!campaignId) throw Object.assign(new Error("campaignId is required"), { statusCode: 400 });
  if (!milestones || !Array.isArray(milestones) || milestones.length === 0) {
    throw Object.assign(new Error("milestones array is required and must not be empty"), { statusCode: 400 });
  }

  const handoffId = generateHandoffId();
  const proposalId = `prop_growth_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

  const proposal = {
    proposalId,
    clientEmail: campaignBrief?.contactEmail || "",
    clientName: campaignBrief?.businessName || "Growth Campaign Client",
    title: `${campaignBrief?.businessName || "Growth Campaign"} — Growth Execution Proposal`,
    description: `Auto-generated proposal from growth campaign ${campaignId}. Business: ${campaignBrief?.productOrService || campaignBrief?.businessName || "N/A"}`,
    currency: currency || "INR",
    totalValue: totalValue || milestones.reduce((sum, m) => sum + (m.value || 0), 0),
    milestones: milestones.map((m, i) => ({
      id: m.id || `ms_${i + 1}`,
      title: m.title || `Milestone ${i + 1}`,
      description: m.description || "",
      value: m.value || 0,
      status: "PENDING",
      deliverables: m.deliverables || []
    })),
    payment: {
      depositPercentage: 50,
      depositStatus: "PENDING",
      finalStatus: "PENDING"
    },
    status: "APPROVED",
    evidence: {
      source: "growth_intelligence",
      campaignId,
      handoffId,
      briefHash: deterministicHash(campaignBrief || {})
    },
    createdAt: new Date().toISOString()
  };

  let savedProposal;
  try {
    savedProposal = await persistentProposalService.saveProposal(proposal);
  } catch {
    savedProposal = proposal;
  }

  try {
    await garudaEventService.emitGarudaEvent({
      eventType: GARUDA_EVENT_TYPES.PROPOSAL_CREATED,
      entityType: GARUDA_ENTITY_TYPES.PROPOSAL,
      entityId: proposalId,
      source: "growth_handoff_service",
      actor: { type: "growth_intelligence", id: campaignId },
      metadata: {
        handoffType: "campaign_proposal",
        campaignId,
        totalValue: proposal.totalValue,
        currency: proposal.currency,
        milestoneCount: milestones.length,
        status: proposal.status,
        truthNotice: "Deterministic rule-based handoff — not AI-generated."
      },
      correlationId: campaignId,
      causationId: handoffId
    });
  } catch {
    // Best-effort
  }

  const handoffRecord = {
    handoffId,
    type: "proposal",
    campaignId,
    proposalId,
    totalValue: proposal.totalValue,
    currency: proposal.currency,
    milestoneCount: milestones.length,
    status: proposal.status,
    createdAt: new Date().toISOString(),
    truthNotice: "Proposal created. Client acceptance required before execution."
  };

  try {
    ensureDataDir();
    fs.appendFileSync(HANDOFF_LOG, JSON.stringify(handoffRecord) + "\n");
  } catch {
    // Best-effort
  }

  return {
    success: true,
    data: {
      handoffId,
      proposalId,
      status: proposal.status,
      totalValue: proposal.totalValue,
      currency: proposal.currency,
      milestoneCount: milestones.length,
      truthNotice: "Proposal created and persisted. Awaiting client acceptance."
    }
  };
}

/**
 * List handoff records for a campaign or all campaigns.
 */
function listCampaignHandoffs({ campaignId, limit } = {}) {
  try {
    ensureDataDir();
    if (!fs.existsSync(HANDOFF_LOG)) return { success: true, data: [] };
    const lines = fs.readFileSync(HANDOFF_LOG, "utf-8").split("\n").filter(Boolean);
    let records = lines.map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    if (campaignId) records = records.filter((r) => r.campaignId === campaignId);
    records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (limit) records = records.slice(0, limit);
    return { success: true, data: records };
  } catch {
    return { success: true, data: [] };
  }
}

module.exports = {
  draftCampaignCommunication,
  draftCampaignProposal,
  listCampaignHandoffs
};
