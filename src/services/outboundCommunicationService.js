const crypto = require("crypto");
const mongoose = require("mongoose");
const telegramBotService = require("./telegramBotService");

const OutboundMessageSchema = new mongoose.Schema({
  communicationId: { type: String, required: true, unique: true, index: true },
  recipient: { type: String, required: true },
  channel: { type: String, enum: ["email", "telegram", "webhook", "api"], default: "email" },
  subject: { type: String, default: "" },
  body: { type: String, required: true },
  status: {
    type: String,
    enum: ["DRAFTED", "APPROVAL_REQUIRED", "APPROVED", "SENT", "DELIVERED", "REPLIED", "REJECTED"],
    default: "DRAFTED",
    index: true
  },
  founderApproved: { type: Boolean, default: false },
  opportunityId: { type: String, default: null },
  provider: { type: String, default: "governed_test_provider" },
  providerMessageId: { type: String, default: null },
  deliveryStatus: { type: String, default: "PENDING" },
  evidence: { type: mongoose.Schema.Types.Mixed, default: {} },
  auditTrail: [{
    status: String,
    actor: String,
    timestamp: { type: Date, default: Date.now },
    note: String
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const OutboundMessageModel = mongoose.models.OutboundMessage || mongoose.model("OutboundMessage", OutboundMessageSchema);

class OutboundCommunicationService {
  static inMemoryStore = new Map();

  async draftCommunication(payload = {}, options = {}) {
    const recipient = String(payload.recipient || "").trim();
    const body = String(payload.body || "").trim();
    if (!recipient || !body) {
      throw Object.assign(new Error("Recipient and body are required for outbound communication"), { statusCode: 400 });
    }

    const communicationId = `comm_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const founderApproved = options.founderApproved === true || options.founderApproved === "true";
    const status = founderApproved ? "APPROVED" : "APPROVAL_REQUIRED";
    const channel = payload.channel || "email";

    const commData = {
      communicationId,
      recipient,
      channel,
      subject: payload.subject || "GARUDA Commercial Proposal",
      body,
      status,
      founderApproved,
      opportunityId: payload.opportunityId || null,
      provider: channel === "telegram" ? "telegram_bot_api" : "governed_test_provider",
      providerMessageId: null,
      deliveryStatus: "PENDING",
      evidence: payload.evidence || {},
      auditTrail: [{ status, actor: founderApproved ? "founder" : "garuda", timestamp: new Date(), note: "Communication drafted" }]
    };

    if (mongoose.connection.readyState === 1) {
      const doc = new OutboundMessageModel(commData);
      await doc.save();
      return doc.toObject();
    } else {
      OutboundCommunicationService.inMemoryStore.set(communicationId, commData);
      return commData;
    }
  }

  async approveAndSend(communicationId, options = {}) {
    let comm = null;
    if (mongoose.connection.readyState === 1) {
      comm = await OutboundMessageModel.findOne({ communicationId });
    } else {
      comm = OutboundCommunicationService.inMemoryStore.get(communicationId);
    }

    if (!comm) throw Object.assign(new Error("Communication record not found"), { statusCode: 404 });

    const founderApproved = options.founderApproved === true || options.founderApproved === "true" || comm.founderApproved;
    if (!founderApproved) {
      throw Object.assign(new Error("Outbound communication requires explicit Founder approval"), { statusCode: 403 });
    }

    let providerMsgId = `msg_${Date.now()}_${crypto.randomBytes(2).toString("hex")}`;
    let deliveryStatus = "DELIVERED";

    // If channel is Telegram and bot configured, send real Telegram message
    if (comm.channel === "telegram" && telegramBotService.isConfigured() && comm.recipient) {
      try {
        const tgRes = await telegramBotService.sendMessage(comm.recipient, comm.body);
        if (tgRes && tgRes.result && tgRes.result.message_id) {
          providerMsgId = String(tgRes.result.message_id);
        }
      } catch (err) {
        deliveryStatus = "FAILED";
        console.error("[OutboundCommunicationService] Telegram delivery failed:", err.message);
      }
    }

    comm.status = deliveryStatus === "FAILED" ? "APPROVAL_REQUIRED" : "SENT";
    comm.founderApproved = true;
    comm.providerMessageId = providerMsgId;
    comm.deliveryStatus = deliveryStatus;

    const auditEntry = {
      status: comm.status,
      actor: "founder",
      timestamp: new Date(),
      note: `Founder approved outbound message. Provider ID: ${providerMsgId}, Delivery: ${deliveryStatus}`
    };

    if (mongoose.connection.readyState === 1) {
      comm.auditTrail.push(auditEntry);
      comm.updatedAt = new Date();
      await comm.save();
      return comm.toObject();
    } else {
      comm.auditTrail.push(auditEntry);
      OutboundCommunicationService.inMemoryStore.set(communicationId, comm);
      return comm;
    }
  }

  async getCommunication(communicationId) {
    if (mongoose.connection.readyState === 1) {
      return await OutboundMessageModel.findOne({ communicationId }).lean();
    } else {
      return OutboundCommunicationService.inMemoryStore.get(communicationId) || null;
    }
  }
}

module.exports = new OutboundCommunicationService();
