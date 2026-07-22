function assessReadiness(mission, requests = []) {
  const tasks = mission?.workPackages || [];
  const production = mission?.productionDelivery || {};
  const productionStatuses = ["final_approved", "handoff_ready", "delivered", "client_accepted", "payment_verified"];
  const checks = {
    founderApproved: mission?.status === "founder_approved",
    workspaceComplete: mission?.deliverableWorkspace?.status === "complete",
    evidenceComplete: tasks.length > 0 && tasks.every((item) => item.status === "completed" && (item.evidence || []).length),
    qualityPassed: Boolean(production.qualityHash),
    finalDeliveryApproved: productionStatuses.includes(production.status),
    deliveryRecorded: ["delivered", "client_accepted", "payment_verified"].includes(production.status) && Boolean(production.deliveryReceiptHash),
    clientAccepted: ["client_accepted", "payment_verified"].includes(production.status) && Boolean(production.clientAcceptanceHash),
    paymentVerified: production.status === "payment_verified" && Boolean(production.paymentReceiptHash),
    actionApproved: requests.some((item) => ["handoff_ready", "externally_completed"].includes(item.status)),
    externalReceiptVerified: ["delivered", "client_accepted", "payment_verified"].includes(production.status)
  };
  const stage = checks.paymentVerified ? "payment_received_verified" : checks.clientAccepted ? "client_accepted_payment_pending" : checks.deliveryRecorded ? "delivered_acceptance_pending" : checks.finalDeliveryApproved ? "final_approved_delivery_pending" : checks.qualityPassed ? "final_founder_approval_required" : checks.evidenceComplete ? "quality_verification_required" : checks.founderApproved ? "internal_execution_active" : "mission_approval_required";
  const workingMvp = checks.founderApproved && checks.workspaceComplete && checks.evidenceComplete && checks.qualityPassed && checks.finalDeliveryApproved;
  return { stage, workingMvp, revenueClaimAllowed: checks.paymentVerified, checks, truth: checks.paymentVerified ? "Signed provider payment evidence is bound to the accepted delivery and revenue ledger." : "No income is claimed until client acceptance and signed provider payment verification are recorded." };
}
async function getReadiness(missionId) { const mongoose = require("mongoose"); const { RevenueExecutionMission } = require("../models/RevenueExecutionMission"); const { RevenueExternalActionRequest } = require("../models/RevenueExternalActionRequest"); if (!mongoose.Types.ObjectId.isValid(String(missionId || ""))) throw Object.assign(new Error("Invalid execution mission id"), { statusCode: 400 }); const mission = await RevenueExecutionMission.findById(missionId).lean(); if (!mission) throw Object.assign(new Error("Execution mission not found"), { statusCode: 404 }); const requests = await RevenueExternalActionRequest.find({ missionId }).lean(); return assessReadiness(mission, requests); }
module.exports = { assessReadiness, getReadiness };
