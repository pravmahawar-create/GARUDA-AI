const path = require("path");
const { DiscoveryCandidate } = require("../models/DiscoveryCandidate");
const { IncomeGoal } = require("../models/IncomeGoal");
const { RevenueAcquisitionCase } = require("../models/RevenueAcquisitionCase");
const acquisitionService = require("./revenueAcquisitionService");
const { validateApprovedCandidate } = require("./revenueExecutionMissionService");

const DEFAULT_INTERVAL_MS = 180000;

function assessCandidateForAttempt(candidate, options = {}) {
  try {
    validateApprovedCandidate(candidate, {
      rootDir: options.rootDir || path.resolve(__dirname, "../.."),
      now: options.now || new Date(),
      sourceTruthMaxAgeMs: options.sourceTruthMaxAgeMs
    });
    return { draftable: true, reason: "current_specific_client_work_verified" };
  } catch (error) {
    return { draftable: false, reason: String(error.message || error) };
  }
}

function emptySummary(now, intervalMs) {
  return {
    status: "healthy",
    startedAt: now.toISOString(),
    completedAt: null,
    nextCycleAt: new Date(now.getTime() + intervalMs).toISOString(),
    activeGoals: 0,
    approvedCandidatesScanned: 0,
    internalDraftsPrepared: 0,
    staleCasesInvalidated: 0,
    blockedByTruthGate: 0,
    externalSubmissionsPerformed: 0,
    errors: []
  };
}

async function runContinuousAttemptCycle(options = {}) {
  const now = options.now ? new Date(options.now) : new Date();
  const intervalMs = Math.max(60000, Number(options.intervalMs) || DEFAULT_INTERVAL_MS);
  const summary = emptySummary(now, intervalMs);
  const goals = await IncomeGoal.find({ status: "active", "missionPolicy.continuousDiscovery": true });
  summary.activeGoals = goals.length;
  if (!goals.length) {
    summary.completedAt = new Date().toISOString();
    return summary;
  }

  const goalIds = goals.map((goal) => goal._id);
  await IncomeGoal.updateMany({ _id: { $in: goalIds } }, { $set: { "acquisitionLoop.status": "running", "acquisitionLoop.lastError": "" } });
  try {
    const candidates = await DiscoveryCandidate.find({ missionId: { $in: goalIds }, status: "approved" }).sort({ score: -1 }).limit(200);
    summary.approvedCandidatesScanned = candidates.length;
    const existingCases = await RevenueAcquisitionCase.find({ candidateId: { $in: candidates.map((item) => item._id) } });
    const byCandidate = new Map(existingCases.map((item) => [String(item.candidateId), item]));

    for (const candidate of candidates) {
      const assessment = assessCandidateForAttempt(candidate, { ...options, now });
      const existing = byCandidate.get(String(candidate._id));
      if (!assessment.draftable) {
        summary.blockedByTruthGate += 1;
        if (existing && ["proposal_drafted", "changes_requested", "handoff_ready"].includes(existing.status)) {
          await acquisitionService.invalidateOpenCase(String(candidate._id), assessment.reason, now);
          summary.staleCasesInvalidated += 1;
        }
        continue;
      }
      if (!existing || ["changes_requested", "source_invalidated"].includes(existing.status)) {
        await acquisitionService.draftProposal(String(candidate._id), { proposalType: "application" }, { rootDir: options.rootDir });
        summary.internalDraftsPrepared += 1;
      }
    }

    const completedAt = new Date();
    summary.completedAt = completedAt.toISOString();
    await IncomeGoal.updateMany({ _id: { $in: goalIds } }, { $set: {
      "acquisitionLoop.status": "healthy",
      "acquisitionLoop.lastCycleAt": completedAt,
      "acquisitionLoop.nextCycleAt": new Date(now.getTime() + intervalMs),
      "acquisitionLoop.approvedCandidatesScanned": summary.approvedCandidatesScanned,
      "acquisitionLoop.internalDraftsPrepared": summary.internalDraftsPrepared,
      "acquisitionLoop.staleCasesInvalidated": summary.staleCasesInvalidated,
      "acquisitionLoop.blockedByTruthGate": summary.blockedByTruthGate,
      "acquisitionLoop.lastError": ""
    } });
    return summary;
  } catch (error) {
    summary.status = "degraded";
    summary.errors.push(String(error.message || error));
    summary.completedAt = new Date().toISOString();
    await IncomeGoal.updateMany({ _id: { $in: goalIds } }, { $set: {
      "acquisitionLoop.status": "degraded",
      "acquisitionLoop.lastCycleAt": new Date(),
      "acquisitionLoop.nextCycleAt": new Date(now.getTime() + intervalMs),
      "acquisitionLoop.lastError": summary.errors[0]
    } });
    return summary;
  }
}

async function listAttemptStatus() {
  const goals = await IncomeGoal.find({ status: "active" }).sort({ updatedAt: -1 }).limit(100);
  return goals.map((goal) => ({
    incomeGoalId: String(goal._id),
    title: goal.title,
    continuousDiscovery: goal.missionPolicy?.continuousDiscovery === true,
    acquisitionLoop: goal.acquisitionLoop || { status: "waiting" },
    governance: {
      internalPreparationContinuous: true,
      externalSubmissionAutomatic: false,
      actionSpecificFounderApprovalRequired: true,
      verifiedSourceRequired: true
    }
  }));
}

module.exports = {
  DEFAULT_INTERVAL_MS,
  assessCandidateForAttempt,
  emptySummary,
  listAttemptStatus,
  runContinuousAttemptCycle
};
