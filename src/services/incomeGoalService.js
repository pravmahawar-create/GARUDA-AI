const mongoose = require("mongoose");
const { IncomeGoal, INCOME_GOAL_STATUSES } = require("../models/IncomeGoal");
const { founderApprovalGranted } = require("./revenueConversionService");

const DEFAULT_TARGET_AMOUNT = 100000;
const DEFAULT_MILESTONE_COUNT = 4;

function badRequest(message) {
  return Object.assign(new Error(message), { statusCode: 400 });
}

function normalizeTargetAmount(value = DEFAULT_TARGET_AMOUNT) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) throw badRequest("targetAmount must be greater than zero");
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

function buildMilestones(targetAmount, count = DEFAULT_MILESTONE_COUNT) {
  const target = normalizeTargetAmount(targetAmount);
  const milestoneCount = Number(count);
  if (!Number.isInteger(milestoneCount) || milestoneCount < 1 || milestoneCount > 12) {
    throw badRequest("milestoneCount must be an integer between 1 and 12");
  }

  return Array.from({ length: milestoneCount }, (_, index) => {
    const cumulative = index === milestoneCount - 1
      ? target
      : Math.round((target * (index + 1) / milestoneCount + Number.EPSILON) * 100) / 100;
    return {
      sequence: index + 1,
      label: `Milestone ${index + 1}`,
      targetAmount: cumulative,
      achievedAmount: 0,
      status: index === 0 ? "in_progress" : "pending"
    };
  });
}

function requireFounderApproval(context = {}) {
  if (!founderApprovalGranted(context.founderApproved)) {
    throw Object.assign(new Error("Founder approval is required to start an income mission"), { statusCode: 403 });
  }
}

function buildMissionPlan(payload = {}) {
  const targetAmount = normalizeTargetAmount(payload.targetAmount);
  const milestones = buildMilestones(targetAmount, payload.milestoneCount ?? DEFAULT_MILESTONE_COUNT);
  return {
    title: String(payload.title || `Legitimate income mission - INR ${targetAmount}`).trim(),
    targetAmount,
    currency: String(payload.currency || "INR").trim().toUpperCase(),
    deadline: payload.deadline || null,
    milestones,
    constraints: {
      lawfulOnly: true,
      verifiedOpportunitiesOnly: true,
      founderApprovalForExecution: true,
      noIncomeGuarantee: true
    },
    missionPolicy: {
      targetIsMinimum: true,
      stopAtTarget: false,
      continuousDiscovery: true,
      pursueUpsideOpportunities: true,
      idleOnOpportunityGap: false,
      controlRoom: "mobile_first"
    },
    workflow: [
      "discover_lawful_opportunities",
      "verify_and_rank",
      "request_founder_approval",
      "execute_approved_work",
      "verify_payment",
      "record_revenue",
      "settle_payout",
      "continue_discovery_beyond_target"
    ],
    optimizationTargetOnly: true,
    requiresFounderApproval: true
  };
}

async function previewIncomeGoal(payload = {}) {
  return { ...buildMissionPlan(payload), writeAllowed: false };
}

async function createIncomeGoal(payload = {}, context = {}) {
  requireFounderApproval(context);
  const plan = buildMissionPlan(payload);
  const goal = await IncomeGoal.create({
    title: plan.title,
    targetAmount: plan.targetAmount,
    currency: plan.currency,
    deadline: plan.deadline,
    constraints: plan.constraints,
    missionPolicy: plan.missionPolicy,
    milestones: plan.milestones,
    status: "active",
    auditTrail: [{ action: "income_mission_started", actor: context.actor || "founder", note: payload.note || "" }]
  });
  return { goal: goal.toJSON(), workflow: plan.workflow, optimizationTargetOnly: true };
}

async function listIncomeGoals(filters = {}) {
  const query = {};
  if (filters.status) {
    if (!INCOME_GOAL_STATUSES.includes(filters.status)) throw badRequest(`status must be one of: ${INCOME_GOAL_STATUSES.join(", ")}`);
    query.status = filters.status;
  }
  const goals = await IncomeGoal.find(query).sort({ createdAt: -1 });
  return goals.map((goal) => goal.toJSON());
}

async function getIncomeGoal(id) {
  if (!mongoose.Types.ObjectId.isValid(String(id || ""))) throw badRequest("Invalid income goal id");
  const goal = await IncomeGoal.findById(id);
  if (!goal) throw Object.assign(new Error("Income goal not found"), { statusCode: 404 });
  return goal.toJSON();
}

module.exports = {
  DEFAULT_TARGET_AMOUNT,
  buildMilestones,
  buildMissionPlan,
  createIncomeGoal,
  getIncomeGoal,
  listIncomeGoals,
  normalizeTargetAmount,
  previewIncomeGoal,
  requireFounderApproval
};
