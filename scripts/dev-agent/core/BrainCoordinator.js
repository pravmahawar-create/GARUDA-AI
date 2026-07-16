const LocalBrainWorker = require("../workers/LocalBrainWorker");
const { developmentApprovalGate } = require("./DevelopmentApprovalGate");

class BrainCoordinator {
  constructor({ registry, approvalGate = developmentApprovalGate } = {}) {
    this.registry = registry;
    this.approvalGate = approvalGate;
  }

  _createWorker(role) {
    return new LocalBrainWorker({ role });
  }

  _sortTasks(tasks = [], dependencyOrder = []) {
    const orderIndex = new Map(dependencyOrder.map((taskId, index) => [taskId, index]));
    return tasks.slice().sort((left, right) => {
      const leftIndex = orderIndex.has(left.id) ? orderIndex.get(left.id) : Number.MAX_SAFE_INTEGER;
      const rightIndex = orderIndex.has(right.id) ? orderIndex.get(right.id) : Number.MAX_SAFE_INTEGER;
      return leftIndex - rightIndex;
    });
  }

  coordinate(plan, context = {}) {
    if (!plan || typeof plan !== "object") {
      throw new Error("BrainCoordinator requires a structured plan object.");
    }

    const approval = this.approvalGate.evaluate(context);
    const orderedTasks = this._sortTasks(plan.tasks || [], plan.dependencyOrder || []);
    const proposals = [];
    const reviewLog = [];
    const reviewer = this._createWorker("reviewer");

    orderedTasks.forEach((task) => {
      const registryWorker = this.registry && this.registry.getWorker ? this.registry.getWorker(task.workerType) : null;
      const worker = this._createWorker(registryWorker ? registryWorker.type : task.workerType || "general");
      const proposal = worker.propose(task, { goal: plan.goal, plan });
      const review = reviewer.reviewProposal(proposal, { goal: plan.goal, approval });

      proposals.push({
        taskId: task.id,
        workerType: task.workerType,
        worker: registryWorker ? registryWorker.label : task.workerType,
        proposal,
        review
      });

      reviewLog.push({
        taskId: task.id,
        approved: review.approved,
        reviewer: review.reviewer,
        reason: review.reason
      });
    });

    const validatedProposals = proposals.filter((item) => item.review && item.review.approved);
    const failures = reviewLog
      .filter((item) => !item.approved)
      .map((item) => ({
        taskId: item.taskId,
        reason: item.reason,
        reviewer: item.reviewer
      }));

    const unifiedImplementationProposal = {
      goal: plan.goal,
      validatedTaskCount: validatedProposals.length,
      validatedTasks: validatedProposals.map((item) => ({
        taskId: item.taskId,
        workerType: item.workerType,
        title: item.proposal.task && item.proposal.task.title ? item.proposal.task.title : "Untitled Task"
      })),
      mergedReadOnlyNotes: validatedProposals.map((item) => item.proposal.analysis && item.proposal.analysis.note).filter(Boolean),
      status: approval.allowed ? "READY_FOR_WRITE" : "STOPPED_BEFORE_WRITE",
      founderApprovalRequired: true,
      approvalStatus: approval.status
    };

    return {
      approval,
      selectedBrains: plan.selectedBrains || [],
      tasks: orderedTasks,
      proposals,
      reviewLog,
      failures,
      filesCreated: [],
      filesModified: [],
      validationStatus: approval.allowed ? "VALIDATED_READONLY" : "BLOCKED_BY_APPROVAL",
      unifiedImplementationProposal,
      stopReason: approval.allowed ? "none" : approval.blockedReason,
      writeStopped: !approval.allowed
    };
  }
}

module.exports = BrainCoordinator;
module.exports.BrainCoordinator = BrainCoordinator;