const mongoose = require("mongoose");
const crypto = require("crypto");

const { RevenueExecutionMission } = require("../models/RevenueExecutionMission");
const { RevenueExternalActionRequest } = require("../models/RevenueExternalActionRequest");
const { RevenueExternalActionDecision } = require("../models/RevenueExternalActionDecision");
const { buildRequest, buildDecision, buildHandoff } = require("./revenueExternalActionService");

function fail(message, statusCode = 400) {
  throw Object.assign(new Error(message), { statusCode });
}

function hash(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

async function unlockDeliveryForMission(missionId, paymentDetails) {
  if (!missionId || !mongoose.Types.ObjectId.isValid(missionId)) {
    fail("Invalid missionId", 400);
  }

  const mission = await RevenueExecutionMission.findById(missionId);
  if (!mission) {
    fail("Execution mission not found", 404);
  }

  const allowedStatuses = ["client_accepted", "payment_verified"];
  if (!allowedStatuses.includes(mission.productionDelivery?.status)) {
    fail(`Mission not ready for payment verification. Current status: ${mission.productionDelivery?.status}`, 409);
  }

  const existingRequest = await RevenueExternalActionRequest.findOne({
    missionId: mission._id,
    actionType: "payment_verification"
  }).sort({ createdAt: -1 });

  if (existingRequest) {
    if (["handoff_ready", "externally_completed"].includes(existingRequest.status)) {
      return {
        actionRequestId: existingRequest.id,
        handoffPackage: existingRequest.handoffPackage,
        deliveryAuthorized: true,
        idempotent: true
      };
    }
    if (existingRequest.status === "pending_founder") {
      existingRequest.governance = {
        ...(existingRequest.governance || {}),
        actionSpecificApprovalRequired: false,
        autoApprovedByTrustedInternalPayment: true
      };
      await existingRequest.save();
      const decision = buildDecision(existingRequest.toObject(), {
        decision: "approved",
        notes: `Auto-approved via trusted internal payment verification (${paymentDetails.provider})`
      }, null, new Date(paymentDetails.verifiedAt));
      await RevenueExternalActionDecision.create(decision);
      const handoff = buildHandoff({
        ...existingRequest.toObject(),
        status: "handoff_ready",
        latestDecisionHash: decision.decisionHash
      });
      existingRequest.status = "handoff_ready";
      existingRequest.latestDecisionHash = decision.decisionHash;
      existingRequest.handoffPackage = handoff;
      await existingRequest.save();
      mission.productionDelivery = mission.productionDelivery || {};
      mission.productionDelivery.status = "payment_verified";
      mission.productionDelivery.paymentVerifiedAt = paymentDetails.verifiedAt;
      mission.productionDelivery.paymentDetails = {
        paymentId: paymentDetails.paymentId,
        amount: paymentDetails.amount,
        currency: paymentDetails.currency,
        provider: paymentDetails.provider
      };
      mission.deliverableWorkspace = mission.deliverableWorkspace || {};
      mission.deliverableWorkspace.status = "delivery_authorized";
      mission.markModified("productionDelivery");
      mission.markModified("deliverableWorkspace");
      await mission.save();
      return {
        actionRequestId: existingRequest.id,
        handoffPackage: handoff,
        deliveryAuthorized: true,
        missionId: mission.id,
        recovered: true
      };
    }
    fail(`Existing payment verification request is in status '${existingRequest.status}'`, 409);
  }

  const actionRequest = await buildRequest(mission.toObject(), {
    actionType: "payment_verification",
    summary: `Payment verified: ${paymentDetails.amount / 100} ${paymentDetails.currency} (${paymentDetails.provider} payment ${paymentDetails.paymentId})`,
    destination: "internal_delivery_unlock"
  });

  const createdRequest = await RevenueExternalActionRequest.create(actionRequest);

  const decision = buildDecision(createdRequest.toObject(), {
    decision: "approved",
    notes: `Auto-approved via trusted internal payment verification (${paymentDetails.provider})`
  }, null, new Date(paymentDetails.verifiedAt));

  await RevenueExternalActionDecision.create(decision);

  const handoff = buildHandoff({
    ...createdRequest.toObject(),
    status: "handoff_ready",
    latestDecisionHash: decision.decisionHash
  });

  createdRequest.status = "handoff_ready";
  createdRequest.latestDecisionHash = decision.decisionHash;
  createdRequest.handoffPackage = handoff;
  await createdRequest.save();

  mission.productionDelivery = mission.productionDelivery || {};
  mission.productionDelivery.status = "payment_verified";
  mission.productionDelivery.paymentVerifiedAt = paymentDetails.verifiedAt;
  mission.productionDelivery.paymentDetails = {
    paymentId: paymentDetails.paymentId,
    amount: paymentDetails.amount,
    currency: paymentDetails.currency,
    provider: paymentDetails.provider
  };
  mission.deliverableWorkspace = mission.deliverableWorkspace || {};
  mission.deliverableWorkspace.status = "delivery_authorized";
  mission.markModified("productionDelivery");
  mission.markModified("deliverableWorkspace");
  await mission.save();

  return {
    actionRequestId: createdRequest.id,
    handoffPackage: handoff,
    deliveryAuthorized: true,
    missionId: mission.id
  };
}

module.exports = {
  unlockDeliveryForMission
};