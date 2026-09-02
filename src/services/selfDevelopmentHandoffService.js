const crypto = require('crypto');
const bodyAwareness = require('../../scripts/mother/bodyAwareness');

// In-memory guard for concurrent proposals
const activeProposals = new Set();
const lastProposalByCapability = new Map();
const COOLDOWN_MS = 5 * 60 * 1000; // 5 min for tests, production could be longer

function createSelfDevelopmentProposal(options = {}) {
  const snapshot = bodyAwareness.getCurrentBodyState(options);
  const candidates = bodyAwareness.generateSelfDevelopmentCandidates(snapshot, options);
  const selection = bodyAwareness.selectSelfDevelopmentTarget(snapshot, options);
  if (!selection.selectedCapability) {
    return {
      status: selection.status,
      proposal: null,
      snapshot,
      selection,
      candidates,
      reason: selection.selectionReasons ? selection.selectionReasons.join('; ') : 'no eligible target'
    };
  }
  // Ground goal using a synthetic parsedGoal
  const parsedGoal = { rawGoal: `self-development for ${selection.selectedCapability.capabilityId}`, intent: 'self_development_meta', actionType: 'analysis' };
  const grounding = bodyAwareness.groundSelfDevelopmentGoal(parsedGoal, { ...options, rootDir: options.rootDir || process.cwd() });
  const plannedTasks = bodyAwareness.buildSelfDevelopmentPlannedTasks(grounding.goal);
  const proposalId = `sdp_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const proposal = {
    id: proposalId,
    source: 'body_awareness',
    capabilityId: selection.selectedCapability.capabilityId,
    capabilityName: selection.selectedCapability.name,
    previousStatus: selection.selectedCapability.previousStatus,
    expectedImprovement: selection.selectedCapability.expectedImprovement,
    weaknessEvidence: selection.selectedCapability.supportingEvidence || [],
    selectionReasons: selection.selectedCapability.selectionReasons || [],
    improvementGoal: grounding.goal,
    plannedTasks,
    loopRequest: plannedTasks.find(t => t.loopRequest)?.loopRequest || null,
    confidence: selection.selectedCapability.ownershipConfidence || 0,
    priorityScore: selection.selectedCapability.priorityScore,
    requiresFounderApproval: true, // engineering modification always requires approval for permanent
    status: 'PROPOSED',
    snapshotId: snapshot.snapshotId,
    createdAt: new Date().toISOString(),
  };
  return { status: 'PROPOSED', proposal, snapshot, selection, grounding, candidates };
}

function classifyProposal(proposal) {
  if (!proposal) return { isEngineering: false, requiresFounderApproval: false };
  const isEngineering = Boolean(proposal.loopRequest || (proposal.improvementGoal && proposal.improvementGoal.actionType === 'modification'));
  return { isEngineering, requiresFounderApproval: proposal.requiresFounderApproval !== false };
}

async function executeSelfDevelopmentProposal(proposal, execOptions = {}) {
  if (!proposal || !proposal.id) throw Object.assign(new Error('Valid proposal required'), { statusCode: 400 });
  const founderApproved = execOptions.founderApproved === true;
  const dryRun = execOptions.dryRun === true;
  const capId = proposal.capabilityId;

  // Recursion / dedup guards
  if (activeProposals.has(capId)) {
    return { status: 'BLOCKED_CONCURRENT', reason: `Proposal for ${capId} already in progress`, proposalId: proposal.id };
  }
  const last = lastProposalByCapability.get(capId);
  if (last && (Date.now() - last.timestamp) < COOLDOWN_MS && last.outcome !== 'failed') {
    // Allow retry if last was failed, otherwise cooldown
    if (last.outcome === 'success') {
      return { status: 'COOLDOWN', reason: `Recently completed ${capId} at ${new Date(last.timestamp).toISOString()}`, proposalId: proposal.id, last };
    }
  }
  // Check memory for recent identical proposal to prevent infinite retry on repeated failure
  try {
    const memory = require('./persistentMemory/memoryService');
    const recent = memory.recall({ query: capId, limit: 10 }) || [];
    const recentFails = recent.filter(e => e.outcome === 'failure' && e.tags && e.tags.includes('self_development') && (e.context?.capabilityId === capId));
    if (recentFails.length >= 3) {
      return { status: 'BLOCKED_REPEATED_FAILURE', reason: `${capId} has ${recentFails.length} recent failures, cooldown required`, proposalId: proposal.id };
    }
  } catch {}

  activeProposals.add(capId);
  let pipelineResult = null;
  let finalStatus = 'EXPERIMENTING';
  try {
    const missionText = proposal.improvementGoal && proposal.improvementGoal.capabilityTarget
      ? `Implement self-development improvement for ${capId}: connect ${proposal.improvementGoal.capabilityTarget.implementationLocations?.[0] || capId}`
      : `Implement self-development improvement for ${capId}`;
    const { executeMission } = require('./engineeringPipeline/engineeringPipeline');
    pipelineResult = await executeMission(missionText, {
      rootDir: execOptions.rootDir || process.cwd(),
      founderApproved,
      founderApproval: founderApproved,
      maxRetries: execOptions.maxRetries || 2,
      dryRun: dryRun ? true : false,
    });
    // Map pipeline status to self-development status
    if (pipelineResult._founderApprovalBlocked) finalStatus = 'GOVERNANCE_PENDING';
    else if (pipelineResult.status === 'completed') finalStatus = 'VERIFIED';
    else if (pipelineResult.status === 'needs_fix' || pipelineResult.status === 'failed') finalStatus = 'FAILED_VERIFICATION';
    else finalStatus = 'EXPERIMENTING';

    // Record outcome in memory
    try {
      const memory = require('./persistentMemory/memoryService');
      memory.remember({
        type: 'self_development',
        action: missionText,
        outcome: finalStatus === 'VERIFIED' ? 'success' : (finalStatus === 'GOVERNANCE_PENDING' ? 'blocked' : 'failure'),
        tags: ['self_development', capId, finalStatus.toLowerCase()],
        context: {
          proposalId: proposal.id,
          capabilityId: capId,
          previousStatus: proposal.previousStatus,
          mission: missionText,
          pipelineStatus: pipelineResult.status,
          reviewVerdict: pipelineResult.reviewVerdict,
          filesModified: pipelineResult.filesModified,
          governance: founderApproved ? 'founder_approved' : 'worktree_only',
          finalStatus,
        },
      });
    } catch {}

    lastProposalByCapability.set(capId, { timestamp: Date.now(), outcome: finalStatus === 'VERIFIED' ? 'success' : 'failure', pipelineStatus: pipelineResult.status });

    // Return structured result to self-development layer
    return {
      status: finalStatus,
      proposalId: proposal.id,
      capabilityId: capId,
      pipelineResult,
      governance: founderApproved ? 'approved' : 'worktree_experiment_only',
      evidence: {
        proposal,
        pipelineEvidence: pipelineResult.evidence,
        reviewVerdict: pipelineResult.reviewVerdict,
        steps: pipelineResult.steps,
      },
    };
  } catch (err) {
    return { status: 'FAILED', proposalId: proposal.id, capabilityId: capId, error: err.message };
  } finally {
    activeProposals.delete(capId);
  }
}

function getActiveProposals() { return Array.from(activeProposals); }
function clearGuards() { activeProposals.clear(); lastProposalByCapability.clear(); }

module.exports = {
  createSelfDevelopmentProposal,
  classifyProposal,
  executeSelfDevelopmentProposal,
  getActiveProposals,
  clearGuards,
  _activeProposals: activeProposals,
  _lastMap: lastProposalByCapability,
};
