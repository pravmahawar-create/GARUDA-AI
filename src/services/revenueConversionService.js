const mongoose = require("mongoose");
const { Opportunity } = require("../models/Opportunity");
const { RevenueRecord } = require("../models/RevenueRecord");
const revenueService = require("./revenueService");

function founderApprovalGranted(value) {
  return value === true || String(value || "").trim().toLowerCase() === "true";
}

function buildConversionPreview(opportunity, payload = {}) {
  if (!opportunity) {
    const error = new Error("Opportunity is required");
    error.statusCode = 400;
    throw error;
  }

  if (opportunity.stage === "lost") {
    const error = new Error("Lost opportunity cannot be converted to revenue");
    error.statusCode = 409;
    throw error;
  }

  const amount = payload.amount ?? opportunity.potentialValue;
  if (typeof amount !== "number" || Number.isNaN(amount) || amount < 0) {
    const error = new Error("amount must be a non-negative number");
    error.statusCode = 400;
    throw error;
  }

  const paymentVerified = payload.paymentVerified === true;
  const status = paymentVerified ? "received" : "pending";

  return {
    opportunityId: String(opportunity._id || opportunity.id),
    title: opportunity.title,
    client: opportunity.client,
    amount,
    currency: payload.currency || opportunity.currency || "INR",
    source: payload.source || opportunity.source || "direct",
    status,
    paymentVerified,
    currentOpportunityStage: opportunity.stage,
    opportunityStageAfter: paymentVerified ? "won" : opportunity.stage,
    requiresFounderApproval: true,
    writeAllowed: false
  };
}

async function findOpportunity(opportunityId) {
  if (!mongoose.Types.ObjectId.isValid(String(opportunityId || ""))) {
    const error = new Error("Invalid opportunity id");
    error.statusCode = 400;
    throw error;
  }

  const opportunity = await Opportunity.findById(opportunityId);
  if (!opportunity) {
    const error = new Error("Opportunity not found");
    error.statusCode = 404;
    throw error;
  }
  return opportunity;
}

async function previewConversion(opportunityId, payload = {}) {
  const opportunity = await findOpportunity(opportunityId);
  return buildConversionPreview(opportunity, payload);
}

async function executeConversion(opportunityId, payload = {}, context = {}) {
  if (!founderApprovalGranted(context.founderApproved)) {
    const error = new Error("Founder approval is required before revenue conversion");
    error.statusCode = 403;
    throw error;
  }

  const opportunity = await findOpportunity(opportunityId);
  const preview = buildConversionPreview(opportunity, payload);
  const duplicate = await RevenueRecord.findOne({
    opportunityId: opportunity._id,
    status: { $in: ["pending", "received"] }
  });

  if (duplicate) {
    const error = new Error("Active revenue record already exists for this opportunity");
    error.statusCode = 409;
    throw error;
  }

  const result = await revenueService.createRevenue({
    amount: preview.amount,
    currency: preview.currency,
    source: preview.source,
    client: preview.client,
    status: preview.status,
    notes: payload.notes || `Converted from opportunity: ${opportunity.title}`,
    opportunityId: String(opportunity._id)
  });

  return {
    preview: { ...preview, writeAllowed: true },
    record: result.record,
    workflow: result.workflow
  };
}

module.exports = {
  buildConversionPreview,
  executeConversion,
  founderApprovalGranted,
  previewConversion
};
