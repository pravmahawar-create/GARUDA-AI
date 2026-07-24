const crypto = require("crypto");
const mongoose = require("mongoose");
const { DiscoveryCandidate } = require("../models/DiscoveryCandidate");
const { RevenueAcquisitionCase } = require("../models/RevenueAcquisitionCase");
const { RevenueWorkIntake } = require("../models/RevenueWorkIntake");
const ProjectMemoryEngine = require("../../scripts/dev-agent/core/ProjectMemoryEngine");

const OUTREACH_STATES = [
  "draft",
  "approved",
  "queued",
  "sending",
  "sent",
  "delivered",
  "opened",
  "responded",
  "meeting_requested",
  "won",
  "lost",
  "failed"
];

const CONNECTORS = ["email", "client_portal", "crm_note"];

function fail(message, statusCode = 400) {
  throw Object.assign(new Error(message), { statusCode });
}

function hash(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

class OutreachQueueManager {
  constructor({ memoryFilePath } = {}) {
    this.memoryEngine = new ProjectMemoryEngine({ memoryFilePath });
    this.inMemoryQueue = [];
  }

  createOutreachItem(opportunity, proposal, options = {}) {
    const oppId = String(opportunity.externalId || opportunity.id || opportunity._id || "");
    const propId = String(proposal.proposalHash || proposal.id || "");
    const company = String(opportunity.company || opportunity.company_name || "Verified Client").trim();
    const channel = String(options.channel || "client_portal").toLowerCase();

    if (!oppId || !propId) fail("Opportunity ID and Proposal ID are required for outreach queue item", 400);
    if (!CONNECTORS.includes(channel)) fail(`Channel must be one of: ${CONNECTORS.join(", ")}`, 400);

    const now = new Date().toISOString();
    const item = {
      queueId: `outreach-${crypto.randomBytes(6).toString("hex")}`,
      opportunityId: oppId,
      company,
      contactChannel: channel,
      proposalId: propId,
      currentStatus: "draft",
      createdTime: now,
      lastUpdate: now,
      retryCount: 0,
      maxRetries: Number(options.maxRetries) || 3,
      recipientContact: String(options.recipientContact || opportunity.url || "client_portal").trim(),
      messageBody: String(options.messageBody || proposal.summary || "").trim(),
      founderAuthorization: {
        authorized: false,
        actor: null,
        authorizedAt: null
      },
      auditLog: [{ status: "draft", timestamp: now, note: "Outreach item drafted" }],
      conversationHistory: []
    };

    this.inMemoryQueue.push(item);
    return item;
  }

  authorizeOutreach(queueId, context = {}) {
    const item = this.inMemoryQueue.find((q) => q.queueId === queueId);
    if (!item) fail("Outreach queue item not found", 404);
    if (context.founderAuthorized !== true || String(context.actor || "").toLowerCase() !== "founder") {
      fail("Explicit Founder authorization is strictly required for all outbound communications", 403);
    }

    const now = new Date().toISOString();
    item.founderAuthorization = {
      authorized: true,
      actor: "founder",
      authorizedAt: now,
      authorizationHash: hash({ queueId, proposalId: item.proposalId, actor: "founder", authorizedAt: now })
    };

    item.currentStatus = "approved";
    item.lastUpdate = now;
    item.auditLog.push({ status: "approved", timestamp: now, note: "Founder approval granted" });

    return item;
  }

  enqueueOutreach(queueId) {
    const item = this.inMemoryQueue.find((q) => q.queueId === queueId);
    if (!item) fail("Outreach queue item not found", 404);
    if (!item.founderAuthorization.authorized) fail("Cannot queue outreach without Founder authorization", 403);

    const now = new Date().toISOString();
    item.currentStatus = "queued";
    item.lastUpdate = now;
    item.auditLog.push({ status: "queued", timestamp: now, note: "Queued for dispatch" });

    return item;
  }

  dispatchOutreach(queueId, connectorHandler) {
    const item = this.inMemoryQueue.find((q) => q.queueId === queueId);
    if (!item) fail("Outreach queue item not found", 404);
    if (item.currentStatus !== "queued") fail("Outreach item must be in queued state to dispatch", 409);
    if (!item.founderAuthorization.authorized) fail("Outbound execution blocked: Missing Founder authorization", 403);

    const now = new Date().toISOString();
    item.currentStatus = "sending";
    item.lastUpdate = now;
    item.auditLog.push({ status: "sending", timestamp: now, note: "Connector dispatch initiated" });

    try {
      const dispatchResult = connectorHandler ? connectorHandler(item) : { success: true, messageId: `msg-${Date.now()}` };
      item.currentStatus = "sent";
      item.lastUpdate = new Date().toISOString();
      item.auditLog.push({ status: "sent", timestamp: item.lastUpdate, note: `Sent via ${item.contactChannel}: ${dispatchResult.messageId}` });
      return { success: true, item, dispatchResult };
    } catch (err) {
      item.retryCount += 1;
      if (item.retryCount >= item.maxRetries) {
        item.currentStatus = "failed";
        item.auditLog.push({ status: "failed", timestamp: new Date().toISOString(), note: `Dispatch failed: ${err.message}` });
      } else {
        item.currentStatus = "queued";
        item.auditLog.push({ status: "queued", timestamp: new Date().toISOString(), note: `Retry #${item.retryCount} scheduled: ${err.message}` });
      }
      item.lastUpdate = new Date().toISOString();
      return { success: false, error: err.message, item };
    }
  }

  recordClientResponse(queueId, responsePayload = {}) {
    const item = this.inMemoryQueue.find((q) => q.queueId === queueId);
    if (!item) fail("Outreach queue item not found", 404);

    const now = new Date().toISOString();
    const responseType = String(responsePayload.responseType || "client_message").toLowerCase();

    const conversationEntry = {
      messageId: `resp-${Date.now()}`,
      sender: "client",
      body: String(responsePayload.body || "").trim(),
      receivedAt: now
    };

    item.conversationHistory.push(conversationEntry);

    if (responseType === "meeting_requested") {
      item.currentStatus = "meeting_requested";
    } else if (responseType === "award_offer" || responseType === "won") {
      item.currentStatus = "won";
    } else if (responseType === "rejected" || responseType === "lost") {
      item.currentStatus = "lost";
    } else {
      item.currentStatus = "responded";
    }

    item.lastUpdate = now;
    item.auditLog.push({ status: item.currentStatus, timestamp: now, note: `Client response recorded: ${responseType}` });

    return item;
  }

  getOutreachMetrics() {
    const items = this.inMemoryQueue;
    const pendingOutreach = items.filter((i) => ["draft", "approved", "queued"].includes(i.currentStatus)).length;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const sentToday = items.filter((i) => ["sent", "delivered", "opened", "responded", "meeting_requested", "won"].includes(i.currentStatus) && new Date(i.lastUpdate) >= startOfDay).length;
    const responsesReceived = items.filter((i) => ["responded", "meeting_requested", "won"].includes(i.currentStatus)).length;
    const meetingsRequested = items.filter((i) => i.currentStatus === "meeting_requested").length;
    const dealsProgressing = items.filter((i) => ["responded", "meeting_requested", "won"].includes(i.currentStatus)).length;
    const blockedDeals = items.filter((i) => i.currentStatus === "failed" || (i.currentStatus === "draft" && !i.founderAuthorization.authorized)).length;

    return {
      totalOutreachItems: items.length,
      pendingOutreach,
      sentToday,
      responsesReceived,
      meetingsRequested,
      dealsProgressing,
      blockedDeals
    };
  }
}

const defaultQueueManager = new OutreachQueueManager();

module.exports = {
  OUTREACH_STATES,
  CONNECTORS,
  OutreachQueueManager,
  defaultQueueManager
};
