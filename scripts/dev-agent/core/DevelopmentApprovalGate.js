class DevelopmentApprovalGate {
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
      context.approvalState?.founderApproved ||
      this.defaultState.founderApprovalToken ||
      this.defaultState.founderApproved
    );

    if (!founderApproved) {
      return {
        allowed: false,
        status: "BLOCKED_BY_APPROVAL",
        reason: "founder_approval_required",
        founderApprovalRequired: true,
        blockedActions: this.blockedActions.slice(),
        blockedReason: "Explicit founder approval token or state is required before writes, commits, deploys, or paid API calls."
      };
    }

    return {
      allowed: true,
      status: "APPROVED",
      reason: "founder_approval_present",
      founderApprovalRequired: true,
      blockedActions: this.blockedActions.slice(),
      blockedReason: "None"
    };
  }

  canWrite(context = {}) {
    return this.evaluate(context);
  }
}

const developmentApprovalGate = new DevelopmentApprovalGate();

module.exports = DevelopmentApprovalGate;
module.exports.DevelopmentApprovalGate = DevelopmentApprovalGate;
module.exports.developmentApprovalGate = developmentApprovalGate;