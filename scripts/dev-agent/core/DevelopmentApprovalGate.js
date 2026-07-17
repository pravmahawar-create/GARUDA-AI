class ApprovalGate {
  constructor(defaultState = {}) {
    this.defaultState = defaultState;

    this.blockedActions = [
      "file_write",
      "code_patch",
      "commit",
      "push",
      "deploy",
      "paid_api"
    ];
  }

  evaluate(context = {}) {
    const founderApproved = Boolean(
      context.founderApprovalToken ||
      context.founderApproved ||
      (context.approvalState && context.approvalState.founderApproved) ||
      this.defaultState.founderApprovalToken ||
      this.defaultState.founderApproved
    );

    if (!founderApproved) {
      return {
        allowed: false,
        status: "BLOCKED_BY_APPROVAL",
        reason: "founder_approval_required",
        founderApprovalRequired: true,
        blockedActions: [...this.blockedActions],
        blockedReason:
          "Explicit founder approval token or state is required before writes, commits, deploys, or paid API calls."
      };
    }

    return {
      allowed: true,
      status: "APPROVED",
      reason: "founder_approval_present",
      founderApprovalRequired: true,
      blockedActions: [],
      blockedReason: "None"
    };
  }

  canWrite(context = {}) {
    return this.evaluate(context).allowed;
  }
}

const approvalGate = new ApprovalGate();

module.exports = ApprovalGate;
module.exports.ApprovalGate = ApprovalGate;
module.exports.approvalGate = approvalGate;

// Backward compatibility
module.exports.developmentApprovalGate = approvalGate;